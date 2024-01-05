const Redis = require('redis');

const client = Redis.createClient({
  socket: {
    host: '10.0.15.240',
    port: 6379
  },
  // password: 'phoenixtv2017'
});

(async () => {
  await client.connect();
  // const t = await client.get('test');
  // console.log(t)

  await client.del('zset');
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
  const t = await client
    .multi()
    .zAdd('chat:test:sixin', [{ value: 'test', score: 2 }])
    .expire('chat:test:sixin', 100)
    .exec();
  console.log(t);
  // 不支持的命令方法
  // const q = await client.sendCommand(['ZREVRANGE', 'zset', '0', '-1']);
  // console.log(q);
  // const arr = await client.zRange('zset', 0, -1);
  // console.log(arr);
})();