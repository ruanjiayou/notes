'use strict';

/**
 * ============================================================================
 * ListPagination —— 列表分页缓存（游标分页 + Redis ZSET + meta 水位线）
 * 实现依据：《分页缓存方案.md》；Redis 客户端固定 node-redis v4+
 * ============================================================================
 *
 * 依赖
 *   redis : ../config.js（项目根）的模块级单例（启动时 setConfig({ redis }) 注入一次），
 *           本文件通过 redis() 惰性取用，所以 require 之后再注入也没问题；
 *   model : 构造参数传入（源库），契约见下。
 *
 * 表字段（fields 固定三个，按位置解构，不排序）
 *   fields = [scoreField, idField, typeField]，缺省 ['modified_time', 'res_id', 'res_type']
 *     scoreField 时间（MySQL DATETIME，Sequelize 取出来是 Date）：既是排序键，也是 ZSET 的 score。
 *                两个方向的转换都在 _extend 里做：源库 Date -> ZSET 的毫秒数（new Date(v).getTime()），
 *                续点的毫秒数回查源库时再转回 Date；
 *     idField    记录 id；typeField 资源类型。
 *
 * 排序
 *   order = [[scoreField, 'DESC'|'ASC'], [idField, 'DESC'|'ASC']]（Sequelize 规格），
 *   方向由 rev 决定，默认倒序；
 *   同分由 id 收敛，所以要求 id **等长且不含下划线**：
 *   等长（uuid / 定长 id）才能与 ZSET 同分成员（id_type）的字节序一致 —— 前 36 字符即 id；
 *   不含下划线才能用 split('_') 把 member 解回 [id, type]。
 *
 * key 组成
 *   keyList  = 前缀 + ':' + 类型组合 + ':list'
 *   keyMeta  = 前缀 + ':' + 类型组合 + ':meta'
 *   keyIndex = 前缀 + ':idx'（反向索引 SET，同一前缀下所有组合共用，成员是组合名）
 *
 * member 组成
 *   恒为 id + '_' + type —— 与类型组合无关，同一前缀下所有组合共用同一套 member 字符串。
 *   单类型组合里 type 后缀是常量，排序仍由 id 部分决定，不影响同分定序。
 *
 * 游标（方案 5.1 / 5.3）
 *   base64url({ t, m?, o?, e })
 *     t = items[size].score（探察项 —— 下一条待交付记录），数字；
 *     m / o 仅当 probe.score === anchor.score（页边界落在同分 band 内）时携带：
 *        m = items[size] 的 member（探察项），o = 该 band 内已交付成员累计数；
 *     e = 签发时刻 + ttl（毫秒）。
 *   **编码在类内、解码在类外**：decodeCursor 由中间件先解析，类只接受 { t, m?, o? }。
 *
 * 读路径：只用 score 区间查询（ZRANGEBYSCORE / ZREVRANGEBYSCORE），不用 rank 系列、也不用 ZRANGE 按下标
 *   取数恒为 size+1 条：items[0..size-1] 交付，items[size] 是探察项（只用于判断有无下一页）。
 *     首页          -> 全区间 LIMIT 0 (size+1)
 *     无 m 的游标    -> 闭区间从 t 读起（t 就是探察项的 score），LIMIT 0 (size+1)
 *     有 m 的游标    -> 同样闭区间 t，但窗口放到 o + size + 1，再按 member 字典序过滤掉同 band 已交付前缀：
 *                      倒序保留 m <= cursor.m；升序保留 m >= cursor.m
 *   过滤用字典序比较、不用 o 计数跳过：band 内已交付前缀有成员被删时计数会整体偏移而漏读。
 *   窗口读满且过滤后仍不足 size+1 时按 2 倍放大重读（上限 MAX_SCORE_BAND），
 *   所以 o 被低估只会多读，不会漏。
 *
 * 结束判定（INV-1）
 *   next 为空 ⟺「取不足 size+1 条」且「meta.over === true」。
 *
 * 扩展（方案 7.2 / 7.3）
 *   每次先取 meta 判断，再从 ZSET 尾部（续点）固定取 step 条旧数据并原子写回
 *   ZSET + meta（INV-3），两个 key 同一个 TTL；无锁、不返回 1429。
 *   首次建立某个组合的缓存时，把组合名写进反向索引，供 publish 使用。
 *
 * 写入侧（方案 7.3 旁路增量，静态方法 publish）
 *   只传 key 前缀，从反向索引取候选组合逐个处理：meta 存在才受理；
 *   返回 -1 说明该组合的缓存已过期，把它从索引里剔除（下次请求会按 where 从源库重建）。
 *
 * model 契约（Sequelize / MySQL）
 *   model.findAll({ where, order, limit }) -> records[]
 *   model.count({ where })                -> number
 *     where : Sequelize 条件；数组即 IN（{ res_type: ['article','ticker'] }）；
 *             扩展时 keyset 续点也由调用方拼进 where（[Op.or]: score 越过 / 同分 id 收敛），
 *             其中 score 字段给的是 **Date**（MySQL 列是时间类型，直接比毫秒数会错）；
 *     order : Sequelize 排序规格，如 [['modified_time','DESC'], ['res_id','DESC']]。
 *
 *   注意 MySQL 的排序规则：同分靠 id 收敛，要求 `ORDER BY idField` 与 ZSET member 的字节序一致，
 *   id 字段应使用二进制 / 大小写敏感的排序规则（如 utf8mb4_bin），否则大小写或重音字母会错位。
 */

const { Op } = require('sequelize');
const config = require('../config.js').get();

/**
 * redis 客户端惰性取用：setConfig 发生在 require 之后也能拿到
 * @returns {import('redis').RedisClient}
 */
const redis = () => config.redis.instance;

/**
 * @typedef {object} Cursor 
 * @property {number} t - 分数,分页起始值
 * @property {number} [e] - unix时间戳,游标过期时间
 * @property {string} [m] - 同分成员项
 * @property {string} [o] - 同分项序列号
 */
/**
 * @typedef {object} Item 
 * @property {string} id - 资源id
 * @property {string} type - 资源类型
 * @property {string} member - zset成员,${id}_${type}
 * @property {number} score - 成员分数score
 */

const defaults = {
  PAGE_SIZE: 15,
  STEP_SIZE: 200,
  TTL_SEC: 4 * 3600,
  MAX_SCORE_BAND: 800,
  MAX_PAGE_DEPTH: 10000,
  ERRORS: {
    BAD_REQUEST: 1400,       // 参数不合法
    DEPTH_LIMIT: 1401,       // 翻页深度超限，请改用游标
    BAD_CURSOR: 1402,        // 游标非法
    CURSOR_EXPIRED: 1403,    // 游标已过期，客户端重置到首页
    INTERNAL: 1500,          // 服务内部错误 / 缓存无法覆盖
  },
};

const ERRORS = defaults.ERRORS;

const LUA = {
  /**
   * 扩展写回
   * KEYS[1]=list KEYS[2]=meta KEYS[3]=index
   * ARGV[1]=members(JSON [[member,score],...]) ARGV[2]=over('1'|'') ARGV[3]=ttlSec ARGV[4]=组合名
   */
  EXTEND: `
local n = 0
if ARGV[1] ~= '' then
  local members = cjson.decode(ARGV[1])
  for i = 1, #members do
    n = n + redis.call('ZADD', KEYS[1], members[i][2], members[i][1])
  end
end
local raw = redis.call('GET', KEYS[2])
local meta = raw and cjson.decode(raw) or {}
meta.count = redis.call('ZCARD', KEYS[1])
if ARGV[2] == '1' then meta.over = true end
if meta.over == nil then meta.over = false end
redis.call('SET', KEYS[2], cjson.encode(meta))
-- 这个组合有缓存了（幂等）：登记进反向索引，供 publish 找到它。
redis.call('SADD', KEYS[3], ARGV[4])
local ttl = tonumber(ARGV[3])
if ttl and ttl > 0 then
  redis.call('EXPIRE', KEYS[1], ttl)
  redis.call('EXPIRE', KEYS[2], ttl)
  redis.call('EXPIRE', KEYS[3], ttl)
end
return cjson.encode(meta)
`,
/**
 * __PAGINATION_INCREMENTAL__
 * KEYS[1]=list KEYS[2]=meta KEYS[3]=index
 * ARGV[1]='add'|'del' ARGV[2]=member ARGV[3]=score ARGV[4]=ttlSec
 * 旁路增量：meta 不存在则整体不执行、不创建（方案 7.3）。
 * 返回值：-1 = meta 不存在（未受理）；0 = 受理但无变更；1 = 确实发生变更。
 * **删空也不摘索引**：摘掉后 publish 就再也找不到这个组合，而 meta 还活着（count:0 / over:true），
 * 之后的新增既进不了 list、读路径又认为缓存已到底（over）——列表会一直空到 TTL 过期。
 * 空组合留在索引里的代价只是一次空转的 eval，换来的却是「删干净后还能接住新增」。
 */
  CHANGE: `
local raw = redis.call('GET', KEYS[2])
if not raw then return -1 end
local meta = cjson.decode(raw)
local changed = 0
if ARGV[1] == 'add' then
  changed = redis.call('ZADD', KEYS[1], ARGV[3], ARGV[2])
  if changed == 1 then meta.count = (meta.count or 0) + 1 end
else
  changed = redis.call('ZREM', KEYS[1], ARGV[2])
  if changed == 1 then
    meta.count = (meta.count or 1) - 1
    if meta.count < 0 then meta.count = 0 end
  end
end
redis.call('SET', KEYS[2], cjson.encode(meta))
local ttl = tonumber(ARGV[4])
if ttl and ttl > 0 then
  redis.call('EXPIRE', KEYS[1], ttl)
  redis.call('EXPIRE', KEYS[2], ttl)
  redis.call('EXPIRE', KEYS[3], ttl)
end
return changed
`,
};

class PaginationError extends Error {
  constructor(code, message) {
    super(message || ('pagination error ' + code));
    this.name = 'PaginationError';
    this.code = code;
  }
}

/**
 * 解析并校验原始游标字符串。
 * 失败一律抛错、绝不降级为首页：格式 / t 不合法 -> 1402，过期 -> 1403。
 *
 * @param {string} raw 客户端传回的 base64url 串
 * @param {number} [now] 当前时刻（ms），便于测试注入
 * @returns {{ t: number, m: string|null, o: number }}
 */
function decodeCursor(raw, now = Date.now()) {
  if (typeof raw !== 'string') throw new PaginationError(ERRORS.BAD_CURSOR, '游标必须是字符串');
  let p;
  try {
    p = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch (e) {
    throw new PaginationError(ERRORS.BAD_CURSOR, '游标载荷非法');
  }
  if (!p || typeof p !== 'object' || Array.isArray(p)) {
    throw new PaginationError(ERRORS.BAD_CURSOR, '游标载荷非法');
  }
  // t 是 score 数字，不做字符串往返
  if (typeof p.t !== 'number' || !Number.isFinite(p.t)) {
    throw new PaginationError(ERRORS.BAD_CURSOR, '游标缺少锚点 score（t 必须是数字）');
  }
  const e = Number(p.e);
  if (!Number.isFinite(e) || e <= now) throw new PaginationError(ERRORS.CURSOR_EXPIRED, '游标已过期');

  return {
    t: p.t,
    m: typeof p.m === 'string' && p.m ? p.m : null,
    o: Number.isInteger(p.o) && p.o > 0 ? p.o : 0,
  };
}

class ListPagination {
  /**
   * @param {object}   opts
   * @param {object}   opts.model        源库模型（契约见文件头）
   * @param {string}   opts.key          key 前缀，如 `user:v6:history:user:xxx`
   * @param {object}   opts.where        业务过滤条件（uid 等）
   * @param {'all'|string[]} [opts.types] 类型组合，默认 'all'；非 all 时并入 where
   * @param {boolean}  [opts.rev]        倒序（默认 true）
   * @param {string[]} [opts.fields]     [scoreField, idField, typeField]，默认 ['modified_time','res_id','res_type']
   * @param {number}   [opts.size]       页大小缺省值，默认 15
   * @param {number}   [opts.step]       每次扩展向源库固定取多少条，默认 200
   * @param {number}   [opts.ttl]        列表与 meta 的 TTL（秒），默认 4 小时
   * @param {Function} [opts.now]        时钟注入（测试用）
   */
  constructor({
    model,
    key,
    where = {},
    types = 'all',
    rev = true,
    fields = [],
    size = defaults.PAGE_SIZE,
    step = defaults.STEP_SIZE,
    ttl = defaults.TTL_SEC,
    now = Date.now,
  }) {
    const [fieldScore = 'modified_time', fieldId = 'res_id', fieldType = 'res_type'] = fields;
    const combo = types === 'all' ? 'all' : [].concat(types).slice().sort().join('_');
    const prefix = String(key);

    this.opts = {
      model,
      // 表字段
      fieldScore,
      fieldId,
      fieldType,
      // 排序（Sequelize 规格；方向由 rev 决定）
      order: [[fieldScore, rev ? 'DESC' : 'ASC'], [fieldId, rev ? 'DESC' : 'ASC']],
      rev,
      // key 派生
      types,
      prefix,
      combo,
      keyList: prefix + ':' + combo + ':list',
      keyMeta: prefix + ':' + combo + ':meta',
      keyIndex: prefix + ':idx',
      // 查询条件（非 all 时按类型收窄；sequelize / mongoose 都支持数组）
      where: Object.assign({}, where),
      // 运行参数
      size,
      step,
      ttl,
      now,
    };

    if (types !== 'all') this.opts.where[fieldType] = types;
  }

  // =========================================================================
  // 基础
  // =========================================================================
  /** 源记录 -> ZSET member */
  _member(row) {
    const o = this.opts;
    return row[o.fieldId] + '_' + row[o.fieldType];
  }

  async meta() {
    const raw = await redis().get(this.opts.keyMeta);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * 按 score 区间取数：Z[REV]RANGEBYSCORE key 低 高 LIMIT offset count WITHSCORES。
   * 直发命令而不用封装方法：4.6 的 zRangeByScore 不追加 WITHSCORES（拿不到 score）、
   * 也不认 REV（ZRANGEBYSCORE 命令本身就没有 REV），zRangeByScoreWithScores 同样没有 REV，
   * 而 zRevRangeByScore 压根没提供；能同时给 score + 倒序的封装只有 ZRANGE BYSCORE REV，
   * 那要求 Redis >= 6.2，直发这对老命令（1.0.5 起就有）则没有版本要求。
   * 边界一律按「低 -> 高」给出，倒序时对调（ZREVRANGEBYSCORE 是先大后小）。
   * 边界写法：'-inf' / '+inf' / 数字 / '(' + 数字（开区间）。
   * **参数全部 String() 化**：node-redis 的 sendCommand 只收 string / Buffer，数字会直接抛类型错误
   * （边界常常来自游标的 `t`，是数字，这里必须转）。
   * 回复是扁平数组 [member, score, ...]，score 是字符串，这里转成数字。
   */
  async _range(low, high, offset, count) {
    const o = this.opts;
    const [a, b] = o.rev ? [high, low] : [low, high];
    const raw = await redis().sendCommand([
      o.rev ? 'ZREVRANGEBYSCORE' : 'ZRANGEBYSCORE',
      o.keyList, String(a), String(b), 'LIMIT', String(offset), String(count), 'WITHSCORES',
    ]);
    const out = [];
    for (let i = 0; i < (raw || []).length; i += 2) {
      const member = String(raw[i]);                     // member 恒为 id_type，按最后一个下划线拆
      const [id, type] = member.split('_');
      out.push({ id, type, member, score: Number(raw[i + 1]) });
    }
    return out;
  }

  /**
   * 由本页尾部生成本页 next 游标（方案 5.3）。
   *   t = items[size].score —— 探察项（下一条待交付记录）的 score，下一页按闭区间从它读起；
   *   m / o 仅当 probe.score === anchor.score（页边界落在同分 band 内）时携带。
   * @param {Cursor} cursor - 游标
   * @param {Item[]} items - 分页列表数据
   * @param {number} size - 分页大小
   * @returns 
   */
  _makeCursor(cursor, items, size) {
    const anchor = items[size - 1];
    const probe = items[size];
    // t 取探察项 probe 的 score，配上读路径的**闭区间**（<= t）：下一页正好从 probe 开始（含 probe）
    const payload = { t: probe.score, e: this.opts.now() + this.opts.ttl * 1000 };

    if (probe.score === anchor.score) {
      let k = 0;                                   // 本页已交付成员中与 anchor 同分的条数
      for (let i = size - 1; i >= 0 && items[i].score === anchor.score; i--) k++;
      payload.m = probe.member;
      // o 只在两页的边界落在**同一个 band** 上时累加：上一页的 t 就是那个 band 的 score。
      // （非 band 边界上 t 也可能恰好等于本页 anchor.score，那种游标的 o 恒为 0，加了也无碍。）
      payload.o = cursor && cursor.t === anchor.score ? cursor.o + k : k;
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  /**
   * 读一页，恒取 n+1 条（第 n+1 条是探察项，只用于判断是否还有下一页）
   * @param {Cursor} cursor 游标
   * @param {number} size 分页数量
   * @returns {Promise<Item[]>}
   */
  async _read(cursor, size) {
    const o = this.opts;
    const count = size + 1;

    // ① 首页：全区间
    if (!cursor) return this._range('-inf', '+inf', 0, count);

    // ② 无 m（页边界不在 band 内）：闭区间从 t 读起。t 是探察项的 score，而本页已交付成员的 score
    //    都 > t（否则 probe 会与它们同分，就属于 ③ 了），所以闭区间一条已交付的都带不回来。
    if (!cursor.m) {
      return o.rev
        ? this._range('-inf', cursor.t, 0, count)
        : this._range(cursor.t, '+inf', 0, count);
    }

    // ③ 有 m（页边界落在同分 band 内）：闭区间读回 band 前缀，再按 member 字典序过滤。
    //    过滤而非按 o 计数跳过：band 内已交付前缀有成员被删时，计数会整体偏移而漏读。
    const keep = o.rev ? (x) => x.member <= cursor.m : (x) => x.member >= cursor.m;
    let span = cursor.o + count;                     // o = band 内已交付数，用它收敛窗口
    for (; ;) {
      const items = o.rev
        ? await this._range('-inf', cursor.t, 0, span)
        : await this._range(cursor.t, '+inf', 0, span);
      const kept = items.filter((x) => x.score !== cursor.t || keep(x));
      if (kept.length > size || items.length < span || span >= defaults.MAX_SCORE_BAND) return kept;
      span = Math.min(span * 2, defaults.MAX_SCORE_BAND);   // o 被低估 -> 窗口吃满，放大重读
    }
  }

  /**
   * 唯一分页入口：有 cursor 走游标链路，否则走页模式。
   * @param {object} [params]
   * @param {Cursor} [params.cursor] 已解析的游标（由 decodeCursor 得到）
   * @param {number} [params.size] 本次窗口大小，缺省用构造时的 size
   * @param {number} [params.page] 页模式页码（无 cursor 时生效），1 起
   */
  async paginate(params = {}) {
    const { cursor = null, size = this.opts.size, page = 1 } = params;
    if (cursor == null) return this.page({ page, size });
    if (typeof cursor !== 'object') {
      throw new PaginationError(ERRORS.BAD_CURSOR, '游标必须由外部解析后再传入');
    }
    return this.cursor(cursor, size);
  }

  /**
   * 游标链路：先取 meta 判断 -> 读 -> 不足再扩 -> 严格按 INV-1 判结束
   * @param {Cursor} cur 
   * @param {number} n 
   * @returns 
   */
  async cursor(cur, size = this.opts.size) {
    let meta = (await this.meta()) || (await this._extend());
    let items = await this._read(cur, size);

    while (items.length <= size && meta.over !== true) {
      const before = meta.count;
      meta = await this._extend();
      if (meta.count === before) break;                     // 水位线推不动了，避免空转
      items = await this._read(cur, size);
    }
    if (items.length <= size && meta.over !== true) {
      throw new PaginationError(ERRORS.INTERNAL, '缓存未覆盖到该位置且无法继续扩展');
    }

    return {
      list: items.slice(0, size),
      next: items.length > size ? this._makeCursor(cur, items, size) : null,
    };
  }

  /**
   * 页模式兼容（方案 6.4）：同样只按 score 取数，不混用 rank 查询
   * @param {*} param0 
   * @returns 
   */
  async page({ page = 1, size = this.opts.size } = {}) {
    const offset = (page - 1) * size;
    if (offset + size > defaults.MAX_PAGE_DEPTH) {
      throw new PaginationError(ERRORS.DEPTH_LIMIT, '翻页深度超限，请改用游标');
    }
    const depth = offset + size + 1;                  // 要读到第 depth 条，缓存至少得覆盖到这里

    // 与 cursor() 同构：先看 meta，覆盖不足则反复 _extend（meta 不存在时 _extend 会从源头建缓存）
    let meta = await this.meta();
    while (!meta || (meta.over !== true && Number(meta.count || 0) < depth)) {
      const before = meta ? Number(meta.count || 0) : -1;
      meta = await this._extend();
      if (Number(meta.count || 0) === before) break;      // 水位线推不动，避免空转
    }

    const items = await this._range('-inf', '+inf', offset, size + 1);
    return {
      list: items.slice(0, size),
      next: items.length > size ? this._makeCursor(null, items, size) : null,
    };
  }

  // =========================================================================
  // 扩展：从 ZSET 尾部（续点）取固定 step 条旧数据，原子写回 ZSET + meta
  // =========================================================================
  /**
   * 续点不再存 meta（synced_to 已移除），直接探 ZSET 尾部：
   * 倒序取 ZRANGE 0 0、升序取 ZREVRANGE 0 0 —— 下标 0 恰是展示序的最后一项
   * （最低 score、同分最小 member），与 keyset 闭区间续取正好衔接。
   * 扩展路径单发一次下标探针，不违反读路径「禁用按下标」的禁令（那管的是跨页 band 一致性）。
   * 登记 / 续期反向索引也在这一步（Lua 内幂等 SADD），不需要单独维护。
   */
  async _extend() {
    const o = this.opts;
    const tailRaw = await redis().sendCommand([
      o.rev ? 'ZRANGE' : 'ZREVRANGE', o.keyList, '0', '0', 'WITHSCORES',
    ]);
    const where = Object.assign({}, o.where);

    // keyset 续点（闭区间：同分再按 id 收敛，幂等且不跳数据）
    if (tailRaw && tailRaw.length) {
      const [id] = String(tailRaw[0]).split('_');        // member 恒为 id_type
      const at = new Date(Number(tailRaw[1]));           // ZSET 的 score 是毫秒数，源库字段是时间，回查时转回去
      const dir = o.rev ? Op.lt : Op.gt;
      const same = o.rev ? Op.lte : Op.gte;
      where[Op.or] = [
        { [o.fieldScore]: { [dir]: at } },
        { [o.fieldScore]: at, [o.fieldId]: { [same]: id } },
      ];
    }

    const rows = await o.model.findAll({ where, order: o.order, limit: o.step });
    // 源库的 score 字段是时间（MySQL DATETIME -> JS Date），ZSET 的 score 只认数字，所以取毫秒数
    const members = (rows || []).map((r) => [this._member(r), new Date(r[o.fieldScore]).getTime()]);
    const raw = await redis().eval(LUA.EXTEND, {
      keys: [o.keyList, o.keyMeta, o.keyIndex],
      arguments: [
        JSON.stringify(members),
        members.length < o.step ? '1' : '',              // 短页 -> over = true
        String(o.ttl),
        o.combo,
      ],
    });
    return JSON.parse(raw);                              // Lua 恒返回 meta 的 JSON
  }

  // =========================================================================
  // 写入侧（方案 7.3 旁路增量）：只传 key 前缀，从反向索引取候选组合
  // =========================================================================
  /**
   * 新增 / 删除一条记录，广播到该前缀下所有已建立缓存的类型组合。
   * 只在 meta 存在、且组合包含该记录类型时受理；返回 -1 说明该组合的缓存已过期，把它从索引里剔除。
   * **删空不摘索引**：空组合继续留在索引里，之后的新增才能 ZADD 回来（list 空了 Redis 会删 key，
   * ZADD 会重新建）。索引只靠两处收敛：_extend 的幂等 SADD，以及这里遇 -1（缓存没了）时的 SREM。
   *
   * @param {string} key    key 前缀（与构造时的 key 一致）
   * @param {string} value  ZSET member，固定 id + '_' + type；type 也用于筛掉不含该类型的组合
   * @param {number} score
   * @param {number} [action] 1 = 新增（默认），-1 = 删除
   * @param {number} [ttl]  续期用的 TTL（秒），默认 defaults.TTL_SEC
   * @returns {{ value: string, changed: string[], stale: string[] }}
   */
  static async publish(key, value, score, action = 1, ttl = defaults.TTL_SEC) {
    const prefix = String(key);
    const keyIndex = prefix + ':idx';
    const [, type] = String(value).split('_');           // 与 _range 同一套拆法：id 不含下划线
    const combos = await redis().sMembers(keyIndex);
    const add = action > 0;
    const changed = [];
    const stale = [];

    for (const combo of combos || []) {
      if (combo !== 'all' && !combo.split('_').includes(type)) continue;   // 类型不匹配的组合不受影响
      const listKey = prefix + ':' + combo + ':list';
      const n = Number(await redis().eval(LUA.CHANGE, {
        keys: [listKey, prefix + ':' + combo + ':meta', keyIndex],
        arguments: [add ? 'add' : 'del', value, String(score), String(ttl)],
      }));
      if (n === 1) {
        changed.push(combo);
      } else if (n < 0) {
        await redis().sRem(keyIndex, combo);             // 缓存没了，索引也清掉
        stale.push(combo);
      }
    }
    return { value, changed, stale };
  }
}

module.exports = {
  ListPagination,
  PaginationError,
  decodeCursor,
  defaults,
};
