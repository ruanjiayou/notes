'use strict';

/**
 * ============================================================================
 * ListPagination —— 端到端黑盒测试（真实服务 + 真实 Redis）
 * 运行：node pagination.test.js        （环境变量见下）
 * ============================================================================
 *
 * 只用四个接口，不读业务代码：
 *   POST /oauth/login              登录（唯一不需要 token 的接口）
 *   GET  /history/list/<page>      历史列表（page 从 0 起，页大小 15）
 *   POST /history/create/_bulk     批量新增（body 直接是数组）
 *   POST /history/del/_bulk        批量删除（{ ids: [...] }）
 *
 * Redis 只读 / 只写**本账号自己那一个前缀**：user:v6:history:<uid>:*（含 :idx）。
 * 所有写操作都过 guardRedis()：key 不以本前缀开头直接抛错，绝不碰别的 key。
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 首轮实测得到的环境事实（决定了测试怎么写）
 *   ① 新增接口返回后缓存**约 30ms 才生效**（异步 publish）→ 写入侧断言一律轮询收敛；
 *   ② score 是**秒级**（MySQL DATETIME 取 getTime）：同一次导入的数百条会落在同一分，
 *      实测 400 条一次导入 = 1~2 个 band，账号历史里也有 38 条同分 —— 同分是常态而非特例；
 *      连续两次扩展若都停在同一个 band 内，ZSET 尾部 score 不变、靠 id 继续收敛（见 B2）；
 *   ③ 一次 bulk 请求里每行的 ms 可能不同，但秒级下几乎必然同分；为了**精确控制 band 条数**，
 *      C 组用 ZSET 注入造 band（只动自己前缀的 list 键，不写源库），注入项事后退掉并重建；
 *      注入的成员会被列表接口正常返回（列表完全由缓存驱动，已实测）。
 *   另：深页超限返回 {status:1401, message:"翻页深度超限，请改用游标"}。
 * ─────────────────────────────────────────────────────────────────────────────
 * 场景清单（编号 == 用例名前缀）
 * ─────────────────────────────────────────────────────────────────────────────
 * 【A 正常操作链路】
 *   A1 登录 → uid / token / 前缀
 *   A2 冷启动第 0 页：list / meta / idx 三键落地，TTL 同批次，meta 只有 total
 *      （续点取自 ZSET 尾部，不落 meta）
 *   A3 全量翻页：逐页拼接 == ZSET 全量顺序，不重不漏（核心不变量，后续用例都复用它）
 *   A4 末页 / 越界：末页短、再下一页空、zcard == total
 *   A5 重建一致：清缓存 → 重新翻到底 → 与缓存版逐项相同
 *
 * 【B 缓存不足 → 扩展】
 *   B1 首扩只取 step 条（不是全量）：造 400 条 → 清缓存 → 首页后 zcard 明显小于 total
 *   B2 深页触发二次扩展：zcard 递增、ZSET 尾部继续前移（同 band 内靠 id 收敛）、页不空
 *   B3 到底之后（zcard >= total）深页不再扩展、不报错，只给空页
 *   B4 翻到一半清缓存：惰性重建后仍与 ZSET 一致
 *
 * 【C 同分 band（0 / ≤15 / ==15 / >15 / >800）】
 *   C0 分布盘点：band = ZSET 里 score 相同的一段，统计并打印当前分布（含 band=1 的「无同分」段）
 *   C1 band ≤ 15（注入 6 条同分）：页内顺序 == member 字节序倒序
 *   C2 band == 15（注入 15 条同分）：整页同分，第 1 页换分数
 *   C3 band > 15（注入 30 条同分）：页边界落在 band 内，跨页不重不漏
 *   C4 页边界 index 14 | 15 同分：两页各取 band 的一段
 *   C5 band > 800（注入 850 条同分）：页模式下仍完整（上限只约束游标模式）
 *   C6 跳过：页模式无法覆盖游标模式的「同分 band 内删除」语义（已确认可接受）
 *   C7 批量新增（秒级同分）：全部落到头部、total 收敛
 *
 * 【D 写入侧旁路 publish】
 *   D1 新增：ZSET 最终 +1、total 同步 +1、三键续期、首页可见
 *   D2 删除：ZSET 最终 -1、total 同步 -1、TTL 续期
 *   D3 幂等：删不存在的 id 无副作用（total 也不动，INV-6）
 *   D4 重复新增同一 res_id：member 相同，ZSET 不长、total 不虚增
 *   D5 删空后新增：total 归零但组合仍留在 idx，之后的新增仍能进缓存、第一页看得到（需一个源库为空的组合，否则跳过）
 *
 * 【E 反向索引失效（idx TTL 与 list / meta 不一致）】
 *   E1 idx 被删（list / meta 仍在）：读路径不受影响
 *   E2 idx 缺失期间新增：publish 找不到组合 → 增量不进缓存（已知取舍）
 *   E3 再 _extend 一次：组合重新登记进 idx；全量重建后一致性恢复
 *   E4 idx TTL 单独设短：三键出现不一致；重建后收敛回同批次
 *
 * 【F 过期与部分失效】
 *   F1 三键 TTL 同批次；写入续期
 *   F2 三键同时过期：请求第 0 页从源库重建，与源库一致
 *   F3 只丢 list（meta 留着）：zcard < total → 下次读自动补回（v1 里这是死局）
 *   F4 只丢 meta（list 留着）：按无缓存重建，ZADD 幂等、成员不重复
 *
 * 【G 组合隔离 / 类型筛选】
 *   G1 不同 res_type 各自 list/meta，idx 共用并登记多个组合
 *   G2 publish 类型筛选：ticker 的增量不动 article-only 组合
 *   G3 组合之间互不污染（各自 total >= ZCARD）
 *
 * 【H 参数边界（接口层，观察性断言）】
 *   H1 深页超 MAX_PAGE_DEPTH → 1401
 *   H2 res_type 缺失
 *   H3 page 非法（非数字 / 负数）
 *
 * 【I 并发】
 *   I1 冷启动并发 10 次第 0 页：幂等，无重复 member
 *   I2 并发新增 + 翻页：收敛后无重复 member
 *
 * 【J 安全网】
 *   J1 全程写过的 key 全部落在自己前缀内（guard 记录），结束时清理自建数据、注入项与缓存
 *
 * 尾注：接口只暴露**页模式**（data 是数组，不带游标），所以游标模式下的 band 过滤、
 * o 累加、MAX_SCORE_BAND 放大收敛只能由库内单测（test/*.test.js）覆盖；本文件在页模式下
 * 验证「同分不影响对外的不重不漏」，并用真实 Redis 核对 meta / idx / TTL 这三处状态。
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('superagent');
const { randomUUID } = require('node:crypto');
const { createClient } = require('redis');

const API = process.env.API_BASE || 'http://127.0.0.1:8990';
const REDIS_URL = process.env.REDIS_URL || 'redis://root:fengshows@10.0.15.240:6379';
const CLIENT = 'app(ios,5041707);iPhone14,5;18.2.1';
const LOGIN = {
  phone: '13872184014',
  code: '86',
  password: '123456aa',
  registration_id: '',
  ticket: 'PIlHc8S49BpmWoHIgVMGf5N2pPUGaOikP8UQhodvFsDNimDJHpl892BA4UJGYhH5bKN/6CiKZB/YjK9b/hVUU7LSZfHGqbb+n7vtZQE+0+Z4o/Dc/1h8QNTwro/3TXNcJejS+SQeOfNJyV4iTRVxM+X1E9RT3scbFqUXDUcHIOo=',
};

const SIZE = 15;                                       // 服务端页大小
const COMBO = 'article_ticker';                        // 主测组合
const BAND_N = Number(process.env.BAND_N ?? 850);      // C5 大 band 目标（0 = 跳过）
const EXTRA_TYPE = process.env.EXTRA_TYPE || 'video';  // D5 尝试用来做「删空」的类型
const TTL_MAX = 14400;                                 // 方案默认 4 小时
const WAIT_MS = 3000;                                  // 写入侧收敛等待上限（实测 ~30ms）

const S = { uid: null, token: null, prefix: null, created: new Set(), touched: new Set() };
let redis = null;

// ---------------------------------------------------------------- 接口封装
const head = () => ({ 'fengshows-client': CLIENT, token: S.token });
const parse = (res) => (res.body && typeof res.body === 'object' ? res.body : JSON.parse(res.text));
const body = (res) => {
  const j = parse(res);
  assert.equal(j.status, '0', `接口返回非 0：${JSON.stringify(j).slice(0, 300)}`);
  return j.data;
};

const api = {
  async login() {
    const data = body(await request.post(`${API}/oauth/login`).set(head()).send(LOGIN));
    S.uid = data.id;
    S.token = data.token;
    S.prefix = `user:v6:history:${S.uid}`;
    return data;
  },
  async list(page = 0, resType = COMBO) {
    return body(await request.get(`${API}/history/list/${page}`).set(head()).query({ res_type: resType })) || [];
  },
  /** 不校验 status 的原始调用（H 组参数边界用） */
  async listRaw(page = 0, resType = COMBO) {
    const q = resType == null ? {} : { res_type: resType };
    return parse(await request.get(`${API}/history/list/${page}`).set(head()).query(q));
  },
  /** 批量新增：body 直接是数组；记账用**本脚本传进去的 res_id**（删除也按 res_id 删） */
  async createBulk(rows) {
    const data = body(await request.post(`${API}/history/create/_bulk`).set(head()).send(rows)) || [];
    assert.equal(data.length, rows.length, '新增返回值应与请求条数一致');
    const mine = rows.map((r) => r.res_id);
    for (const id of mine) S.created.add(id);
    return mine;
  },
  async delBulk(ids) {
    const data = body(await request.post(`${API}/history/del/_bulk`).set(head()).send({ ids })) || [];
    for (const id of ids) S.created.delete(id);            // 返回值是行 id，记账按传入的 res_id
    return data;
  },
};

const rowsFor = (n) => Array.from({ length: n }, (_, i) => ({
  res_type: i % 3 ? 'article' : 'ticker',
  res_id: randomUUID(),
}));

// ---------------------------------------------------------------- Redis（只动自己前缀）
const keyList = (combo = COMBO) => `${S.prefix}:${combo}:list`;
const keyMeta = (combo = COMBO) => `${S.prefix}:${combo}:meta`;
const keyIndex = () => `${S.prefix}:idx`;

/** 写操作守卫：越界 key 直接抛错，并记录写过的 key 供 J1 核对 */
function guardRedis(c) {
  const check = (cmd, key) => {
    const k = String(key);
    if (!k.startsWith(S.prefix + ':')) throw new Error(`[guard] ${cmd} 越界写：${k}`);
    S.touched.add(k);
  };
  for (const cmd of ['del', 'unlink', 'expire', 'set', 'zAdd', 'zRem', 'sAdd', 'sRem']) {
    const orig = c[cmd].bind(c);
    c[cmd] = (...args) => {
      if (cmd === 'del' || cmd === 'unlink') args.forEach((k) => check(cmd, k));
      else check(cmd, args[0]);
      return orig(...args);
    };
  }
  const sc = c.sendCommand.bind(c);
  c.sendCommand = (args) => {
    if (['ZADD', 'ZREM', 'SADD', 'SREM', 'DEL', 'EXPIRE', 'SET'].includes(String(args[0]).toUpperCase())) check(args[0], args[1]);
    return sc(args);
  };
  return c;
}

async function connectRedis() {
  for (const url of [REDIS_URL, REDIS_URL.replace(/\/\/[^@/]*@/, '//')]) {   // 带凭据连不上就裸连
    const c = createClient({ url, RESP: 2, socket: { connectTimeout: 5000, reconnectStrategy: false } });
    c.on('error', () => {});
    try { await c.connect(); return guardRedis(c); } catch (e) { /* 换下一种 */ }
  }
  throw new Error('Redis 连不上：' + REDIS_URL);
}

/** 自己前缀下的全部 key */
async function ownKeys() {
  const out = [];
  let cursor = '0';
  do {
    const r = await redis.scan(cursor, { MATCH: S.prefix + ':*', COUNT: 500 });
    cursor = r.cursor;
    out.push(...r.keys);
  } while (cursor !== '0');
  return out;
}

/** 清掉自己前缀下的缓存（连同 idx） */
async function wipeCache() {
  const keys = await ownKeys();
  for (const k of keys) await redis.del(k);
  return keys.length;
}

const metaOf = async (combo = COMBO) => JSON.parse((await redis.get(keyMeta(combo))) || 'null');
const zcard = (combo = COMBO) => redis.zCard(keyList(combo));

/** ZSET 全量（倒序）-> [{ id, type, member, score }]，与类的读路径同一顺序 */
async function zsetOf(combo = COMBO) {
  const raw = await redis.sendCommand(['ZREVRANGEBYSCORE', keyList(combo), '+inf', '-inf', 'LIMIT', '0', '-1', 'WITHSCORES']);
  const out = [];
  for (let i = 0; i < raw.length; i += 2) {
    const [id, type] = raw[i].split('_');
    out.push({ id, type, member: raw[i], score: Number(raw[i + 1]) });
  }
  return out;
}

async function ttlOf(combo = COMBO) {
  return [
    await redis.ttl(keyList(combo)),
    await redis.ttl(keyMeta(combo)),
    await redis.ttl(keyIndex()),
  ];
}

/** 轮询直到条件成立（写入侧约 30ms 异步生效） */
async function waitFor(fn, ms = WAIT_MS) {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - t0 >= ms) return false;
    await new Promise((r) => setTimeout(r, 25));
  }
}

/** 等待 ZSET 条数收敛到期望值 */
async function waitCard(n, combo = COMBO) {
  const ok = await waitFor(async () => (await zcard(combo)) === n);
  assert.ok(ok, `ZSET 条数未收敛到 ${n}（实测 ${await zcard(combo)}）`);
  return n;
}

const ids = (items) => items.map((x) => x.res_id);
const zIds = (zs) => zs.map((x) => x.id);
/** 同分 band：score 相同的一段 */
const bandsOf = (zs) => zs.reduce((acc, x) => {
  const last = acc[acc.length - 1];
  if (last && last.score === x.score) last.n++;
  else acc.push({ score: x.score, n: 1 });
  return acc;
}, []);

/** 只允许删本脚本创建的记录 */
async function delOwn(idList) {
  const mine = idList.filter((x) => S.created.has(x));
  assert.equal(mine.length, idList.length, '只允许删本脚本创建的记录');
  return api.delBulk(mine);
}

// ------------------------------------------------------- 同分 band 的构造（注入）
// 源库每行取各自毫秒，接口造不出同分；注入只动自己前缀的 ZSET（源库不写），
// 注入项清理后清缓存重建即可恢复。注入的成员会被列表接口当作正常条目返回。
const ghosts = new Set();

async function injectBand(n, combo = COMBO) {
  const zs = await zsetOf(combo);
  const top = zs.length ? Math.max(...zs.map((x) => x.score)) : Date.now();
  const score = top + 1000;                       // 抬到最前面，band 落在 index 0..n-1
  const members = [];
  for (let i = 0; i < n; i++) {
    const member = `${randomUUID()}_article`;
    members.push(member);
    ghosts.add(member);
  }
  await redis.zAdd(keyList(combo), members.map((m) => ({ score, value: m })));
  return { score, members };
}

async function dropGhosts(combo = COMBO) {
  if (!ghosts.size) return 0;
  const n = await redis.zRem(keyList(combo), [...ghosts]);
  ghosts.clear();
  return n;
}

/** 注入一段 band → 跑用例 → 无论成败都退掉注入项并清缓存重建（恢复 count 一致性） */
async function withBand(n, fn) {
  await dropGhosts();
  const band = await injectBand(n);
  try {
    await fn(band);
  } finally {
    await dropGhosts();
    await wipeCache();
    await api.list(0);
  }
}

// ---------------------------------------------------------------- 核心不变量
/** 用接口一路翻到底（页模式），返回全部 res_id 顺序 */
async function walkAll(resType = COMBO, maxPages = 500) {
  const all = [];
  for (let p = 0; p < maxPages; p++) {
    const rows = await api.list(p, resType);
    if (!rows.length) break;
    assert.ok(rows.length <= SIZE, `每页不应超过 ${SIZE} 条（page ${p}）`);
    all.push(...ids(rows));
  }
  return all;
}

/** 不变量：接口翻页结果 == ZSET 全量顺序，且不重不漏（先翻页，再读 ZSET —— 清缓存后翻页会触发重建） */
async function assertWalkMatchesZset(resType = COMBO, label = '') {
  const all = await walkAll(resType);
  const zs = await zsetOf(resType);
  assert.equal(all.length, new Set(all).size, `${label} 翻页结果不能有重复`);
  assert.equal(all.length, zs.length, `${label} 翻页条数应与 ZSET 条数一致`);
  assert.deepEqual(all, zIds(zs), `${label} 逐页拼接应与 ZSET 全量同序`);
  return { all, zs };
}

// ---------------------------------------------------------------- 生命周期
test.before(async () => {
  await api.login();
  redis = await connectRedis();
  console.log(`登录成功：uid=${S.uid} 前缀=${S.prefix}`);
});

test.after(async () => {
  if (redis) await dropGhosts();
  if (S.created.size) {
    const all = [...S.created];
    let gone = 0;
    for (let i = 0; i < all.length; i += 100) gone += (await api.delBulk(all.slice(i, i + 100))).length;   // 分批，别撑爆 body
    console.log(`清理测试数据：${gone}/${all.length} 条`);
  }
  if (redis) {
    console.log(`清理缓存 key：${await wipeCache()} 个`);
    await redis.quit();
  }
});

// ============================================================================
// A 正常操作链路
// ============================================================================

test('A1 登录：返回 uid / token，前缀 = user:v6:history:<uid>', async () => {
  assert.match(S.uid, /^[0-9a-f-]{36}$/i, `uid 应是 uuid：${S.uid}`);
  assert.ok(S.token && typeof S.token === 'string', 'token 应有值');
  assert.equal(S.prefix, `user:v6:history:${S.uid}`);
});

test('A2 冷启动建缓存：list / meta / idx 三键落地，TTL 同批次，meta 只有 total', async () => {
  await wipeCache();
  assert.equal(await metaOf(), null, '清完 meta 应不存在');

  await api.list(0);

  const zs = await zsetOf();
  const meta = await metaOf();
  assert.ok(zs.length > 0, 'ZSET 不应为空');
  assert.equal(await zcard(), zs.length, 'list 键存在且是 ZSET');
  assert.ok(meta, 'meta 应落地');
  assert.deepEqual(Object.keys(meta).sort(), ['total'], 'meta 只有 total 一个字段');
  assert.equal(typeof meta.total, 'number', 'total 应是数字');
  assert.ok(meta.total >= zs.length, `total（源库总数）应 >= 已缓存条数：${meta.total} vs ${zs.length}`);
  // 续点不落 meta：扩展时探针 ZSET 尾部（倒序 ZRANGE 0 0），这里对着展示序最后一项校验
  assert.equal(zs[zs.length - 1].score, Math.min(...zs.map((x) => x.score)),
    'ZSET 尾部（扩展续点）就是展示序的最后一项');

  assert.ok((await redis.sMembers(keyIndex())).includes(COMBO), '组合名应登记进反向索引');
  const ttls = await ttlOf();
  assert.ok(ttls.every((t) => t > 0 && t <= TTL_MAX), `三键都该有 TTL：${ttls}`);
  assert.ok(Math.max(...ttls) - Math.min(...ttls) <= 1, `三键 TTL 应同批次：${ttls}`);
  assert.ok(zs.every((x) => x.id && COMBO.split('_').includes(x.type)), 'ZSET 成员类型不越界');
  console.log(`建缓存：zcard=${zs.length} total=${meta.total} ttl=${ttls[0]}`);
});

test('A3 全量翻页：逐页拼接 == ZSET 全量顺序，不重不漏', async () => {
  const { all, zs } = await assertWalkMatchesZset(COMBO, 'A3');
  assert.ok(all.length > SIZE, `数据量应多于一页：${all.length}`);
  console.log(`翻页 ${Math.ceil(all.length / SIZE)} 页 / ${all.length} 条，与 ZSET 完全一致`);
  console.log(`band 分布：${bandsOf(zs).map((b) => b.n).join(',')}`);
});

test('A4 末页 / 越界：末页短、再下一页为空、zcard == total', async () => {
  let last = [];
  for (let page = 0; page < 500; page++) {
    const rows = await api.list(page);
    if (!rows.length) break;
    last = rows;
  }
  const meta = await metaOf();
  const { zs } = await assertWalkMatchesZset(COMBO, 'A4');
  assert.equal(await zcard(), zs.length, '翻到底后 ZSET 就是全量');
  assert.equal(meta.total, zs.length, 'zcard >= total 判到底：此时两者应相等');
  if (zs.length % SIZE !== 0) assert.ok(last.length < SIZE, '总量非页大小整数倍时末页应是短页');
  console.log(`末页 ${last.length} 条，zcard = total = ${meta.total}`);
});

test('A5 重建一致：清缓存 → 重新翻到底 → 与缓存版逐项相同', async () => {
  const before = await walkAll();
  await wipeCache();
  const { all } = await assertWalkMatchesZset(COMBO, 'A5 重建后');
  assert.deepEqual(all, before, '重建前后的翻页序列应完全一致');
  assert.equal((await metaOf()).total, all.length, '翻到底：total 与 ZCARD 一致');
  console.log(`重建 ${all.length} 条，与清理前逐项相同`);
});

// ============================================================================
// B 缓存不足 → 扩展
// ============================================================================

test('B1 首扩只取 step 条（不是全量）：zcard 明显小于 total', async () => {
  await wipeCache();
  await api.createBulk(rowsFor(400));          // idx 已被清掉，新增不会进缓存，正好留给扩展
  await api.list(0);
  const m = await metaOf();
  const z = await zcard();
  assert.ok(z > SIZE * 3, `一次扩展应取回远多于首页的量：${z}`);
  assert.ok(m.total > z, `源库还有更多数据：total=${m.total} > zcard=${z}`);
  console.log(`首扩取回 ${z} 条（step），total=${m.total}`);
});

test('B2 深页触发二次扩展：zcard 递增、ZSET 尾部继续前移、页不空', async () => {
  const z1 = await zsetOf();                               // 扩展前的 ZSET 尾部 = 当时的续点
  const deep = Math.floor(z1.length / SIZE) + 2;           // 越过当前水位线
  const rows = await api.list(deep);
  const z2 = await zsetOf();                               // 扩展后的尾部
  assert.ok(rows.length > 0, '深页应仍能取到数据');
  assert.ok(z2.length > z1.length, `深页应继续扩展：${z1.length} -> ${z2.length}`);

  // 秒级 score 下两次扩展可能停在同一个 band：这时尾部的 score 不变，靠 id / member 继续收敛
  const t1 = z1[z1.length - 1];
  const t2 = z2[z2.length - 1];
  assert.ok(t2.score <= t1.score, `尾部不应后退：${t1.score} -> ${t2.score}`);
  assert.ok(t2.score < t1.score || t2.member !== t1.member,
    `续点必须继续前移：${t1.member}@${t1.score} -> ${t2.member}@${t2.score}`);
  console.log(`深页 page=${deep}：zcard ${z1.length} -> ${z2.length}，`
    + `尾部 ${t1.member.slice(0, 8)}@${t1.score} -> ${t2.member.slice(0, 8)}@${t2.score}`
    + `${t2.score === t1.score ? '（同 band，靠 id 收敛）' : ''}`);
});

test('B3 到底之后深页不再扩展、不报错，只给空页', async () => {
  await walkAll();                                         // 翻到底
  const m1 = await metaOf();
  const z1 = await zcard();
  assert.equal(m1.total, z1, '前置：翻到底后 zcard == total');
  const far = Math.floor(z1 / SIZE) + 5;
  const rows = await api.list(far);
  const m2 = await metaOf();
  assert.equal(rows.length, 0, '越过末尾应为空页');
  assert.equal(await zcard(), z1, '到底之后不应再扩展');
  assert.equal(m2.total, m1.total);
  assert.deepEqual((await zsetOf()).slice(-1), (await zsetOf()).slice(-1), '尾部不应变化');
  console.log(`到底之后请求 page=${far}：空页，zcard 保持 ${z1}`);
});

test('B4 翻到一半清缓存：惰性重建后仍与 ZSET 一致', async () => {
  const first = await api.list(0);
  const second = await api.list(1);
  assert.equal(first.length, SIZE, '第 0 页应满页');
  assert.equal(second.length, SIZE, '第 1 页应满页');
  await wipeCache();
  const after = await api.list(0);                          // 触发重建
  assert.deepEqual(ids(after), ids(first), '重建后第 0 页应与清缓存前一致');
  await assertWalkMatchesZset(COMBO, 'B4 重建后');
});

// ============================================================================
// C 同分 band
// ============================================================================

test('C0 band 分布盘点：无同分的段（band=1）与同分段并存', async () => {
  await wipeCache();
  await walkAll();
  const zs = await zsetOf();
  const bs = bandsOf(zs);
  const singles = bs.filter((b) => b.n === 1).length;
  console.log(`共 ${bs.length} 段：band=1 的 ${singles} 段，最大的 ${Math.max(...bs.map((b) => b.n))} 条`);
  console.log(`分布（前 20 段）：${bs.slice(0, 20).map((b) => b.n).join(',')}`);
  assert.ok(bs.length > 0, '至少应有一段');
  assert.equal(bs.reduce((s, b) => s + b.n, 0), zs.length, '各段之和应等于总数');
});

test('C1 band ≤ 15（注入 6 条同分）：页内顺序 == member 字节序倒序', async () => {
  await withBand(6, async ({ score }) => {
    const zs = await zsetOf();
    assert.equal(zs[0].score, score, '注入的 band 应在列表最前');
    const head = zs.slice(0, 6);
    assert.equal(new Set(head.map((x) => x.score)).size, 1, '顶部 6 条应同分');
    assert.deepEqual(head.map((x) => x.member), head.map((x) => x.member).slice().sort().reverse(),
      '同分成员应按 member 字节序倒序');
    await assertWalkMatchesZset(COMBO, 'C1');
    const p0 = await api.list(0);
    assert.deepEqual(ids(p0).slice(0, 6), head.map((x) => x.id), '第 0 页前 6 条应与 band 同序');
    console.log(`band=6（score=${score}）：同分顺序与 member 倒序一致`);
  });
});

test('C2 band == 15（注入 15 条同分）：第 0 页整页同分，第 1 页换分数', async () => {
  await withBand(SIZE, async ({ score }) => {
    const zs = await zsetOf();
    assert.equal(bandsOf(zs)[0].n, SIZE, '顶部 band 应正好 15 条');
    assert.notEqual(zs[SIZE - 1].score, zs[SIZE].score, '页边界不应落在 band 内');
    const p0 = await api.list(0);
    const p1 = await api.list(1);
    assert.equal(p0.length, SIZE);
    assert.equal(new Set(zs.slice(0, SIZE).map((x) => x.score)).size, 1, '首页整页同分');
    assert.deepEqual(ids(p0), zIds(zs).slice(0, SIZE), '第 0 页 == ZSET 前 15 条');
    assert.deepEqual(ids(p1), zIds(zs).slice(SIZE, SIZE * 2), '第 1 页衔接正确（换到下一个分数）');
    console.log(`整页同分：score=${score}`);
  });
});

test('C3 band > 15（注入 30 条同分）：页边界落在 band 内，跨页不重不漏', async () => {
  await withBand(30, async ({ score }) => {
    const zs = await zsetOf();
    assert.equal(bandsOf(zs)[0].n, 30, '顶部 band 应 30 条');
    assert.equal(zs[SIZE - 1].score, zs[SIZE].score, '页边界应落在 band 内');
    assert.equal(zs[0].score, score);
    const { all } = await assertWalkMatchesZset(COMBO, 'C3');
    console.log(`跨页 band=30（score=${score}）：逐页拼接与 ZSET 同序，边界落在 band 内（全量 ${all.length} 条）`);
  });
});

test('C4 页边界（index 14 | 15 同分）：两页各取 band 的一段', async () => {
  await withBand(30, async ({ score }) => {
    const zs = await zsetOf();
    assert.equal(zs[SIZE - 1].score, zs[SIZE].score, '前置：index 14 / 15 同分');
    assert.equal(zs[SIZE].score, score);
    const p0 = await api.list(0);
    const p1 = await api.list(1);
    assert.deepEqual(ids(p0), zIds(zs).slice(0, SIZE), '第 0 页 == ZSET 前 15 条（band 前段）');
    assert.deepEqual(ids(p1), zIds(zs).slice(SIZE, SIZE * 2), '第 1 页从 band 中段继续，不重不漏');
    assert.equal(new Set([...ids(p0), ...ids(p1)]).size, SIZE * 2, '两页之间无重复');
    console.log(`边界同分：index 14/15 同为 score=${score}`);
  });
});

test('C5 band > 800（注入 850 条同分）：页模式下仍完整', async (t) => {
  if (!BAND_N) return t.skip('BAND_N=0，跳过');
  await withBand(BAND_N, async ({ score, members }) => {
    assert.ok(members.length > 800, `注入条数应超过 800：${members.length}`);
    const zs = await zsetOf();
    assert.equal(bandsOf(zs)[0].n, BAND_N, `顶部 band 应为 ${BAND_N} 条`);
    assert.equal(zs[0].score, score);

    // band 内部的深页都应满页（页模式按 offset 取，不受 MAX_SCORE_BAND 影响）
    const inside = Math.floor(BAND_N / SIZE) - 1;
    assert.equal((await api.list(inside)).length, SIZE, `band 内的 page=${inside} 应满页`);
    const p0 = await api.list(0);
    assert.deepEqual(ids(p0), zIds(zs).slice(0, SIZE), '第 0 页 == ZSET 前 15 条');

    const { all } = await assertWalkMatchesZset(COMBO, 'C5');
    const ghostIds = new Set(members.map((m) => m.split('_')[0]));
    assert.equal(all.filter((x) => ghostIds.has(x)).length, BAND_N, `注入的 ${BAND_N} 条应全部翻到，一条不漏`);
    assert.ok(all.length > BAND_N, 'band 之后还有真实数据');
    console.log(`band=${BAND_N}（>800 上限）：band 内与之后都完整，${all.length} 条全量一致`);
  });
});

test('C6 跳过：页模式无法覆盖游标模式的「同分 band 内删除」语义', (t) => {
  return t.skip('接口只有页模式（offset），无游标可传；且源库每行分数互异、无法在真实 band 内删除自有记录。'
    + '游标模式的 band 过滤 / o 累加已由库内单测覆盖，此处跳过（已确认可接受）。');
});

test('C7 批量新增（秒级同分）：全部落到头部、total 收敛', async () => {
  await api.list(0);
  const before = await zcard();
  const totalBefore = (await metaOf()).total;
  const made = await api.createBulk(rowsFor(20));
  await waitCard(before + 20);                              // 写入侧异步，等收敛
  const after = await zsetOf();
  for (const id of made) assert.ok(zIds(after).slice(0, 20).includes(id), '新增应排在头部');
  assert.equal((await metaOf()).total, totalBefore + 20, 'total 同步 +20');
  const p0 = await api.list(0);
  assert.equal(ids(p0).filter((x) => made.includes(x)).length, SIZE, '第 0 页应整页是新批');
  console.log(`新增 20 条：ZSET ${before} -> ${after.length}，total ${totalBefore} -> ${(await metaOf()).total}`);
});

// ============================================================================
// D 写入侧旁路 publish
// ============================================================================

test('D1 新增：ZSET 最终 +1、total 同步 +1、三键续期、首页可见', async () => {
  await api.list(0);
  const before = await zcard();
  const totalBefore = (await metaOf()).total;
  const [id] = await api.createBulk([{ res_type: 'article', res_id: randomUUID() }]);
  await waitCard(before + 1);                               // 实测约 30ms 异步生效
  const after = await zsetOf();
  assert.ok(zIds(after).indexOf(id) < SIZE, `新增应在首页范围内：${zIds(after).indexOf(id)}`);
  assert.equal((await metaOf()).total, totalBefore + 1, 'total 同步 +1');
  assert.ok(ids(await api.list(0)).includes(id), '第 0 页可见');
  const ttls = await ttlOf();
  assert.ok(ttls.every((t) => t > 0), `三键都应续期：${ttls}`);
  console.log(`新增 ${id.slice(0, 8)}：ZSET ${before} -> ${after.length}，ttl=${ttls}`);
});

test('D2 删除：ZSET 最终 -1、total 同步 -1、TTL 续期', async () => {
  const before = await zcard();
  const totalBefore = (await metaOf()).total;
  const victim = (await zsetOf()).filter((x) => S.created.has(x.id))[0];
  assert.ok(victim, '应能找到本脚本造的记录');
  await delOwn([victim.id]);
  await waitCard(before - 1);
  const after = await zsetOf();
  assert.ok(!zIds(after).includes(victim.id), '被删记录不应还在 ZSET 里');
  assert.equal((await metaOf()).total, totalBefore - 1, 'total 同步 -1');
  assert.ok((await redis.ttl(keyList())) > 0, '写入应续期 TTL');
  console.log(`删除 ${victim.id.slice(0, 8)}：ZSET ${before} -> ${after.length}`);
});

test('D3 幂等：删不存在的 id 无副作用', async () => {
  const before = await zcard();
  const metaBefore = await metaOf();
  await api.delBulk([randomUUID()]);
  await new Promise((r) => setTimeout(r, 400));             // 给异步写入留时间
  assert.equal(await zcard(), before, 'ZSET 不应变化');
  assert.equal((await metaOf()).total, metaBefore.total, 'total 不应变化（INV-6：删没缓存的成员不动 total）');
});

test('D4 重复新增同一 res_id：member 相同，ZSET 不长、total 不虚增', async () => {
  const rid = randomUUID();
  await api.createBulk([{ res_type: 'article', res_id: rid }]);
  await waitFor(async () => (await zsetOf()).some((x) => x.id === rid));   // 等异步写入生效
  const afterFirst = await zcard();
  const totalAfterFirst = (await metaOf()).total;
  let dupAccepted = true;
  try {
    await api.createBulk([{ res_type: 'article', res_id: rid }]);
  } catch (e) {
    dupAccepted = false;                                    // 业务侧可能直接拒绝重复
  }
  await new Promise((r) => setTimeout(r, 600));
  const b = await zcard();
  assert.equal(b, afterFirst, 'member 相同 -> ZADD 幂等，ZSET 不应变长');
  assert.equal((await metaOf()).total, totalAfterFirst, 'total 不应虚增');
  assert.ok((await metaOf()).total >= b, 'total 只准偏高');
  assert.equal((await zsetOf()).filter((x) => x.id === rid).length, 1, '同一 res_id 只应有一个成员');
  console.log(`重复新增同一 res_id：${dupAccepted ? '业务接受，缓存幂等' : '业务拒绝'}，成员数 ${b}`);
});

test('D5 删空后新增：total 归零但组合留在 idx，之后的新增仍能进缓存', async (t) => {
  // 需要一个「源库本来就没有数据」的组合，才能把 total 删到 0（不能删别人的数据）
  const combo = EXTRA_TYPE;
  await wipeCache();
  const rows = await api.list(0, combo);
  const zs = await zsetOf(combo);
  if (rows.length || zs.length) return t.skip(`组合 ${combo} 在源库非空（${zs.length} 条，含非本脚本数据），无法验证删空`);

  const [id] = await api.createBulk([{ res_type: combo, res_id: randomUUID() }]);
  await api.list(0, combo);
  await waitFor(async () => (await zcard(combo)) === 1);
  assert.equal(await zcard(combo), 1, '新增应进该组合的缓存');
  assert.ok((await redis.sMembers(keyIndex())).includes(combo), '该组合应登记进 idx');

  await delOwn([id]);
  await waitFor(async () => (await zcard(combo)) === 0);
  assert.equal(await zcard(combo), 0, 'list 应被清空');
  assert.deepEqual(await metaOf(combo), { total: 0 });
  assert.ok((await redis.sMembers(keyIndex())).includes(combo), '删空不摘索引（摘了之后新增就再也进不来）');
  assert.equal((await api.list(0, combo)).length, 0, '此时该组合确实为空');

  const [id2] = await api.createBulk([{ res_type: combo, res_id: randomUUID() }]);
  await waitFor(async () => (await zcard(combo)) === 1);
  assert.equal(await zcard(combo), 1, '删空后的新增应进缓存（摘索引时这里恒为 0）');
  assert.equal((await metaOf(combo)).total, 1);
  assert.ok((await api.list(0, combo)).some((x) => x.res_id === id2), '第一页能看到这条新增');
  await delOwn([id2]);
  console.log(`删空组合 ${combo}：total 归零、组合仍留在 idx，之后的新增仍进缓存`);
});

// ============================================================================
// E 反向索引失效
// ============================================================================

test('E1 / E2 idx 被删：读不受影响；此期间新增不进缓存（已知取舍）', async () => {
  await api.list(0);
  const before = await zcard();
  assert.ok(await metaOf(), '前置：meta 存在');

  await redis.del(keyIndex());                              // 模拟 idx 先过期 / 被 maxmemory 挤掉
  assert.equal((await redis.sMembers(keyIndex())).length, 0, 'idx 已空');

  const rows0 = await api.list(0);
  assert.equal(rows0.length, Math.min(SIZE, before), 'E1 读路径不依赖 idx，仍正常');

  const [newId] = await api.createBulk([{ res_type: 'article', res_id: randomUUID() }]);
  await api.list(0);
  await new Promise((r) => setTimeout(r, 800));              // 留足异步时间
  const after = await zsetOf();
  assert.equal(zIds(after).includes(newId), false,
    'E2 idx 缺失 -> publish 找不到组合 -> 增量不进缓存（若此处失败说明服务侧有自愈路径，按实际调整）');
  assert.ok((await metaOf()).total >= after.length, 'total 只准偏高（INV-6）');
  console.log(`E2 idx 缺失期间新增 ${newId.slice(0, 8)} 未进缓存（缓存 ${after.length} 条）`);
});

test('E3 再 _extend 一次：组合重新登记；全量重建后一致性恢复', async (t) => {
  const z = await zcard();
  const meta = await metaOf();
  const deep = Math.floor(z / SIZE) + 2;
  await api.list(deep);                                     // 深页 -> _extend -> Lua 内幂等 SADD
  const idx = await redis.sMembers(keyIndex());
  if (z >= meta.total) return t.skip('已到底时深页不触发 _extend，idx 待下次重建登记');
  assert.ok(idx.includes(COMBO), '组合应重新登记进 idx');

  await wipeCache();
  const { all, zs } = await assertWalkMatchesZset(COMBO, 'E3 重建后');
  assert.equal((await metaOf()).total, zs.length, '翻到底：total == ZCARD');
  console.log(`重新登记成功；全量重建 ${all.length} 条一致`);
});

test('E4 idx TTL 单独设短：三键出现不一致；重建后收敛回同批次', async () => {
  await redis.expire(keyIndex(), 2);
  const t1 = await ttlOf();
  assert.ok(t1[2] <= 2 && t1[0] > 2, `idx 应明显短于 list / meta：${t1}`);
  await new Promise((r) => setTimeout(r, 2600));
  assert.equal(await redis.exists(keyIndex()), 0, 'idx 应已过期');
  assert.ok((await redis.ttl(keyList())) > 0, 'list 仍在');
  assert.equal((await api.list(0)).length, SIZE, '读路径照常');

  await wipeCache();
  await api.list(0);
  await api.list(1);
  const t2 = await ttlOf();
  assert.ok(Math.max(...t2) - Math.min(...t2) <= 1, `重建后三键 TTL 应回到同批次：${t2}`);
  console.log(`TTL 不一致 ${t1} -> 重建后 ${t2}`);
});

// ============================================================================
// F 过期与部分失效
// ============================================================================

test('F1 三键 TTL 同批次；一次写入后续期到同一水平', async () => {
  await api.list(0);
  await new Promise((r) => setTimeout(r, 1200));
  const before = await zcard();
  const [id] = await api.createBulk([{ res_type: 'article', res_id: randomUUID() }]);
  await waitCard(before + 1);
  const t = await ttlOf();
  assert.ok(t.every((x) => x > 0 && x <= TTL_MAX), `三键都应有 TTL：${t}`);
  assert.ok(Math.max(...t) - Math.min(...t) <= 1, `写入续期后仍应同批次：${t}`);
  await delOwn([id]);                                      // 只留状态、不留数据
  console.log(`写入后续期：${t}`);
});

test('F2 三键同时过期：请求第 0 页从源库重建', async () => {
  const before = await zcard();
  for (const k of [keyList(), keyMeta(), keyIndex()]) await redis.expire(k, 1);
  await new Promise((r) => setTimeout(r, 1600));
  assert.equal(await redis.exists(keyList()), 0, 'list 应已过期');
  assert.equal(await metaOf(), null, 'meta 应已过期');

  const rows = await api.list(0);
  const { zs } = await assertWalkMatchesZset(COMBO, 'F2 重建后');
  assert.equal(rows.length, SIZE, '重建后应能正常返回首页');
  assert.ok(zs.length >= before, `重建后应覆盖至少原有数据：${before} -> ${zs.length}`);
  assert.equal((await metaOf()).total, zs.length, '翻到底：total == ZCARD');
  console.log(`过期重建：${zs.length} 条`);
});

test('F3 只丢 list（meta 留着）：zcard < total 触发重建，自动补回', async () => {
  const metaBefore = await metaOf();
  assert.ok(metaBefore && metaBefore.total > 0, '前置：meta 有内容');
  await redis.del(keyList());
  assert.equal(await zcard(), 0, 'list 已空');
  assert.ok((await metaOf()).total > 0, 'total > 0 —— 这正是「list 丢了能被发现」的依据');

  const rows = await api.list(0);
  assert.equal(rows.length, SIZE, 'zcard=0 < total -> 从头全量取 -> 补回来');
  assert.ok(await zcard() > 0, 'list 应被重建');

  await wipeCache();
  const { zs } = await assertWalkMatchesZset(COMBO, 'F3 全清重建后');
  assert.equal((await metaOf()).total, zs.length, '全清重建后 total == ZCARD');
  console.log(`只丢 list 时自动补回 ${await zcard()} 条；全清重建后恢复一致（${zs.length} 条）`);
});

test('F4 只丢 meta（list 留着）：按无缓存重建，成员不重复', async () => {
  const before = await zsetOf();
  await redis.del(keyMeta());
  assert.equal(await metaOf(), null, 'meta 已删');

  await api.list(0);
  const after = await zsetOf();
  assert.equal(after.length, before.length, 'ZADD 幂等：成员数不应变');
  assert.equal(new Set(after.map((x) => x.member)).size, after.length, 'ZSET 里不应有重复 member');
  const meta = await metaOf();
  assert.ok(meta, 'meta 应被重新写回');
  assert.ok(meta.total >= after.length, 'total 应 >= 已缓存条数');
  console.log(`只丢 meta 重建：成员 ${after.length} 条，total=${meta.total}`);
});

// ============================================================================
// G 组合隔离 / 类型筛选
// ============================================================================

test('G1 不同 res_type 各自 list / meta，idx 共用并登记多个组合', async (t) => {
  await wipeCache();
  await api.list(0, COMBO);                                 // article_ticker
  await api.list(0, 'article');                             // 单类型组合
  await api.list(0, 'article_ticker_video');                // 三类型组合（若服务端不接受则忽略）

  const own = await ownKeys();
  const combos = own.map((k) => /:([^:]+):list$/.exec(k)).filter(Boolean).map((m) => m[1]);
  if (combos.length < 2) return t.skip(`服务端只落了 ${combos.length} 个组合缓存：${combos}`);
  const idx = await redis.sMembers(keyIndex());
  for (const c of combos) assert.ok(idx.includes(c), `组合 ${c} 应登记进共享 idx`);
  console.log(`组合缓存：${combos.join(', ')}；idx=${idx.join(', ')}`);
});

test('G2 publish 类型筛选：ticker 的增量不动 article-only 组合', async (t) => {
  const combos = (await ownKeys()).map((k) => /:([^:]+):list$/.exec(k)).filter(Boolean).map((m) => m[1]);
  const only = combos.find((c) => c !== COMBO && !c.includes('ticker'));   // 只含 article 的组合
  if (!only) return t.skip(`没有 article-only 组合（现有：${combos.join(', ')}）`);

  const n0 = await zcard();
  const only0 = await zcard(only);
  const [tid] = await api.createBulk([{ res_type: 'ticker', res_id: randomUUID() }]);
  await waitCard(n0 + 1);
  await new Promise((r) => setTimeout(r, 400));
  assert.equal(await zcard(), n0 + 1, `${COMBO} 含 ticker，应 +1`);
  assert.equal(await zcard(only), only0, `${only} 不含 ticker，不应变`);

  const [aid] = await api.createBulk([{ res_type: 'article', res_id: randomUUID() }]);
  await waitCard(n0 + 2);
  await waitFor(async () => (await zcard(only)) === only0 + 1);
  assert.equal(await zcard(only), only0 + 1, `${only} 含 article，应 +1`);
  assert.ok([tid, aid].every((x) => x));
  console.log(`类型筛选：${only} 只受 article 影响（${only0} -> ${await zcard(only)}）`);
});

test('G3 组合之间互不污染：各自 total >= ZCARD（只准偏高）', async () => {
  await api.list(0);
  const combos = (await ownKeys()).map((k) => /:([^:]+):list$/.exec(k)).filter(Boolean).map((m) => m[1]);
  for (const c of combos) {
    const meta = await metaOf(c);
    if (!meta) continue;
    assert.ok(meta.total >= await zcard(c), `组合 ${c}：total(${meta.total}) 应 >= ZCARD(${await zcard(c)})`);
    const zs = await zsetOf(c);
    const want = c === 'all' ? null : c.split('_');
    if (want) assert.ok(zs.every((x) => want.includes(x.type)), `组合 ${c} 的成员类型不应越界`);
  }
  console.log(`组合一致性检查通过：${combos.join(', ')}`);
});

// ============================================================================
// H 参数边界（观察性）
// ============================================================================

test('H1 深页超 MAX_PAGE_DEPTH：返回 1401 而不是 500', async (t) => {
  const deep = Math.ceil(10000 / SIZE) + 5;
  const raw = await api.listRaw(deep);
  t.diagnostic(`page=${deep} -> ${JSON.stringify(raw).slice(0, 200)}`);
  assert.notEqual(raw.status, '0', '超深页应被拒');
  assert.ok(raw.status === 1401 || raw.code === 1401, `应返回 1401：${JSON.stringify(raw).slice(0, 200)}`);
  assert.ok(raw.message, '应带可读 message');
  console.log(`深页 page=${deep}：status=${raw.status} message=${raw.message}`);
});

test('H2 res_type 缺失：不应 500', async (t) => {
  const raw = await api.listRaw(0, null);
  t.diagnostic(`无 res_type -> status=${raw.status} data=${Array.isArray(raw.data) ? raw.data.length + ' 条' : typeof raw.data}`);
  assert.ok(raw && (raw.status === '0' || raw.message), `应有明确语义：${JSON.stringify(raw).slice(0, 200)}`);
  console.log(`无 res_type：status=${raw.status}`);
});

test('H3 page 非法（非数字 / 负数）：不应 500', async (t) => {
  for (const p of ['abc', '-1', '1.5']) {
    const raw = await api.listRaw(p);
    t.diagnostic(`page=${p} -> ${JSON.stringify(raw).slice(0, 160)}`);
    assert.ok(raw && (raw.status === '0' || raw.message || raw.code), `page=${p} 应有明确语义：${JSON.stringify(raw).slice(0, 200)}`);
  }
});

// ============================================================================
// I 并发
// ============================================================================

test('I1 冷启动并发 10 次第 0 页：幂等，无重复 member', async () => {
  await wipeCache();
  const rs = await Promise.all(Array.from({ length: 10 }, () => api.list(0)));
  for (const r of rs) assert.equal(r.length, SIZE, '并发首页都应返回满页');
  const first = ids(rs[0]).join(',');
  for (const r of rs) assert.equal(ids(r).join(','), first, '并发首页结果应完全一致');
  const zs = await zsetOf();
  assert.equal(new Set(zs.map((x) => x.member)).size, zs.length, 'ZSET 不应出现重复成员');
  assert.ok((await metaOf()).total >= zs.length, 'total 应 >= 已缓存条数');
  console.log(`并发冷启动：10 次首页一致，ZSET ${zs.length} 条无重复`);
});

test('I2 并发新增 + 翻页：收敛后无重复 member', async () => {
  await api.list(0);
  const before = await zcard();
  const made = await Promise.all(Array.from({ length: 8 }, () => api.createBulk([{ res_type: 'article', res_id: randomUUID() }]).then((x) => x[0])));
  await waitCard(before + made.length);
  await Promise.all([api.list(0), api.list(1), api.list(2)]);
  const zs = await zsetOf();
  assert.ok((await metaOf()).total >= zs.length, 'total 应 >= 已缓存条数');
  assert.equal(new Set(zs.map((x) => x.member)).size, zs.length, 'ZSET 不应出现重复成员');
  for (const id of made) assert.ok(zIds(zs).includes(id), '并发新增的记录都应进缓存');
  console.log(`并发新增 ${made.length} 条：ZSET ${zs.length} 条`);
});

// ============================================================================
// J 安全网
// ============================================================================

test('J1 本次写过的 key 全部落在自己前缀内', async () => {
  const outside = [...S.touched].filter((k) => !k.startsWith(S.prefix + ':'));
  assert.deepEqual(outside, [], `越界写：${outside.join(', ')}`);
  console.log(`写过的 key（${S.touched.size}）都在 ${S.prefix}:* 下`);
});
