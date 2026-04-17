import Redis from 'redis'
import mongoose from 'mongoose';
import FilterListCache from './filter-list-cache.js'
import sequelize, { Sequelize } from 'sequelize';

/**
 * 第一次执行，查询数据库直接返回并异步建立全量列表
 * 第二次执行，异步扫描全量列表从前N条找到符合的limit数据提前返回
 * 第三次执行，查询zset列表返回
 */
(async () => {
  const client = Redis.createClient({
    socket: {
      host: '10.0.15.240',
      port: 6379
    },
  });
  await client.connect();
  const db = mongoose.createConnection('mongodb://root:123456@10.0.15.240:27017/db?authSource=admin=readPreference=primaryPreferred');
  const MResource = db.model('video_info', new mongoose.Schema({ _id: String }, { collection: 'video_info', strict: false }));

  /**
   * 批量获取详情
   * @param {[type:string,_id:string][]} members 键值对数组
   * @returns 
   */
  async function batch(members, defaultType) {
    const results = await Promise.allSettled(members.map(v => {
      const _id = v[0];
      const type = defaultType ? defaultType : v[1];
      return MResource.findOne({ _id }, { title: 1 }).lean(true)
    }))
    return results.filter(v => v.status === 'fulfilled').map(v => v.value);
  }

  async function testBuildMongo() {
    const total = await MResource.countDocuments();
    console.log(total)
    console.time('request')
    const CacheManager = new FilterListCache(client);
    let ids = await CacheManager.paginate('user:v5:user:admin:history', ['video'], { page: 1, limit: 20 });
    if (ids === null) {
      // 冷启动 page=1
      ids = (await MResource.find({}).sort({ modified_time: -1 }).limit(20).lean(true)).map(v => v._id);
      CacheManager
        .buildAllMongo(MResource, 'user:v5:user:admin:history', {}, ['modified_time', 'resource_type', '_id'])
        .then(() => {
          console.log('finished')
        })
        .catch(e => {
          console.log(e)
        });
    }
    console.log(ids)
    const results = await batch(ids.map(v => v.split('_').reverse()), 'video')
    console.log(results)
    console.timeEnd('request')

  }
  // 测试 冷启动全量缓存并提前返回 --> 重建子zset并提前返回 -> 直接zset分页
  // testBuildMongo();

  // 测试发布
  async function testPublish(action) {
    const CacheManager = new FilterListCache(client);
    await CacheManager.publish('user:v5:user:admin:history', 'video_test', Date.now(), action)
  }
  await testPublish(0); await testBuildMongo();
  // process.exit(0);
  
})();

// 本地测试
// 异步扫描构建全量列表. 10w 数据, 15m33s 太慢了  ---加索引,批量zAdd---> 29s
// 异步扫描构建组合列表. 10w 数据, 11s           ---> 1.2s 提前返回,17s 完成扫描 ---sub匹配---> 10s
// zset 分页,10w 数据. 552ms  ---> 229ms
// 线上 redis看不了时间 get synctoes:resource:awhile 也是 800ms,监控显示平均 10us