import redis from 'redis'

// 创建 Redis 客户端
const client = redis.createClient({
  url: 'redis://10.0.15.240:6379'
  // 如果有密码：'redis://:password@localhost:6379'
});

client.on('error', (err) => console.error('Redis 连接错误:', err));
client.on('connect', () => console.log('✅ Redis 连接成功'));

async function unionSubscriptionDynamicKeys() {
  const startTime = Date.now();

  try {
    // 1. 获取所有匹配的 key
    const pattern = 'fs-mobile:api:v3:subscription_dynamic:*';
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      console.log('⚠️ 未找到匹配的 key');
      return null;
    }

    console.log(`🔑 找到 ${keys.length} 个 key:`, keys.slice(0, 5), keys.length > 5 ? '...' : '');

    // 2. 生成目标 key
    const timestamp = Date.now();
    const destinationKey = `fs-temp-union:${timestamp}`;

    const resultCount = await client.zUnionStore(
      destinationKey,  // 目标 key
      keys             // 源 keys 数组
      // 可选第三个参数：{ WEIGHTS: [1,1], AGGREGATE: 'SUM' }
    );

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✅ ZUNIONSTORE 执行完成`);
    console.log(`📊 结果集数量: ${resultCount}`);
    console.log(`⏱️ 执行时间: ${executionTime}ms`);
    console.log(`📁 目标 key: ${destinationKey}`);

    return {
      destinationKey,
      resultCount,
      executionTime,
      keysCount: keys.length
    };

  } catch (error) {
    console.error('❌ 执行失败:', error);
    throw error;
  }
}

// 执行
(async () => {
  await client.connect();
  await unionSubscriptionDynamicKeys();
  await client.quit();
})();