const mongoose = require('mongoose');

// const condition = { source_type: 'music' };
const condition = {  };
const primaryKey = 'id';

const db1 = mongoose.createConnection('mongodb://root:123456@localhost:27017/novel?authSource=admin=readPreference=primaryPreferred');
const db2 = mongoose.createConnection('mongodb://root:123456@localhost:37017/novel?authSource=admin=readPreference=primaryPreferred');
console.log('start');
const sourceTable = db1.model('rules', new mongoose.Schema({}, { strict: false }));
const targetTable = db2.model('rules', new mongoose.Schema({}, { strict: false }));
(async () => {
  let len = 0,
    limit = 100,
    offset = 0;
  do {
    const results = await sourceTable.find(condition).limit(limit).skip(offset).lean(true);
    len = results.length;
    offset += len;
    const arr = [];
	console.log(results.map(item=>item[primaryKey]))
    results.forEach(result => {
      arr.push({
        updateOne: {
          filter: { [primaryKey]: result[primaryKey] },
          update: result,
          upsert: true
        }
      })
    })
    if (arr.length) {
      await targetTable.bulkWrite(arr)
    }
  } while (len === limit);
  console.log('同步完成')
  process.exit(0)
})()