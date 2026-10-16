'use strict';

/**
 * UserPaginatorCache 主测试：跑在真实 Redis 上（默认 docker 里的 redis，db 15），
 * 源库用内存替身 FakeCollection（Mongo 契约子集），无需 Mongo 实例。
 *
 *   node --test test/*.test.js
 *   REDIS_URL=redis://127.0.0.1:6379/15 node --test test/*.test.js
 *
 * REDIS_URL 必须在 require 之前设置：redis 客户端由模块内部创建。
 *
 * 排序方向由构造参数 rev 决定（缺省 true = 降序），一个实例只服务一个方向；
 * 分页方法不再收方向参数，游标也不带方向。要两种排序就按同一 key 建两个实例，
 * 两者共用一份反向索引 `{prefix}:idx`，各自持自己的 `desc` / `asc` 缓存。
 */

process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6369/15';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  UserPaginatorCache,
  PaginationError,
  decodeCursor,
  encodeCursor,
  redis,
} = require('../src/user-paginator-cache');
const { FakeCollection } = require('./helpers/fake-model');

const hex24 = (n) => Number(n).toString(16).padStart(24, '0');
const BASE = Date.UTC(2026, 0, 1);

/** n 条文档，act_time 每条 +1s（i 越大越新） */
function buildDocs(n, { uid = 'u1', type = 'article', start = 1 } = {}) {
  const docs = [];
  for (let i = 0; i < n; i += 1) {
    docs.push({
      _id: hex24(start + i),
      uid,
      res_id: String(1000 + start + i),
      res_type: type,
      act_time: new Date(BASE + (start + i) * 1000),
    });
  }
  return docs;
}

const KEY = (tag) => `user:v6:user:{${tag}}:history:subscribe:act_time`;

function newCache(coll, { key = KEY('u1'), where = { uid: 'u1' }, fields = ['res_type'], rev = true, ...rest } = {}) {
  return new UserPaginatorCache({ model: coll, key, where, fields, rev, ...rest });
}

const idsOf = (res) => res.list.map((d) => d.id);

/** 一路翻到底，返回全部 id 序列（方向由实例构造时的 rev 决定） */
async function walk(cache, size = 10) {
  let res = await cache.cursor(null, size);
  const ids = idsOf(res);
  let guard = 0;
  while (res.next) {
    assert.ok(guard++ < 200, '翻页次数异常，疑似死循环');
    res = await cache.paginate(res.next, size);
    ids.push(...idsOf(res));
  }
  return ids;
}

before(async () => {
  await redis.ping();
});
beforeEach(async () => {
  await redis.flushdb();
});
after(async () => {
  await redis.quit();
});

// ---------------------------------------------------------------------------

test('冷启动 + 降序游标翻页：取满、不重不漏、末页 next=null', async () => {
  const coll = new FakeCollection(buildDocs(100));
  const cache = newCache(coll, { size: 10 });

  const ids = await walk(cache, 10);
  assert.equal(ids.length, 100, '条数应等于源库条数');
  assert.equal(new Set(ids).size, 100, '不能有重复');
  const expected = buildDocs(100).map((d) => d._id).reverse(); // 降序
  assert.deepEqual(ids, expected, '降序顺序应与源库一致');

  const first = await cache.cursor(null, 10);
  assert.equal(first.total, 100);
  assert.equal(first.list[0].type, 'article');
  assert.equal(first.list[0].id, hex24(100));
  assert.ok(first.next, '还有下一页应签出游标');
  assert.equal(typeof first.next, 'string');
});

test('升序游标翻页（构造时 rev=false）', async () => {
  const coll = new FakeCollection(buildDocs(53));
  const cache = newCache(coll, { size: 12, rev: false });

  const ids = await walk(cache, 12);
  assert.deepEqual(ids, buildDocs(53).map((d) => d._id), '升序应与源库顺序一致');
});

test('rev 由构造函数决定：缺省 true（降序），显式 false 走升序', async () => {
  const coll = new FakeCollection(buildDocs(30));
  assert.equal(newCache(coll).opts.rev, true);
  assert.equal(newCache(coll, { rev: false }).opts.rev, false);

  const desc = newCache(coll, { size: 5 });
  const asc = newCache(coll, { size: 5, rev: false });
  const expected = buildDocs(30).map((d) => d._id);
  assert.deepEqual(idsOf(await desc.cursor(null, 5)), expected.slice(-5).reverse());
  assert.deepEqual(idsOf(await asc.cursor(null, 5)), expected.slice(0, 5));
});

test('同一 key 两个方向的实例：各持一份 list + meta，共用一份 idx', async () => {
  const coll = new FakeCollection(buildDocs(100));
  const desc = newCache(coll, { size: 10, step: 20 });
  const asc = newCache(coll, { size: 10, step: 20, rev: false });
  const expected = buildDocs(100).map((d) => d._id);

  // 先降序首页，再升序首页 —— 两个方向都不能串
  const desc1 = await desc.cursor(null, 10);
  assert.deepEqual(idsOf(desc1), expected.slice(-10).reverse(), '降序首页从最新起');
  const asc1 = await asc.cursor(null, 10);
  assert.deepEqual(idsOf(asc1), expected.slice(0, 10), '升序首页从最旧起');

  // 各自独立 key，互不覆盖（首页各扩了一轮：3×step = 60 条）
  assert.notEqual(desc._keys().keyList, asc._keys().keyList);
  assert.equal(await redis.zcard(desc._keys().keyList), 60);
  assert.equal(await redis.zcard(asc._keys().keyList), 60);
  // 索引只有一份，成员带方向
  assert.equal(desc.opts.keyIdx, asc.opts.keyIdx);
  assert.deepEqual((await redis.smembers(desc.opts.keyIdx)).sort(), ['all:asc', 'all:desc']);

  // 两个方向各自一路翻到底，都完整
  assert.deepEqual(await walk(desc, 10), expected.slice().reverse());
  assert.deepEqual(await walk(asc, 10), expected);
});

test('升序先建缓存，降序请求依旧从最新端开始（不串区间）', async () => {
  const coll = new FakeCollection(buildDocs(100));
  const desc = newCache(coll, { size: 10, step: 20 });
  const asc = newCache(coll, { size: 10, step: 20, rev: false });
  const expected = buildDocs(100).map((d) => d._id);

  const ascFirst = await asc.cursor(null, 10);
  assert.deepEqual(idsOf(ascFirst), expected.slice(0, 10));

  const descFirst = await desc.cursor(null, 10);
  assert.deepEqual(idsOf(descFirst), expected.slice(-10).reverse(), '降序必须用自己那份缓存，不能读升序的区间');
  assert.deepEqual(await walk(desc, 10), expected.slice().reverse());
});

test('publish 一次同时维护两个方向；clear 两份一起清', async () => {
  const coll = new FakeCollection(buildDocs(20));
  const desc = newCache(coll, { size: 5 });
  const asc = newCache(coll, { size: 5, rev: false });
  const key = KEY('u1');

  // 先把两个方向的缓存都建起来
  await desc.cursor(null, 5);
  await asc.cursor(null, 5);

  const fresh = {
    _id: hex24(21),
    uid: 'u1',
    res_id: '2000',
    res_type: 'article',
    act_time: new Date(BASE + 99000),
  };
  coll.insert(fresh);
  const out = await UserPaginatorCache.publish(key, 1, [
    { member: `${fresh._id}_${fresh.res_type}`, score: fresh.act_time.getTime() },
  ]);
  assert.deepEqual(out.changed.slice().sort(), ['all:asc', 'all:desc'], '一次 publish 两份都更新');

  assert.deepEqual(idsOf(await desc.cursor(null, 5))[0], fresh._id, '降序首页应有最新那条');
  assert.deepEqual((await walk(asc, 5)).at(-1), fresh._id, '升序末条应有最新那条');

  const n = await UserPaginatorCache.clear(key);
  assert.equal(n, 2, '两个方向都清掉');
  assert.equal(await redis.exists(desc._keys().keyList), 0);
  assert.equal(await redis.exists(asc._keys().keyList), 0);
  assert.equal(await redis.exists(desc.opts.keyIdx), 0);
});

test('paginate 两个基础值：数字页码 / null 首页 / 游标字符串', async () => {
  const coll = new FakeCollection(buildDocs(40));
  const cache = newCache(coll, { size: 10 });

  const p1 = await cache.paginate(null, 10); // null → 第 1 页
  assert.deepEqual(idsOf(p1), buildDocs(40).map((d) => d._id).reverse().slice(0, 10));

  const p2 = await cache.paginate(2, 10); // 数字 → 页模式
  assert.deepEqual(idsOf(p2), buildDocs(40).map((d) => d._id).reverse().slice(10, 20));

  const p3 = await cache.paginate(p2.next, 10); // 游标字符串 → 游标模式
  assert.deepEqual(idsOf(p3), buildDocs(40).map((d) => d._id).reverse().slice(20, 30));

  const cur = decodeCursor(p2.next);
  const p4 = await cache.paginate(cur, 10); // decodeCursor 结果也能直接传
  assert.deepEqual(idsOf(p4), idsOf(p3));
});

test('同分 band：一毫秒内 50 条也能翻完，且不重不漏', async () => {
  const docs = buildDocs(50);
  for (const d of docs) d.act_time = new Date(BASE + 5000); // 全部同分
  const coll = new FakeCollection(docs);
  const cache = newCache(coll, { size: 7 });

  const ids = await walk(cache, 7);
  assert.equal(ids.length, 50);
  assert.equal(new Set(ids).size, 50);
  // 同分靠 member 字典序定序：降序读 → id 降序
  assert.deepEqual(ids, buildDocs(50).map((d) => d._id).reverse());

  // 跨页游标应带上 band 信息
  const head = await cache.cursor(null, 7);
  const cur = decodeCursor(head.next);
  assert.equal(cur.t, BASE + 5000);
  assert.ok(cur.m, '页边界落在同分 band 内时应带探察 member');
  assert.equal(cur.o, 7, 'o 是该 band 内已交付成员累计数（本页 7 条都在同一 band）');
});

test('同分 band 跨多页时 o 累计递增', async () => {
  const docs = buildDocs(30);
  for (const d of docs) d.act_time = new Date(BASE + 9000);
  const cache = newCache(new FakeCollection(docs), { size: 5 });

  let res = await cache.cursor(null, 5);
  const os = [];
  while (res.next) {
    os.push(decodeCursor(res.next).o);
    res = await cache.paginate(res.next, 5);
  }
  assert.deepEqual(os, [5, 10, 15, 20, 25]);
});

test('page 模式与游标模式结果一致，超深度报 1401', async () => {
  const coll = new FakeCollection(buildDocs(100));
  const cache = newCache(coll, { size: 10 });

  const p1 = await cache.page(1, 10);
  const p3 = await cache.page(3, 10);
  const p10 = await cache.page(10, 10);
  const walked = await walk(cache, 10);

  assert.deepEqual(idsOf(p1), walked.slice(0, 10));
  assert.deepEqual(idsOf(p3), walked.slice(20, 30));
  assert.deepEqual(idsOf(p10), walked.slice(90, 100));
  assert.equal(p10.next, null, '末页不签游标');
  assert.equal(p10.list.length, 10);

  // page 模式下签的游标同样可用（可平滑升级到游标分页）
  const handoff = await cache.paginate(p3.next, 10);
  assert.deepEqual(idsOf(handoff), walked.slice(30, 40));

  // 升序实例的 page 模式结果独立
  const asc = newCache(coll, { size: 10, rev: false });
  const pAsc = await asc.page(2, 10);
  assert.deepEqual(idsOf(pAsc), buildDocs(100).map((d) => d._id).slice(10, 20));

  await assert.rejects(
    () => cache.page(100000, 10),
    (err) => err instanceof PaginationError && err.code === 1401
  );
});

test('step 小于页大小时靠多次扩展填满一页', async () => {
  const coll = new FakeCollection(buildDocs(46));
  const cache = newCache(coll, { size: 10, step: 3 });

  const ids = await walk(cache, 10);
  assert.equal(ids.length, 46);
  assert.equal(new Set(ids).size, 46);

  // keyset 续点严格比较：库条数与缓存条数应完全对上（没重复抓取）
  assert.equal(await redis.zcard(cache._keys().keyList), 46);
});

test('_read() 一次扩 step × extendFactor 条；_extend(n) 可按传参取 n 条', async () => {
  const coll = new FakeCollection(buildDocs(100));
  const cache = newCache(coll, { size: 100, step: 4 }); // 要 101 条，远多于一次扩展量
  const keyList = cache._keys().keyList;

  const state = await cache._read(null, 100, 0, true);
  assert.equal(await redis.zcard(keyList), 12, '缺省一次扩 3×step = 12 条');
  assert.equal(state.count, 12, '重读后的快照应看到刚写进 ZSET 的行');

  await cache._extend(30);
  assert.equal(await redis.zcard(keyList), 42, '_extend(30) 按传参条数续取');

  // 扩展量可配
  const wide = newCache(new FakeCollection(buildDocs(100)), { key: KEY('wide'), size: 100, step: 4, extendFactor: 5 });
  await wide._read(null, 100, 0, true);
  assert.equal(await redis.zcard(wide._keys().keyList), 20, 'extendFactor 可覆盖（5×step）');
});

test('page 深翻：一次扩展按目标深度放大（封顶 extendMax）', async () => {
  const coll = new FakeCollection(buildDocs(200));
  const cache = newCache(coll, { size: 10, step: 2 }); // 3×step = 6

  assert.equal(cache._extendSize(), 6, '缺省 = step × extendFactor');
  assert.equal(cache._extendSize(51), 51, '传了 depth 就按 depth 放大');
  assert.equal(cache._extendSize(99999), 1000, '封顶 extendMax');

  const p = await cache.page(5, 10); // depth = 51
  assert.equal(await redis.zcard(cache._keys().keyList), 51, '一次扩到目标深度，不必一轮轮铺');
  assert.equal(p.list.length, 10);

  // 封顶后一轮扩不满就多扩几轮，结果仍正确
  const capped = newCache(new FakeCollection(buildDocs(200)), { key: KEY('cap'), size: 10, step: 2, extendMax: 20 });
  const p2 = await capped.page(5, 10);
  assert.equal(await redis.zcard(capped._keys().keyList), 60, '每轮最多 20 条（3 轮铺到 60）');
  assert.deepEqual(idsOf(p2), buildDocs(200).map((d) => d._id).reverse().slice(40, 50));
});

test('keyset 续点落在同分边界时不重复抓取', async () => {
  const docs = buildDocs(12);
  docs[6].act_time = docs[7].act_time; // 边界同分
  const coll = new FakeCollection(docs);
  const cache = newCache(coll, { size: 3, step: 5 });

  const ids = await walk(cache, 3);
  assert.equal(ids.length, 12);
  assert.equal(new Set(ids).size, 12);
  assert.equal(await redis.zcard(cache._keys().keyList), 12, 'ZADD 应只新增，不应重复占额度');
});

test('publish add：新记录立刻进列表，total 自增', async () => {
  const coll = new FakeCollection(buildDocs(20));
  const cache = newCache(coll, { size: 5 });
  const first = await cache.cursor(null, 5);
  assert.equal(first.total, 20);

  const fresh = {
    _id: hex24(21),
    uid: 'u1',
    res_id: '2000',
    res_type: 'article',
    act_time: new Date(BASE + 99000),
  };
  coll.insert(fresh);

  const out = await UserPaginatorCache.publish(KEY('u1'), 1, [
    { member: `${fresh._id}_${fresh.res_type}`, score: fresh.act_time.getTime() },
  ]);
  assert.deepEqual(out.changed, ['all:desc'], '只建了降序缓存，就只更新降序那份');

  const after = await cache.cursor(null, 5);
  assert.equal(after.total, 21);
  assert.equal(after.list[0].id, fresh._id, '最新一条应排在第一页最前');

  const ids = await walk(cache, 5);
  assert.equal(new Set(ids).size, 21);
  assert.ok(ids.includes(fresh._id));
});

test('publish del：删除后列表不再返回，total 自减', async () => {
  const coll = new FakeCollection(buildDocs(20));
  const cache = newCache(coll, { size: 10 });
  const page = await cache.cursor(null, 10);
  const victim = page.list[0];
  assert.equal(victim.id, hex24(20));

  coll.remove((d) => d._id === victim.id);
  // 删除只给 member 字符串即可（score 用不上）
  const out = await UserPaginatorCache.publish(KEY('u1'), 0, [victim.member]);
  assert.deepEqual(out.changed, ['all:desc']);

  const after = await cache.cursor(null, 10);
  assert.equal(after.total, 19);
  const ids = await walk(cache, 10);
  assert.equal(ids.length, 19);
  assert.ok(!ids.includes(victim.id));
});

test('删掉第一页的数据后，用旧游标继续翻页不漏数据', async () => {
  const coll = new FakeCollection(buildDocs(30));
  const cache = newCache(coll, { size: 10 });
  const page1 = await cache.cursor(null, 10);

  // 删掉第一页前 3 条
  const doomed = page1.list.slice(0, 3);
  coll.remove((d) => doomed.some((x) => x.id === d._id));
  await UserPaginatorCache.publish(KEY('u1'), 0, doomed.map((d) => d.member));

  const rest = [];
  let res = await cache.paginate(page1.next, 10);
  rest.push(...idsOf(res));
  while (res.next) {
    res = await cache.paginate(res.next, 10);
    rest.push(...idsOf(res));
  }
  // 游标仍指向第 11 条，续翻应拿到剩下的 20 条，不重不漏
  assert.equal(rest.length, 20);
  assert.equal(new Set(rest).size, 20);
  assert.equal(idsOf(page1).slice(3).length + rest.length, 27);
});

test('publish 到未建缓存的组合：不动索引；缓存已过期则摘索引', async () => {
  const key = KEY('ghost');
  const empty = await UserPaginatorCache.publish(key, 1, [{ member: `${hex24(1)}_article`, score: 1 }]);
  assert.deepEqual(empty, { changed: [], stale: [] }, '没有缓存时什么都不做');

  await redis.sadd(`${key}:idx`, 'all:desc');
  const stale = await UserPaginatorCache.publish(key, 1, [{ member: `${hex24(1)}_article`, score: 1 }]);
  assert.deepEqual(stale.stale, ['all:desc']);
  assert.deepEqual(await redis.smembers(`${key}:idx`), [], '过期组合应从索引里摘掉');
});

test('删空不摘索引：删光后再 publish 仍能加回来', async () => {
  const coll = new FakeCollection(buildDocs(3));
  const cache = newCache(coll, { size: 2, key: KEY('u9'), where: { uid: 'u1' } });
  await cache.cursor(null, 2);
  const key = KEY('u9');

  const members = buildDocs(3).map((d) => `${d._id}_${d.res_type}`);
  coll.remove(() => true);
  await UserPaginatorCache.publish(key, 0, members);
  assert.equal(await redis.zcard(cache._keys().keyList), 0);
  assert.deepEqual(await redis.smembers(`${key}:idx`), ['all:desc'], '索引不能因为删空而摘掉');

  const fresh = { _id: hex24(50), uid: 'u1', res_id: '1', res_type: 'article', act_time: new Date(BASE + 999000) };
  coll.insert(fresh);
  await UserPaginatorCache.publish(key, 1, [{ member: `${fresh._id}_article`, score: fresh.act_time.getTime() }]);
  const res = await cache.cursor(null, 2);
  assert.deepEqual(idsOf(res), [fresh._id], '删空后新增应能进 list');
  assert.equal(res.total, 1);
});

test('clear：回到冷启动', async () => {
  const coll = new FakeCollection(buildDocs(12));
  const cache = newCache(coll, { size: 5 });
  await cache.cursor(null, 5);
  assert.ok(await redis.exists(cache._keys().keyList));

  const n = await UserPaginatorCache.clear(KEY('u1'));
  assert.equal(n, 1);
  assert.equal(await redis.exists(cache._keys().keyList), 0);
  assert.equal(await redis.exists(cache._keys().keyMeta), 0);
  assert.equal(await redis.exists(cache.opts.keyIdx), 0);

  const again = await walk(cache, 5);
  assert.equal(again.length, 12);
});

test('脏时间字段（零日期 / 非法 Date）被过滤，不会把 NaN 塞进 ZADD', async () => {
  const docs = buildDocs(5);
  docs.push({ _id: hex24(90), uid: 'u1', res_id: '9', res_type: 'article', act_time: '0000-00-00 00:00:00' });
  docs.push({ _id: hex24(91), uid: 'u1', res_id: '9', res_type: 'article', act_time: new Date('bogus') });
  const coll = new FakeCollection(docs);
  const cache = newCache(coll, { size: 10 });

  const res = await cache.cursor(null, 10);
  assert.equal(res.list.length, 5, '非法时间的记录不进列表');
  assert.equal(res.total, 7, 'total 是源库条数，仍然如实');
  assert.equal(await redis.zcard(cache._keys().keyList), 5);
  const vals = await redis.zrange(cache._keys().keyList, 0, -1, 'WITHSCORES');
  assert.ok(!vals.includes('NaN'));
});

test('types 组合过滤 + combo 落进 key', async () => {
  const coll = new FakeCollection([...buildDocs(4, { type: 'article' }), ...buildDocs(3, { type: 'ticker', start: 20 })]);
  const cache = newCache(coll, { size: 10, types: ['ticker', 'article'] });
  assert.equal(cache.opts.combo, 'article_ticker');
  assert.ok(cache._keys().keyList.endsWith(':list'));
  assert.ok(cache._keys().keyList.includes(':desc:list'), '方向也是 key 的一部分');

  const all = await cache.cursor(null, 10);
  assert.equal(all.total, 7);
  assert.deepEqual(
    all.list.map((d) => d.type),
    ['ticker', 'ticker', 'ticker', 'article', 'article', 'article', 'article']
  );

  const onlyTicker = newCache(coll, { size: 10, types: ['ticker'] });
  assert.equal(onlyTicker.opts.combo, 'ticker');
  const t = await onlyTicker.cursor(null, 10);
  assert.equal(t.total, 3);
  assert.ok(t.list.every((d) => d.type === 'ticker'));
});

test('TTL：三键都被续期', async () => {
  const coll = new FakeCollection(buildDocs(5));
  const cache = newCache(coll, { size: 2, ttl: 100 });
  await cache.cursor(null, 2);

  for (const k of [cache._keys().keyList, cache._keys().keyMeta, cache.opts.keyIdx]) {
    const ttl = await redis.ttl(k);
    assert.ok(ttl > 0 && ttl <= 100, `${k} 的 TTL 应为 (0,100]，实际 ${ttl}`);
  }
  // 原过期时间应被推后
  await redis.expire(cache._keys().keyList, 100);
  await cache.cursor(null, 2);
  assert.ok((await redis.ttl(cache._keys().keyList)) > 60);
});

test('游标：过期 / 非法；方向不进游标', async () => {
  const coll = new FakeCollection(buildDocs(10));
  const cache = newCache(coll, { size: 3, cursorTtl: 60 });
  const res = await cache.cursor(null, 3);

  const cur = decodeCursor(res.next);
  assert.equal(cur.r, undefined, '游标不再携带方向（方向由实例决定）');
  assert.ok(cur.e > Date.now());

  assert.throws(() => decodeCursor(res.next, () => cur.e + 1), (e) => e.code === 1403);
  assert.equal(decodeCursor(res.next, () => cur.e - 1).t, cur.t);

  assert.throws(() => decodeCursor('!!!not-base64!!!'), (e) => e.code === 1402);
  assert.throws(() => decodeCursor(encodeCursor({ x: 1 })), (e) => e.code === 1402);
  assert.throws(() => decodeCursor(''), (e) => e.code === 1402);
  // 同一游标喂给另一个方向的实例：只是读到不同区间，不再是硬错误（方向本就不在游标里）
  const asc = newCache(coll, { size: 3, cursorTtl: 60, rev: false });
  const cross = await asc.paginate(res.next, 3);
  assert.equal(cross.list.length, 3);
});

test('params 校验', async () => {
  const coll = new FakeCollection([]);
  assert.throws(() => newCache(coll, { key: 'nocolon' }), (e) => e.code === 1400);
  assert.throws(() => new UserPaginatorCache({ model: coll, key: KEY('x'), fields: [] }), /fields\[0\]/);
  assert.throws(() => newCache(coll, { step: 1 }), (e) => e.code === 1400);
  assert.throws(() => new UserPaginatorCache({ key: KEY('x') }), (e) => e.code === 1400); // 缺 model
  assert.throws(() => new UserPaginatorCache({ model: coll }), (e) => e.code === 1400); // 缺 key
  await assert.rejects(() => UserPaginatorCache.publish(''), (e) => e.code === 1400);
  await assert.rejects(() => UserPaginatorCache.clear(''), (e) => e.code === 1400);
});

test('meta 只存一个整数 total（不存水位线 / 到底标志）', async () => {
  const coll = new FakeCollection(buildDocs(5));
  const cache = newCache(coll, { size: 2, step: 6 });
  await cache._extend();
  const keyMeta = cache._keys().keyMeta;
  assert.equal(await redis.zcard(cache._keys().keyList), 5);
  assert.equal(await redis.get(keyMeta), '5', '首次扩展时把 countDocuments 结果写成纯整数');
  assert.equal(await redis.ttl(keyMeta), cache.opts.ttl, 'meta 带 TTL');

  // 库里已经取空，再扩一轮：条数不变，meta 还是那个整数（不再有 head/tail/prev/next）
  await cache._extend();
  assert.equal(await redis.get(keyMeta), '5');
  assert.equal(await redis.zcard(cache._keys().keyList), 5, '重复扩展不产生重复数据');
});

test('空库：一次扩展即到底，不签游标', async () => {
  const coll = new FakeCollection([]);
  const cache = newCache(coll, { size: 10 });
  const res = await cache.cursor(null, 10);
  assert.deepEqual(res.list, []);
  assert.equal(res.next, null);
  assert.equal(res.total, 0);
  assert.equal(await redis.get(cache._keys().keyMeta), '0', '空库也要落 total=0，否则每次请求都会重新 count');
});

test('没 publish 的写库不会凭空进缓存（TTL 到期前不会偷读库）', async () => {
  const coll = new FakeCollection(buildDocs(20));
  const cache = newCache(coll, { size: 25, step: 10 });

  const first = await cache.cursor(null, 25);
  assert.equal(first.list.length, 20);
  assert.equal(first.total, 20);
  assert.equal(await redis.zcard(cache._keys().keyList), 20);

  // 只写库、不 publish
  for (let i = 0; i < 5; i += 1) {
    coll.insert({ _id: hex24(200 + i), uid: 'u1', res_id: 'x', res_type: 'article', act_time: new Date(BASE + 1e7 + i) });
  }
  const again = await cache.cursor(null, 25);
  assert.equal(again.list.length, 20, '没 publish 的行不应该冒出来');
  assert.equal(again.total, 20);
});

test('扩展推不动缓存时不谎报到底，也不死循环', async () => {
  const docs = buildDocs(20);
  // 每次都返回同样的 10 条（且 == step）：ZADD 新增数恒为 0，水位线推不动
  const stuck = {
    find: () => ({ sort: () => ({ limit: () => ({ lean: async () => docs.slice(0, 10) }) }) }),
    countDocuments: () => Promise.resolve(20),
  };
  const cache = newCache(stuck, { size: 25, step: 10 });

  const res = await cache.cursor(null, 25);
  assert.equal(res.list.length, 10, '只交出已缓存的部分');
  assert.equal(res.next, null);
  assert.equal(res.total, 20);
  assert.equal(await redis.zcard(cache._keys().keyList), 10);
});

test('游标有效而缓存失效（TTL 到期 / clear）：扩展自愈，仍返回正确的下一页', async () => {
  const docs = buildDocs(50);
  const desc = docs.map((d) => d._id).reverse();
  const cache = newCache(new FakeCollection(docs), { size: 5, step: 10 });

  const p1 = await cache.cursor(null, 5);
  assert.deepEqual(idsOf(p1), desc.slice(0, 5));
  const cur = decodeCursor(p1.next);
  const { keyList, keyMeta } = cache._keys();

  // 缓存整体过期（list + meta 都没了）
  await redis.del(keyList, keyMeta);
  const p2 = await cache.cursor(cur, 5);
  assert.deepEqual(idsOf(p2), desc.slice(5, 10), '缓存没了也能靠扩展补回游标位置');
  assert.ok(p2.next, '后面还有数据');
  assert.equal(p2.total, 50, 'total 重新回源库统计');

  // clear() 之后带老游标同理
  await UserPaginatorCache.clear(KEY('u1'));
  const p3 = await cache.cursor(cur, 5);
  assert.deepEqual(idsOf(p3), desc.slice(5, 10));
});

test('page 模式缓存失效：从头重建扩展到目标页', async () => {
  const docs = buildDocs(50);
  const desc = docs.map((d) => d._id).reverse();
  const cache = newCache(new FakeCollection(docs), { size: 5, step: 10 });

  await cache.page(3, 5);
  const { keyList, keyMeta } = cache._keys();
  await redis.del(keyList, keyMeta);
  const p = await cache.page(3, 5);
  assert.deepEqual(idsOf(p), desc.slice(10, 15));
  assert.equal(p.total, 50);
});

test('关注场景：业务自己调两次 publish 落「订阅列表」和「粉丝列表」', async () => {
  const keySub = 'user:v6:user:{ua}:history:subscribe:act_time';
  const keyFans = 'user:v6:subscription:{ub}:history:fans:act_time';
  const at = BASE + 12345;

  const subColl = new FakeCollection([]);
  const fanColl = new FakeCollection([]);
  const subCache = new UserPaginatorCache({ model: subColl, key: keySub, where: { uid: 'ua' }, fields: ['res_type'], size: 5 });
  const fanCache = new UserPaginatorCache({ model: fanColl, key: keyFans, where: { owner: 'ub' }, fields: ['from_type'], size: 5 });

  // 先把两个列表的缓存都建起来
  await subCache.cursor(null, 5);
  await fanCache.cursor(null, 5);

  // A（普通用户）关注 B（订阅实体），两条记录分别在各自集合里刚插入
  const subRow = { _id: hex24(11), uid: 'ua', res_id: 'b', res_type: 'subscription', act_time: new Date(at) };
  const fanRow = { _id: hex24(22), owner: 'ub', from_id: 'a', from_type: 'user', act_time: new Date(at) };
  subColl.insert(subRow);
  fanColl.insert(fanRow);

  // 关注：订阅列表写 B 的类型，粉丝列表写 A 的类型，两次 publish
  const subMember = { member: `${subRow._id}_${subRow.res_type}`, score: at };
  const fanMember = { member: `${fanRow._id}_${fanRow.from_type}`, score: at };
  const [subRes, fanRes] = await Promise.all([
    UserPaginatorCache.publish(keySub, 1, [subMember]),
    UserPaginatorCache.publish(keyFans, 1, [fanMember]),
  ]);
  assert.deepEqual(subRes.changed, ['all:desc']);
  assert.deepEqual(fanRes.changed, ['all:desc']);

  const sub1 = await subCache.cursor(null, 5);
  assert.deepEqual(sub1.list.map((d) => d.type), ['subscription'], '订阅列表里存的是 B 的类型');
  const fan1 = await fanCache.cursor(null, 5);
  assert.deepEqual(fan1.list.map((d) => d.type), ['user'], '粉丝列表里存的是 A 的类型');
  assert.deepEqual(sub1.list.map((d) => d.id), [subRow._id]);

  // 取关：同样两次 publish，只给 member
  await Promise.all([
    UserPaginatorCache.publish(keySub, 0, [subMember.member]),
    UserPaginatorCache.publish(keyFans, 0, [fanMember.member]),
  ]);
  assert.deepEqual((await subCache.cursor(null, 5)).list, []);
  assert.deepEqual((await fanCache.cursor(null, 5)).list, []);
});
