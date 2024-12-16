const mongoose = require('mongoose');

/**
 * TODO: 
 * 使用说明: new Migration(src, dst).option(key, value).table(src, dst).batch(fn, cb)
 * .acc().clear()
 */
module.exports = class Migration {
  constructor(src, dst) {
    this.connSrc = null;
    this.connDst = null;
    this.tableSrc = null;
    this.tableDst = null;
    this.options = {
      limit: 100,
      filter: {},
      offset: 0,
      primaryKey: 'id',
    };
    this.count = {
      nMatched: 0,
      nInserted: 0,
      nUpserted: 0,
      nModified: 0,
      nRemoved: 0,
    };
    this.connect(src, dst);
  }
  setOption(key, value) {
    if (value === undefined) {
      delete this.option[key];
    } else if (typeof key === 'string') {
      this.options[key] = value;
    } else {
      for (let k in key) {
        this.options[k] = key[k];
      }
    }
    return this;
  }
  acc(res) {
    for (let n in res) {
      this.count[n] += res[n];
    }
    return this;
  }
  analysis() {
    console.log(`Total: ${this.options.offset}`);
    console.log(`nMatched: ${this.count.nMatched}`);
    console.log(`nInserted: ${this.count.nInserted}`);
    console.log(`nUpserted: ${this.count.nUpserted}`);
    console.log(`nModified: ${this.count.nModified}`);
    console.log(`nRemoved: ${this.count.nRemoved}`);
    return this;
  }
  clear() {
    this.count = {
      nMatched: 0,
      nInserted: 0,
      nUpserted: 0,
      nModified: 0,
      nRemoved: 0,
    };
    return this;
  }
  connect(src, dst) {
    this.connSrc = mongoose.createConnection(`mongodb://${src.user ? src.user + ':' + src.pass : ''}@${src.host}:${src.port}/${src.db}?authSource=admin`, { useNewUrlParser: true });
    this.connDst = mongoose.createConnection(`mongodb://${dst.user ? dst.user + ':' + dst.pass : ''}@${dst.host}:${dst.port}/${dst.db}?authSource=admin`, { useNewUrlParser: true });
    return this;
  }
  table(src, dst) {
    this.tableSrc = this.connSrc.model(src, new mongoose.Schema({}, { strict: false }));
    this.tableDst = this.connDst.model(dst || src, new mongoose.Schema({}, { strict: false }));
    return this;
  }
  async batch(fn, cb) {
    let len = 0, offset = 0;
    let { limit, filter, primaryKey } = this.options;
    do {
      let docs = await this.tableSrc.find(filter).limit(limit).skip(offset).lean(true);
      len = docs.length;
      console.log(`正在处理: ${offset}-${offset + len}`);
      await fn.call(this, this.tableDst, docs);
      offset += len;
    } while (len === limit);
    cb && cb.call(this);
    this.analysis();
    this.options.offset = 0;
    this.clear();
    return this;
  }
};