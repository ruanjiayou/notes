
## monsoose
- 官网API文档: https://mongoosejs.com/docs/api.html#Aggregate
https://docs.mongodb.com/manual/reference/operator/aggregation/sum/
- it笔录: https://itbilu.com/nodejs/npm/B1FfBss6X.html#model_Model.findOneAndUpdate

## option参数
- 对find有效: sort,limit,skip
- 对update,updateOne,updateMany,replaceOne,findOneAndUpdate,findByIdAndUpdate有效: upsert
- 对find,findOne,findById,findOneAndUpdate,findByIdAndUpdate有效: lean

## 增加
- 一般通过update(),option upsert=true实现

## 删除
- remove() 没啥用?
- 删除多个: deleteMany(condition) single=false
- 删除一个: deleteOne(condition)  single=true
- findOneAndDelete()
- findOneAndRemove()
- findByIdAndRemove()

## 查询
- 模糊查询,正则: {title: {$regex: new RegExp(""或者/1$/)}}
- 范围: $gt,$lt,$gte,$lte,$in,$nin,$ne
- and,or,nor
  - or查询: `{$or: [{a:1,b:1}]}`
  - 两个or查询: `{$and: [{$or: [{a:1,b:1}]},{$or:{c:1,b:1}}]}`

## 修改数据
> 参数: upsert,multi,setDefaultOnInsert(upsert=true),strict=false,overwrite=false/
> 原子类型: $set,$unset,$setOnInsert
- update(condition,data,option) 包含updateOne和replaceOne
- updateOne(condition,{$xxx:data},option) 修改一条数据data必须是原子操作$,所以multi和overwrite参数无效
- replaceOne(condition,data,option) 覆盖一条数据
- updateMany 相当update中multi为true,也必须是原子操作$


## 创建索引
```js
db.getCollection('point_info').createIndexes([
  { 
    "subscription._id ": 1,
    "created_time ": 1,
    "type": 1
  }
], {background:true, name: "subscriptionId_createTime_type"})
```
## 批量修改
- bulkWrite中修改: updateOne{ {filter}, {$set: data}, {option}}
- skip比cursor方便.
```js
  const mongoose = require('mongoose');
  mongoose.connect('mongodb://user:pass@ip:port/db');
  const schema = new mongoose.Schema({}, {strict: false});
  const M = mongoose.model('test', schema);
  // skip
  let len = 0, limit = 100, offset = 0;
  do {
    let movies = await M.find({}).limit(limit).skip(offset).lean(true);
    await M.bulkWrite(movies.map(movie => {
      return {
        updateOne: {
          filter: { id: movie.id },
          update: { $set: { id: newId, code: movie.id }, $unset: { key: '' } }
        }
      }
    }));
    len = movies.length;
    offset += limit;
    console.log('完成了: ' + offset);
  } while (len >= limit);
  console.log('id=>code 完成!');
  process.exit();
```
```js
  // next
  const cursor = M.find({}).cursor();
  let doc, data = [], i = 0;
  do {
    doc = await cursor.next();
    if (doc) {
      doc = doc.toObject();
      data.push({
        updateOne: {
          filter: { id: doc.id },
          update: { $set: { id: newId, code: doc.id } }
        }
      });
      if (data.length >= 100) {
        await M.bulkWrite(data.splice(0, 100));
        i += 100;
        console.log(`已处理:${i}`);
      }
    } else if (data.length != 0) {
      await M.bulkWrite(data);
    }
    //console.log(doc); process.exit();
  } while (doc != null);
  console.log('处理完成!');
```

## 分组 (参考)[https://blog.csdn.net/leshami/article/details/55192965]
> $match: 过滤条件 \
  > $group: 按照给定表达式组合结果 \
  ```
  统计: count: { $sum: 1 }
  求和: count: { $sum: '$price' }
  引用字段: { _id: "$title" }
  求平均数: count: { $avg: "$price" }
  取分组中某字段最大值: count: { $max: "$price" }
  $min 取最小的
  $first 取第一个
  $last 取最后一个
  $push 重复的不会合并
  $addToSet 重复的会合并
  拆分为多条: $unwind
  $pull
  $pullAll
  $pop

  ```
  > $project：包含、排除、重命名和显示字段 \
  ```js
  db.getCollection('resources').aggregate([  
    { $match: { group: { $gt: '2018-04-21', $lt: '2018-05-21'}} },  
    { $group: { _id: '$movie_id', count: { $sum: 1 } } },  
    { $sort: { count: -1 } },
    { $limit: 100 }
  ])
  ```

## schema 定义model
```js
const Schema = require('mongoose').Schema;
const blogSchema = new Schema({
  title: String
}, {collection: 'blog'});
const Blog = mongoose.model('Blog', blogSchema);
```

### 刷号封号的主要代码
```js
var opts = [];
db.share_relations.aggregate([
  // 根据code和ip分组
  { $group: { "_id": { user_code: "$share_user_code", ip: "$ip" }, count: { $sum: 1 } } },
  // 重复3次的 为可疑 账号
  { $match: { count: { $gte: 3 }, '_id.ip': { $ne: null } } },
  { $group: { _id: "$_id.user_code" , total: { $sum: 1 } } } , 
  // 在3个不同地方刷的 认定为刷号               
  { $match: { total: { $gte: 3 } } },
  { $skip: 150 }
]).forEach(function(item){
    opts.push({
      updateOne: {
        filter: {
          code: item._id
        },
        update: {
          $set: {
            ban: true
          }
        },
        upsert: true
      }
    });
    if(opts.length>400) {
      db.user_infos.bulkWrite(opts);
      opts = []
    }
});
```

## 问题
- MongoError: no primary found in replicaset or invalid replica set name 连不上数据库集群 ===> 停电挂了...
- db.getCollection('crawler_url').updateMany({finished:true},{$set:{finished:false}})
- bulkWrite() 写不进去 filter/update/upsert都放updateOne里
- Schema不传collection自动加s
- 默认50%做缓存,64G的机器就是32...
- 连接失败: mongoUrl+?authSource=admin
- 查询数组: { id: { $in: arr }}
- 查询结果是个特殊对象.直接修改不起作用: 调用.toJSON(),再修改.