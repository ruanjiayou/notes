'use strict';

/**
 * 极简 MongoDB 集合替身：只实现 UserPaginatorCache 用到的契约
 *   coll.find(filter).sort(sort).limit(n).lean()  → thenable，解析为文档数组
 *   coll.countDocuments(filter)                   → Promise<number>
 *
 * 支持的操作符：等值、$in、$lt/$lte/$gt/$gte、$and、$or；Date 与字符串按原始值比较。
 * 目的：在没有 Mongo 实例时也能把分页 / keyset / 脏数据过滤跑通。
 */

const norm = (v) => (v instanceof Date ? v.getTime() : v);

function matchValue(val, cond) {
  if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
    for (const [op, operand] of Object.entries(cond)) {
      const a = norm(val);
      const b = norm(operand);
      switch (op) {
        case '$in':
          if (!operand.some((x) => norm(x) === a)) return false;
          break;
        case '$lt':
          if (!(a < b)) return false;
          break;
        case '$lte':
          if (!(a <= b)) return false;
          break;
        case '$gt':
          if (!(a > b)) return false;
          break;
        case '$gte':
          if (!(a >= b)) return false;
          break;
        case '$ne':
          if (a === b) return false;
          break;
        default:
          throw new Error(`FakeCollection: 不支持的查询操作符 ${op}`);
      }
    }
    return true;
  }
  return norm(val) === norm(cond);
}

function match(filter, doc) {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (k === '$and') return v.every((sub) => match(sub, doc));
    if (k === '$or') return v.some((sub) => match(sub, doc));
    if (k === '$nor') return !v.some((sub) => match(sub, doc));
    return matchValue(doc[k], v);
  });
}

function compare(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (x === y) return 0;
  return x < y ? -1 : 1;
}

class FakeQuery {
  constructor(docs, filter) {
    this.docs = docs;
    this.filter = filter;
    this.spec = null;
    this.n = Infinity;
  }
  sort(spec) {
    this.spec = spec;
    return this;
  }
  limit(n) {
    this.n = n;
    return this;
  }
  lean() {
    return this;
  }
  _run() {
    let rows = this.docs.filter((d) => match(this.filter, d));
    if (this.spec) {
      const entries = Object.entries(this.spec);
      rows = rows.slice().sort((a, b) => {
        for (const [k, dir] of entries) {
          const c = compare(a[k], b[k]);
          if (c !== 0) return dir < 0 ? -c : c;
        }
        return 0;
      });
    }
    return rows.slice(0, this.n);
  }
  then(resolve, reject) {
    return Promise.resolve()
      .then(() => this._run())
      .then(resolve, reject);
  }
}

class FakeCollection {
  constructor(docs = []) {
    this.docs = docs;
  }
  find(filter) {
    return new FakeQuery(this.docs, filter);
  }
  countDocuments(filter) {
    return Promise.resolve(this.docs.filter((d) => match(filter, d)).length);
  }
  insert(doc) {
    this.docs.push(doc);
    return doc;
  }
  remove(pred) {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => !pred(d));
    return before - this.docs.length;
  }
}

module.exports = { FakeCollection, FakeQuery, match };
