'use strict';

/**
 * 不连库的形状测试：校验 keyset filter / sort / key 派生是否正确。
 * 源库 `_id` 全为字符串，所以这里只盯两件事：
 *   - 时间比较必须给 Date（给毫秒数 Mongo 会按类型不匹配而查不到）；
 *   - `_id` 用 member 里的字符串原样比较（不做 ObjectId 转换）。
 * 用普通对象当 model 替身，不需要 mongoose / Mongo。
 *
 * 方向（rev）只来自构造函数，所以这里每个方向各建一个实例来核对。
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { UserPaginatorCache } = require('../src/user-paginator-cache');

const fakeModel = () => ({ find() {}, countDocuments() {} });
const ID = '000000000000000000000010';

const build = (opts) => new UserPaginatorCache({ model: fakeModel(), ...opts });

test('keyset filter 结构：where + types 组合 + 同分兜底，时间给 Date，_id 保持字符串', () => {
  const cache = build({
    key: 'user:v6:user:{ua}:history:subscribe:act_time',
    where: { uid: 'ua' },
    fields: ['res_type'],
    types: ['article', 'subscription'],
  });

  const filter = cache._buildFilter({ member: `${ID}_subscription`, score: 1767225600000 });
  assert.equal(filter.$and.length, 3);
  assert.deepEqual(filter.$and[0], { uid: 'ua' });
  assert.deepEqual(filter.$and[1], { res_type: { $in: ['article', 'subscription'] } });

  const tie = filter.$and[2].$or[1];
  assert.ok(tie.act_time instanceof Date, 'score 分支必须是 Date');
  assert.equal(tie.act_time.getTime(), 1767225600000);
  assert.equal(tie._id.$lt, ID, '_id 是字符串，原样比较');
  assert.equal(typeof tie._id.$lt, 'string');

  assert.equal(filter.$and[2].$or[0].act_time.$lt instanceof Date, true, '降序用 $lt');
});

test('只有 where 时 filter 就是 where 本身（不套 $and）', () => {
  const cache = build({ key: 'user:v6:user:{ua}:history:act_time', where: { uid: 'ua' } });
  assert.deepEqual(cache._buildFilter(null), { uid: 'ua' });
});

test('升序实例的 keyset 用 $gt；score 也是 Date', () => {
  const cache = build({ key: 'user:v6:subscription:{ub}:history:fans:act_time', fields: ['from_type'], rev: false });
  const f = cache._buildFilter({ member: `${ID}_user`, score: 1 });
  assert.ok(f.$and[1].$or[0].act_time.$gt instanceof Date, '升序用 $gt');
  assert.equal(f.$and[1].$or[1]._id.$gt, ID);
});

test('sort 规格跟着构造时的 rev：降序 -1 / 升序 1，先分数字段后 id', () => {
  const opts = { key: 'user:v6:user:{ua}:history:subscribe:act_time', fields: ['res_type'] };
  assert.deepEqual(build(opts)._sort(), { act_time: -1, _id: -1 });
  assert.deepEqual(build({ ...opts, rev: false })._sort(), { act_time: 1, _id: 1 });
});

test('key 派生：分数字段名取自 key 最后一段，方向进 key，fields 只传一个时 id 默认 _id', () => {
  const opts = {
    key: 'user:v6:user:{ua}:history:subscribe:act_time',
    where: { uid: 'ua' },
    fields: ['res_type'],
    types: ['article', 'subscription'],
  };
  const desc = build(opts);
  assert.equal(desc.opts.fieldScore, 'act_time');
  assert.equal(desc.opts.fieldType, 'res_type');
  assert.equal(desc.opts.fieldId, '_id');
  assert.equal(desc.opts.combo, 'article_subscription');
  assert.equal(desc.opts.rev, true, 'rev 缺省 true');
  assert.equal(desc.opts.keyIdx, 'user:v6:user:{ua}:history:subscribe:act_time:idx', '反向索引与方向无关');

  const d = desc._keys();
  assert.equal(d.dir, 'desc');
  assert.equal(d.entry, 'article_subscription:desc');
  assert.equal(d.keyList, 'user:v6:user:{ua}:history:subscribe:act_time:article_subscription:desc:list');
  assert.equal(d.keyMeta, 'user:v6:user:{ua}:history:subscribe:act_time:article_subscription:desc:meta');

  const asc = build({ ...opts, rev: false });
  assert.equal(asc.opts.rev, false);
  const a = asc._keys();
  assert.equal(a.dir, 'asc');
  assert.equal(a.entry, 'article_subscription:asc');
  assert.equal(a.keyList, 'user:v6:user:{ua}:history:subscribe:act_time:article_subscription:asc:list');
  assert.notEqual(a.keyList, d.keyList);
  assert.equal(a.keyIdx, d.keyIdx, '索引键仍是同一个');
});

test('types=all 时 combo 为 all，且不往 filter 里加类型条件', () => {
  const cache = build({ key: 'user:v6:user:{ua}:history:act_time', where: { uid: 'ua' } });
  assert.equal(cache.opts.combo, 'all');
  assert.deepEqual(cache._buildFilter(null), { uid: 'ua' });
});

test('fields 第二个位置可显式指定 id 字段名（仍按字符串比）', () => {
  const cache = build({ key: 'user:v6:user:{ua}:history:act_time', where: {}, fields: ['res_type', 'row_id'] });
  assert.equal(cache.opts.fieldId, 'row_id');
  const f = cache._buildFilter({ member: `abc_row_type`, score: 5 });
  assert.equal(f.$and[1].$or[1].row_id.$lt, 'abc', 'member 的 id 段按下划线反解，仍是字符串');
});
