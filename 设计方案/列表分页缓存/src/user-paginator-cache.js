'use strict';

/**
 * 用户列表分页缓存：Redis ZSET 排序缓存 + MongoDB keyset 扩展。
 *
 * 设计见 ../分页缓存方案-v3.md。要点：
 *   - list 只缓存「rowId + 类型 + 时间(ms)」，member = `${id}_${type}`，score = 毫秒数。
 *   - 首页只打 Redis；缓存没覆盖到目标深度时，用 keyset 续点从 Mongo 批量补进 ZSET。
 *     一次补多少由 `_read()` 的 `extendLimit` 决定：缺省 `step × extendFactor`（3 倍），
 *     page 模式按目标深度放大并封顶 `extendMax`——省掉「一次只扩 step、要扩好几轮」的往返。
 *   - key 前缀最后一段固定是分数字段名：user:v6:{ownerType}:{uuid}:history:{scene?}:{scoreField}
 *   - **方向进 key**：降序 / 升序各持一份 list + meta（`{prefix}:{combo}:desc|asc:list`）。
 *     ZSET 只缓存一段连续区间，降序从最新端起读、升序从最旧端起读，一段区间贴不住两端，
 *     所以两个方向必须分开缓存；反向索引成员相应是 `${combo}:${dir}`。
 *   - **方向由构造函数给定**（`rev`，缺省 true）：一个实例只服务一个方向，分页方法
 *     （paginate / cursor / page）不收方向参数，游标也不携带方向。要同时提供两种排序，
 *     就按同一个 key 建两个实例（各持自己的 desc / asc 缓存，共用一份反向索引）。
 *   - meta 只存一个整数（源库总条数）：区间水位线 / 到底标志都不需要了 —— 游标只会在
 *     缓存有效时出现，page 模式过期就从头重建，而「读不满一页」的收手由 `count <= prevCount` 兜底。
 *   - 三个 key（list / meta / idx）靠 prefix 里的 hash tag `{uuid}` 落同一 slot，多key Lua 才能跑。
 *   - 源库 `_id` 是字符串（等长、不含下划线），keyset 直接按字符串比，不做 ObjectId 转换。
 *
 * Redis 客户端：本文件内创建单例，地址取 `REDIS_URL`（默认 redis://127.0.0.1:6379/0）。
 * model（mongoose Model，契约见下）仍由构造函数传入。
 */

const Redis = require('ioredis');

const defaults = {
  size: 15,
  step: 200,
  extendFactor: 3, // 读路径一次扩展的条数 = step × extendFactor
  extendMax: 1000, // page 深翻时扩展量的上限
  ttl: 1800,
  rev: true,
  fields: ['type'], // [fieldType, fieldId = '_id']，一般只需传一个
  maxScoreBand: 800,
  maxPageDepth: 10000,
  cursorTtl: 0, // > 0 时游标带过期时间，校验失败抛 1403
};

const ERR = {
  BAD_PARAM: 1400,
  PAGE_DEPTH: 1401,
  BAD_CURSOR: 1402,
  CURSOR_EXPIRED: 1403,
  BUILDING: 1404,
  BACKEND: 1500,
};

class PaginationError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'PaginationError';
    this.code = code;
    if (cause) this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Redis 客户端（模块级单例）
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0';

/**
 * 所有实例与静态方法共用同一个连接。
 * lazyConnect：只被 require（例如形状测试）时不真连；首次发命令才建立连接。
 */
const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});
// 连接级 error 由各方法的 guard 统一包装成 1500，这里吞掉避免 unhandled 'error'
redis.on('error', () => {});

// ---------------------------------------------------------------------------
// Lua 脚本
// ---------------------------------------------------------------------------

const SCRIPT_READ = `
local kList, kMeta, kIdx = KEYS[1], KEYS[2], KEYS[3]
local ttl = tonumber(ARGV[1])
local rev = ARGV[2] == '1'
local win = tonumber(ARGV[3])
local off = tonumber(ARGV[4])
local lo = ARGV[5]
local hi = ARGV[6]
local raw
if rev then
  raw = redis.call('ZREVRANGEBYSCORE', kList, hi, lo, 'WITHSCORES', 'LIMIT', off, win)
else
  raw = redis.call('ZRANGEBYSCORE', kList, lo, hi, 'WITHSCORES', 'LIMIT', off, win)
end
local count = redis.call('ZCARD', kList)
local meta = redis.call('GET', kMeta)
redis.call('EXPIRE', kList, ttl)
redis.call('EXPIRE', kMeta, ttl)
if redis.call('EXISTS', kIdx) == 1 then redis.call('EXPIRE', kIdx, ttl) end
local out = { count, meta or false }
for i = 1, #raw do out[#out + 1] = raw[i] end
return out
`;

const SCRIPT_EXTEND = `
local kList, kMeta, kIdx = KEYS[1], KEYS[2], KEYS[3]
local ttl = tonumber(ARGV[1])
local totalArg = ARGV[2]
local entry = ARGV[3]
local zargs = {}
for i = 4, #ARGV, 2 do
  zargs[#zargs + 1] = ARGV[i + 1]
  zargs[#zargs + 1] = ARGV[i]
end
local added = 0
if #zargs > 0 then added = redis.call('ZADD', kList, unpack(zargs)) end
if entry ~= '' then redis.call('SADD', kIdx, entry) end
-- meta 只存一个整数：源库总条数。首次建缓存时由 totalArg 写入，之后由 publish 增减。
local old = redis.call('GET', kMeta)
local total
if old then total = tonumber(old) else total = tonumber(totalArg) end
redis.call('SET', kMeta, total, 'EX', ttl)
redis.call('EXPIRE', kList, ttl)
redis.call('EXPIRE', kIdx, ttl)
return { added, total }
`;

const SCRIPT_PUBLISH = `
local kList, kMeta, kIdx = KEYS[1], KEYS[2], KEYS[3]
local ttl = tonumber(ARGV[1])
local action = ARGV[2] == '1'
local old = redis.call('GET', kMeta)
if not old then return { -1, 0 } end
local total = tonumber(old)
local changed = 0
if action then
  local zargs = {}
  for i = 3, #ARGV, 2 do
    zargs[#zargs + 1] = ARGV[i + 1]
    zargs[#zargs + 1] = ARGV[i]
  end
  if #zargs > 0 then changed = redis.call('ZADD', kList, unpack(zargs)) end
  total = total + changed
else
  local n = #ARGV - 2
  for i = 3, #ARGV do
    redis.call('ZREM', kList, ARGV[i])
  end
  changed = n
  total = math.max(0, total - n)
end
redis.call('SET', kMeta, total, 'EX', ttl)
redis.call('EXPIRE', kList, ttl)
redis.call('EXPIRE', kIdx, ttl)
return { changed, total }
`;

const shaCache = new Map();

function isNoScript(err) {
  return /NOSCRIPT/i.test(String((err && err.message) || err));
}

/** 先 EVALSHA，NOSCRIPT 时重载 SHA 再来一次。 */
async function runScript(text, keys, argv) {
  let sha = shaCache.get(text);
  try {
    if (!sha) {
      sha = await redis.script('LOAD', text);
      shaCache.set(text, sha);
    }
    return await redis.evalsha(sha, keys.length, ...keys, ...argv);
  } catch (err) {
    if (!isNoScript(err)) {
      throw new PaginationError(ERR.BACKEND, `Redis 脚本执行失败：${err.message}`, err);
    }
  }
  sha = await redis.script('LOAD', text);
  shaCache.set(text, sha);
  try {
    return await redis.evalsha(sha, keys.length, ...keys, ...argv);
  } catch (err) {
    throw new PaginationError(ERR.BACKEND, `Redis 脚本执行失败：${err.message}`, err);
  }
}

/** 统一把底层异常包成 1500，业务错误原样抛。 */
async function guard(msg, fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PaginationError) throw err;
    throw new PaginationError(ERR.BACKEND, `${msg}：${(err && err.message) || err}`, err);
  }
}

// ---------------------------------------------------------------------------
// 游标
// ---------------------------------------------------------------------------

function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/** 解码只做格式 / 过期校验。方向不进游标：不同方向各有自己的 key，不会互相认错。 */
function decodeCursor(raw, now = Date.now) {
  if (raw == null || raw === '') throw new PaginationError(ERR.BAD_CURSOR, '游标为空');
  let obj;
  try {
    obj = JSON.parse(Buffer.from(String(raw), 'base64url').toString('utf8'));
  } catch (err) {
    throw new PaginationError(ERR.BAD_CURSOR, '游标非法');
  }
  if (!obj || typeof obj !== 'object' || !Number.isFinite(obj.t)) {
    throw new PaginationError(ERR.BAD_CURSOR, '游标非法');
  }
  if (obj.e != null) {
    const nowMs = typeof now === 'function' ? now() : now;
    if (nowMs > obj.e) throw new PaginationError(ERR.CURSOR_EXPIRED, '游标已过期');
  }
  return { t: obj.t, m: obj.m, o: obj.o, e: obj.e };
}

const ms = (v) => {
  if (v == null) return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  return new Date(v).getTime();
};

const typeOfMember = (member) => {
  const i = String(member).indexOf('_');
  return i < 0 ? '' : String(member).slice(i + 1);
};

const idOfMember = (member) => {
  const i = String(member).indexOf('_');
  return i < 0 ? String(member) : String(member).slice(0, i);
};

/** 反向索引成员 `${combo}:${dir}` 反解。combo 不含 `:`，按最后一个 `:` 切。 */
function splitEntry(entry) {
  const s = String(entry);
  const i = s.lastIndexOf(':');
  return i < 0 ? [s, 'desc'] : [s.slice(0, i), s.slice(i + 1)];
}

/** 反向索引成员对应的 list / meta 键。 */
const pairOf = (key, entry) => {
  const [combo, dir] = splitEntry(entry);
  return [`${key}:${combo}:${dir}:list`, `${key}:${combo}:${dir}:meta`];
};

/** members 既接受 `{member, score}`，也接受裸 member 字符串（删除场景 score 用不上）。 */
function normalizeMembers(members) {
  const out = [];
  for (const m of [].concat(members || [])) {
    if (m == null) continue;
    if (typeof m === 'string') out.push({ member: m, score: undefined });
    else if (m.member != null) out.push({ member: String(m.member), score: m.score });
  }
  return out;
}

// ---------------------------------------------------------------------------
// UserPaginatorCache
// ---------------------------------------------------------------------------

class UserPaginatorCache {
  constructor(options = {}) {
    const {
      model,
      key,
      where = {},
      types = 'all',
      fields = defaults.fields,
      size = defaults.size,
      step = defaults.step,
      extendFactor = defaults.extendFactor,
      extendMax = defaults.extendMax,
      ttl = defaults.ttl,
      rev = defaults.rev,
      now = Date.now,
      maxScoreBand = defaults.maxScoreBand,
      maxPageDepth = defaults.maxPageDepth,
      cursorTtl = defaults.cursorTtl,
    } = options;

    if (!model) throw new PaginationError(ERR.BAD_PARAM, '缺少 model');
    if (!key || typeof key !== 'string') throw new PaginationError(ERR.BAD_PARAM, '缺少 key 前缀');
    if (!(step >= 2)) throw new PaginationError(ERR.BAD_PARAM, 'step 必须 >= 2');

    const colon = key.lastIndexOf(':');
    const fieldScore = colon < 0 ? '' : key.slice(colon + 1);
    if (!fieldScore) {
      throw new PaginationError(ERR.BAD_PARAM, 'key 最后一段必须是分数字段名，如 user:v6:user:{uuid}:history:act_time');
    }

    const [fieldType, fieldId = '_id'] = [].concat(fields || []);
    if (!fieldType) throw new PaginationError(ERR.BAD_PARAM, 'fields[0]（类型字段名）必填');

    const typeList = types === 'all' ? null : [].concat(types).map(String).sort();
    const combo = typeList ? typeList.join('_') : 'all';

    this.now = now;
    this.opts = {
      model,
      key,
      where,
      types,
      typeList,
      combo,
      fieldScore,
      fieldType,
      fieldId,
      size,
      step,
      extendFactor,
      extendMax,
      ttl,
      rev: Boolean(rev),
      maxScoreBand,
      maxPageDepth,
      cursorTtl,
      keyIdx: `${key}:idx`,
    };
  }

  /**
   * 派生这一份缓存的 key（方向取自构造时的 `rev`）。
   *
   * 降序(desc) 与升序(asc) **各持一份 list + meta**：ZSET 只缓存「一段连续区间」，
   * 降序要从最新端往下读、升序要从最旧端往上读，一段区间不可能同时贴住两端
   * （除非把整个列表都缓存），所以方向必须是 key 的一部分。
   *
   * 反向索引 `{prefix}:idx` **不分方向**，成员为 `${combo}:${dir}`（如 `all:desc`）：
   * publish 靠这一份索引，一次广播就能同时维护两个方向的缓存。
   */
  _keys() {
    const { key, combo, keyIdx, rev } = this.opts;
    const dir = rev ? 'desc' : 'asc';
    return {
      dir,
      entry: `${combo}:${dir}`,
      keyList: `${key}:${combo}:${dir}:list`,
      keyMeta: `${key}:${combo}:${dir}:meta`,
      keyIdx,
    };
  }

  // ---- 公开方法 -----------------------------------------------------------

  /**
   * 统一分页入口。两个基础值，与 cursor() / page() 同风格（不用对象参数）。
   * @param {string|object|number|null} locator
   *   - 游标字符串（内部会 decode）或 decodeCursor() 的结果 → 游标模式；
   *   - 数字 → 页模式（第几页）；
   *   - null / undefined → 页模式第 1 页。
   * @param {number} size 页大小，缺省用构造时的 size
   */
  async paginate(locator = null, size = this.opts.size) {
    if (locator == null || typeof locator === 'number') {
      return this.page(locator == null ? 1 : locator, size);
    }
    const cur = typeof locator === 'string' ? decodeCursor(locator, this.now) : locator;
    return this.cursor(cur, size);
  }

  /** 游标分页：读 → 不够就扩 → 重读，直到取满一页或确认到底。 */
  async cursor(cur = null, size = this.opts.size) {
    let last = null;
    let prevCount = -1;
    for (;;) {
      const state = await this._read(cur, size, 0, true);
      last = state;
      if (state.items.length > size) break; // 含探察项，取满
      if (this._isDone(state)) break; // 已追平源库总数
      if (state.count <= prevCount) break; // 扩展没推进 → 不谎报到底，直接交数据
      prevCount = state.count;
    }
    return this._return(cur, last.items, size, last.total);
  }

  /** 页模式：与游标同构，只是取数带 offset，覆盖目标是 depth。 */
  async page(page = 1, size = this.opts.size) {
    if (!(page >= 1)) throw new PaginationError(ERR.BAD_PARAM, 'page 必须 >= 1');
    const offset = (page - 1) * size;
    if (offset + size > this.opts.maxPageDepth) {
      throw new PaginationError(ERR.PAGE_DEPTH, `翻页深度超限（>${this.opts.maxPageDepth}），请改用游标分页`);
    }
    const depth = offset + size + 1;
    // 深翻页时按目标深度放大一次扩展量（封顶 extendMax），避免「一轮只铺 step 条」铺过去
    const extendLimit = this._extendSize(depth);

    let last = null;
    let prevCount = -1;
    for (;;) {
      const state = await this._read(null, size, offset, true, extendLimit);
      last = state;
      if (state.items.length > size) break;
      if (this._isDone(state)) break;
      if (state.count >= depth) break; // 已覆盖到目标深度
      if (state.count <= prevCount) break;
      prevCount = state.count;
    }
    return this._return(null, last.items, size, last.total);
  }

  // ---- 读 ----------------------------------------------------------------

  /**
   * 读一页 + 取状态。
   * @param {object|null} cur 解码后的游标
   * @param {number} size
   * @param {number} offset page 模式的偏移（游标模式恒 0：同分 band 用 member 过滤，不用 offset）
   * @param {boolean} needExtend 读不满时是否自己扩展（默认 true）
   * @param {number} extendLimit 本次扩展向源库取多少条（缺省 `_extendSize()` = step × extendFactor）
   */
  async _read(cur, size = this.opts.size, offset = 0, needExtend = true, extendLimit = this._extendSize()) {
    const cap = this.opts.maxScoreBand;
    let window = size + 1;
    let state = null;
    let items = null;

    for (;;) {
      state = await this._query(cur, window, offset);
      items = this._bandFilter(cur, state.items);
      if (items.length > size) break; // 取满（含探察项）
      // 窗口被同分 band 吃满 → 2 倍放大重读（上限 MAX_SCORE_BAND）
      if (state.items.length >= window && window < cap) {
        window = Math.min(window * 2, cap);
        continue;
      }
      break;
    }
    state.items = items;

    if (items.length > size || !needExtend) return state;
    if (this._isDone(state)) return state; // 已追平源库总数，不再扩展

    // 扩展一轮（条数由 extendLimit 定，缺省 3×step），然后必须重读一次才能看到刚写进 ZSET 的行
    // （否则末页会丢数据）；needExtend=false 保证本轮不会再二次扩展，是否继续扩交给上层循环按 _isDone() 决定。
    await this._extend(extendLimit);
    return this._read(cur, size, offset, false, extendLimit);
  }

  /**
   * 本次扩展向源库取多少条：缺省 `step × extendFactor`（3 倍），传了 `depth`（page 模式的目标深度）
   * 就按它放大，封顶 `extendMax`。这是 `_extend()` 的 limit 入参来源，也是「一次多取点、少几轮往返」的落点。
   */
  _extendSize(depth = 0) {
    const { step, extendFactor, extendMax } = this.opts;
    return Math.min(Math.max(step * extendFactor, depth), extendMax);
  }

  /** 一段 Lua 换回「数据窗口 + ZCARD + meta」，顺带续期三键。 */
  async _query(cur, window, offset) {
    const rev = this.opts.rev;
    const { keyList, keyMeta, keyIdx } = this._keys();
    const { ttl } = this.opts;
    const lo = cur ? (rev ? '-inf' : String(cur.t)) : '-inf';
    const hi = cur ? (rev ? String(cur.t) : '+inf') : '+inf';
    const raw = await runScript(SCRIPT_READ, [keyList, keyMeta, keyIdx], [
      ttl,
      rev ? '1' : '0',
      window,
      offset,
      lo,
      hi,
    ]);
    const count = Number(raw[0]) || 0;
    const metaRaw = raw[1];
    const items = [];
    for (let i = 2; i + 1 < raw.length; i += 2) {
      items.push({ member: String(raw[i]), score: Number(raw[i + 1]) });
    }
    // total = -1 表示这份缓存还没建（meta 不存在）
    return { items, count, total: metaRaw ? Number(metaRaw) : -1 };
  }

  /** 同分 band 的前缀过滤：已交付的成员靠 member 字典序跳过，不靠 offset 计数。 */
  _bandFilter(cur, items) {
    if (!cur || !cur.m) return items;
    const m = String(cur.m);
    const rev = this.opts.rev;
    return items.filter((it) => (rev ? it.member <= m : it.member >= m));
  }

  /**
   * 从「尚未缓存的那一端」按 keyset 取 `limit` 条补进 ZSET（顺带首次补 total）。
   * @param {number} limit 取多少条，缺省 `step`；读路径由 `_read()` 传 `_extendSize()` 的返回值
   */
  async _extend(limit = this.opts.step) {
    const rev = this.opts.rev;
    const { model, ttl, fieldScore, fieldType, fieldId } = this.opts;
    const { keyList, keyMeta, keyIdx, entry } = this._keys();

    // 1) 尾部探针：拿到 cache 那一端的边界记录作续点
    const probeRaw = await guard('Redis 探针失败', () =>
      rev ? redis.zrange(keyList, 0, 0, 'WITHSCORES') : redis.zrevrange(keyList, 0, 0, 'WITHSCORES')
    );
    const probe =
      probeRaw && probeRaw.length >= 2
        ? { member: String(probeRaw[0]), score: Number(probeRaw[1]) }
        : null;

    // 2) keyset 续点：严格比较（续点那条已经在缓存里了）
    const base = this._buildFilter(null);
    const filter = probe ? this._buildFilter(probe) : base;

    // 3) 首次建缓存时补 total；之后沿用 meta 里的（publish 会自行增减）
    const metaRaw = await guard('读取 meta 失败', () => redis.get(keyMeta));
    const totalArg = metaRaw ? '' : String(await guard('统计源库失败', () => model.countDocuments(base)));

    // 4) 取数
    const rows =
      (await guard('查询源库失败', () =>
        model.find(filter).sort(this._sort()).limit(limit).lean()
      )) || [];

    // 5) 过滤脏数据：按「能否转成合法数字」判断，而非 truthy
    const pairs = [];
    for (const row of rows) {
      const at = ms(row[fieldScore]);
      const id = row[fieldId];
      const type = row[fieldType];
      if (!Number.isFinite(at)) continue; // 零日期 / 非法时间 → NaN，ZADD 会直接报错
      if (id == null || type == null) continue;
      pairs.push(`${id}_${type}`, String(Math.trunc(at)));
    }

    // 6) 原子写回（顺带登记反向索引成员，并把首次算出的 total 落进 meta）
    await runScript(SCRIPT_EXTEND, [keyList, keyMeta, keyIdx], [
      ttl,
      totalArg,
      entry, // 反向索引成员：combo:dir
      ...pairs,
    ]);
  }

  /** Mongo 排序规格：先分数字段，再 id 兜底（顺序必须和 ZSET member 的字典序一致）。 */
  _sort() {
    const { fieldScore, fieldId, rev } = this.opts;
    return { [fieldScore]: rev ? -1 : 1, [fieldId]: rev ? -1 : 1 };
  }

  /** 业务 where + 类型组合 + （可选）keyset 续点。`_id` 是字符串，直接比。 */
  _buildFilter(probe) {
    const { where, typeList, fieldType, fieldScore, fieldId, rev } = this.opts;
    const conds = [{ ...where }];
    if (typeList) conds.push({ [fieldType]: { $in: typeList } });
    if (probe) {
      const at = new Date(probe.score);
      const op = rev ? '$lt' : '$gt';
      conds.push({
        $or: [
          { [fieldScore]: { [op]: at } },
          { [fieldScore]: at, [fieldId]: { [op]: idOfMember(probe.member) } },
        ],
      });
    }
    return conds.length === 1 ? conds[0] : { $and: conds };
  }

  /**
   * 是否已到底：这份缓存已经追平源库总数（`total < 0` 表示还没建缓存，不算到底）。
   *
   * meta 里不存「是否已触达某一端」的标志：缓存区间总是从该方向的起始端连续生长，
   * 而「读不满一页」时的收手由上层循环的 `count <= prevCount` 兜底，
   * 两条路径合起来已经覆盖「到底」与「扩展推不动」两种情况。
   */
  _isDone(state) {
    return state.total >= 0 && state.count >= state.total;
  }

  // ---- 收尾 --------------------------------------------------------------

  _return(cur, items, size, total) {
    const list = items.slice(0, size).map((it) => ({
      id: idOfMember(it.member),
      type: typeOfMember(it.member),
      score: it.score,
      member: it.member,
    }));
    if (items.length <= size) return { list, next: null, total };

    const probe = items[size];
    const anchor = items[size - 1];
    // 游标不带方向：两个方向各有自己的 key，续读方向由请求侧选中的实例决定。
    const payload = { t: probe.score };
    if (anchor && probe.score === anchor.score) {
      // 页边界落在同分 band 内：带上探察 member（下一页靠字典序接着读）与 band 内已交付数
      payload.m = probe.member;
      payload.o = (cur && cur.m && cur.t === anchor.score ? Number(cur.o) || 0 : 0) + this._tailRun(items, size);
    }
    if (this.opts.cursorTtl > 0) payload.e = this.now() + this.opts.cursorTtl * 1000;
    return { list, next: encodeCursor(payload), total };
  }

  /** 本页内与最后一条同分的尾部连续条数（同分 band 已交付计数的一部分）。 */
  _tailRun(items, size) {
    const anchor = items[size - 1];
    if (!anchor) return 0;
    let n = 0;
    for (let i = size - 1; i >= 0 && items[i].score === anchor.score; i -= 1) n += 1;
    return n;
  }

  // ---- 写入侧 ------------------------------------------------------------

  /**
   * 新增 / 删除一批记录时，广播到该前缀下所有已建缓存的「组合 + 方向」。
   *
   * 索引 `{prefix}:idx` **只有一份**（不带方向），成员是 `${combo}:${dir}`；
   * list / meta 才是每个方向各一份。之所以这样分：写入侧无法预知之后会被哪个
   * 方向读到，一次 publish 必须把新数据同时喂给已存在的 desc 与 asc 两份缓存，
   * 才不会出现「降序看得见、升序看不见」；索引若也按方向拆开，业务就得自己调两次。
   * 因此循环里的每个索引成员各自落一组自己的 list / meta，互不影响。
   *
   * @param {string} key 前缀（如 user:v6:user:{uuid}:history:subscribe:act_time）
   * @param {1|0} action 1 = 新增（add），0 = 删除（del）
   * @param {Array<{member: string, score?: number|string|Date}|string>} members
   *   add 时每项需带 score（ZADD 靠它定序）；del 时可只给 member 字符串。
   * @param {number} ttl 三键 TTL（秒）
   * @returns {Promise<{changed: string[], stale: string[]}>} 元素形如 `all:desc` / `article_ticker:asc`
   */
  static async publish(key, action = 1, members = [], ttl = defaults.ttl) {
    if (!key) throw new PaginationError(ERR.BAD_PARAM, 'publish 需要 key');
    const keyIdx = `${key}:idx`;
    const entries = await guard('读取反向索引失败', () => redis.smembers(keyIdx));
    const list = normalizeMembers(members);
    const changed = [];
    const stale = [];

    for (const entry of entries) {
      const [combo] = splitEntry(entry);
      const picked = [];
      for (const m of list) {
        if (!m.member) continue;
        if (combo !== 'all' && !combo.split('_').includes(typeOfMember(m.member))) continue;
        picked.push(m.member);
        if (action) picked.push(String(Math.trunc(ms(m.score))));
      }
      if (!picked.length) continue;

      const argv = [ttl, action ? '1' : '0', ...picked];
      const res = await runScript(SCRIPT_PUBLISH, [...pairOf(key, entry), keyIdx], argv);
      const n = Number(res[0]);
      if (n < 0) {
        // 这份缓存已过期：摘掉索引项（唯一允许摘索引的地方）
        await guard('清理反向索引失败', () => redis.srem(keyIdx, entry));
        stale.push(entry);
      } else {
        changed.push(entry);
      }
    }
    return { changed, stale };
  }

  /** 数据整体失效：清掉该前缀下所有「组合 + 方向」的 list / meta 与反向索引。 */
  static async clear(key) {
    if (!key) throw new PaginationError(ERR.BAD_PARAM, 'clear 需要 key');
    const keyIdx = `${key}:idx`;
    const entries = await guard('读取反向索引失败', () => redis.smembers(keyIdx));
    const keys = [];
    for (const entry of entries) keys.push(...pairOf(key, entry));
    keys.push(keyIdx);
    if (keys.length) await guard('清理缓存失败', () => redis.del(...keys));
    return entries.length;
  }
}

module.exports = {
  UserPaginatorCache,
  PaginationError,
  decodeCursor,
  encodeCursor,
  redis,
  defaults,
  ERR,
  // 测试/调试用
  _internal: { runScript, ms, typeOfMember, idOfMember, normalizeMembers, splitEntry, pairOf, SCRIPT_READ, SCRIPT_EXTEND, SCRIPT_PUBLISH },
};
