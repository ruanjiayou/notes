// const mongoose = require('mongoose');
// mongoose.connect('mongodb://root:123456@localhost:27017/novel?authSource=admin&readPreference=primaryPreferred');
// const model = mongoose.model('resources', new mongoose.Schema({}, { strict: false }));
// (async () => {
// 	let len = 0, limit = 100, offset = 0;
// 	do {
// 	  console.log(len, limit);
// 	  const result = await model.find({source_type:'article'}).select({'-content': 0}).limit(limit).skip(offset).lean(true);
// 	  len += result.length;
//       offset += limit;
// 	  const buff = [];
// 	  for(let i=0;i<result.length;i++){
// 		const data = result[i];
// 	    buff.push({
// 		  updateOne: {
// 		    filter: {source_type: data.source_type, source_id: data.source_id },
// 			update: { $set: {id: data.source_id} },
// 	        upsert: false,
// 		  },
// 		});
// 	  };
// 	  if(buff.length) {
// 	    await model.bulkWrite(buff);
// 	  }
// 	} while(len === limit);
// 	console.log('end')
//     // let n = await model.find().count();
//     // console.log(n);
// })

// const mongoose = require('mongoose');
// const db1 = mongoose.createConnection('mongodb://root:123456@localhost:27017/novel?authSource=admin=readPreference=primaryPreferred');
// console.log('start');
// const sourceTable = db1.model('resources', new mongoose.Schema({}, { strict: false }));
// (async () => {
//   let len = 0,
//     limit = 100,
//     offset = 0;
//   do {
//     const results = await sourceTable.find({source_type:'article'}).select({'-content':1, 'source_id': 1}).limit(limit).skip(offset).lean(true);
//     len = results.length;
//     offset += len;
//     const buff = [];
//     results.forEach(data => {
// 		buff.push({
// 		  updateOne: {
// 			filter: {source_type: 'article', source_id: data.source_id },
// 			update: { $set: {id: data.source_id} },
// 			upsert: false,
// 		  },
// 		});
//     })
//     if (buff.length) {
//       await sourceTable.bulkWrite(buff)
//     }
//   } while (len === limit);
//   console.log('同步完成')
// })()

// 修改group_id为id
const mongoose = require('mongoose');
const db1 = mongoose.createConnection('mongodb://root:123456@localhost:27017/novel?authSource=admin=readPreference=primaryPreferred');
console.log('start');
const sourceTable = db1.model('group', new mongoose.Schema({}, { strict: false }));
(async () => {
  let len = 0,
    limit = 100,
    offset = 0;
  do {
    const results = await sourceTable.find({}).limit(limit).skip(offset).lean(true);
    len = results.length;
    offset += len;
    const buff = [];
    results.forEach(data => {
		buff.push({
		  updateOne: {
			filter: {group_id: data.group_id },
			update: { $set: {id: data.group_id}, $unset: {group_id: 1} },
			upsert: false,
		  },
		});
    })
    if (buff.length) {
      await sourceTable.bulkWrite(buff)
    }
  } while (len === limit);
  console.log('同步完成')
})()