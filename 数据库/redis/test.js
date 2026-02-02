const Redis = require('redis');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const txt = fs.readFileSync('/Users/jiayou/projects/notes/phoenix/cmpp相关/2023之前视频id备份.txt')
const ids = JSON.parse(txt);

const client = Redis.createClient({
  socket: {
    host: '10.0.15.240',
    port: 6379
  },
  // password: 'phoenixtv2017'
});

const logger = {
  error: (e) => {
    console.log(e);
  }
};

(async () => {
  await client.connect();
  // const t = await client.get('test');
  // console.log(t)


  // 开启事物
  // const t = await client
  //   .multi()
  //   .zAdd('zset', { value: '1', score: 1 })
  //   .zAdd('zset', { value: '2', score: 2 })
  //   .zAdd('zset', { value: '3', score: 3 })
  //   .zAdd('zset', { value: '4', score: 4 })
  //   .zAdd('zset', { value: '5', score: 5 })
  //   .hSet(`notify:counter:user:${'test'}:unread`, 'chats', 2)
  //   .hIncrBy(`chats:user:${'test'}:unread`, 'test', 1)
  //   .exec();
  // console.log(t);

  // 不支持的命令方法
  // const q = await client.sendCommand(['ZREVRANGE', 'zset', '0', '-1']);
  // console.log(q);
  // const arr = await client.zRange('zset', 0, -1);
  // console.log(arr);

  async function luaScan(key_all, key_sub, patterns, limit, cb) {
    if (!patterns.length) {
      return;
    }
    const script = `
    local key = KEYS[1]
    local cursor = ARGV[1]
    local count = tonumber(ARGV[2])
    local members = {}
    local scores = {}

    local scanResult = redis.call('ZSCAN', key, cursor, 'COUNT', count)
    local newCursor = scanResult[1]
    local items = scanResult[2]

    for i = 1, #items, 2 do
      if ${patterns.map(v => "string.find(items[i], '" + v + "')").join(' or ')} then
        table.insert(members, items[i])
        table.insert(scores, items[i+1])
      end
    end
    
    return { newCursor, members, scores}
  `;
    const sha = await client.scriptLoad(script);
    let cursor = '0', scanned = 0;
    const MAX_SCAN = 500, returned = false;
    const collected = [];
    const p = new RegExp(patterns.join('|'));

    const flag_key = 'flag:' + key_sub;
    const replies = await client.multi().setNX(flag_key, "2").expire(flag_key, 300).exec();
    // 防止高并发时的重复scan
    console.log(replies);
    if (!replies[0]) {
      const status = await client.get(flag_key);
      console.log(status)
      return cb && cb([]);
    }
    const total = await client.zCard(key_all);
    let count = 100;
    if (total > 1000000) {
      count = 2000;
    } else if (total > 100000) {
      count = 1000;
    } else if (total > 10000) {
      count = 500;
    } else if (total > 1000) {
      count = 200;
    }
    do {
      try {
        const result = await client.evalSha(sha, {
          keys: [key_all],
          arguments: [cursor, count.toString()]
        });
        cursor = result[0];
        if (_.isArray(result[1]) && result[1].length !== 0) {
          scanned += result[1].length;
          const pipeline = client.multi();
          result[1].forEach((id, idx) => {
            pipeline.zAdd(key_sub, { score: result[2][idx], value: patterns.length > 1 ? id.replace(p, '') : id });
          });
          await pipeline.exec();
          if (cb && !returned) {
            collected.push(result[1].map(v => v.split('_')));
          }
        }
        if (cb && !returned && (scanned > MAX_SCAN || collected > limit)) {
          // 提前返回数据
          returned = true
          cb && cb(collected)
        }
      } catch (e) {
        await client.del(flag_key);
        logger.error(e);
        break;
      }
    } while (cursor !== '0');
    // await client.del(flag_key);
  }
  await luaScan('subscription_test', 'subscription_temp', ['_article$', '_ticker$'], 50);
  console.log('end')
})();