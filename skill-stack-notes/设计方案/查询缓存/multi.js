/**
 * Node.js 实现：Redis热缓存 + Elasticsearch 混合方案
 * 缓存key
 * 缓存前 10 页;超过走 es
 * 游标分页不缓存,cursor = base64(last_score + last_id)
 */

const redis = require('redis');
const { Client } = require('@elastic/elasticsearch');
const stringify = require('safe-stable-stringify');
const crypto = require('crypto');

class HybridVideoCache {
  constructor() {
    this.redisClient = redis.createClient();
    this.esClient = new Client({ node: 'http://localhost:9200' });
    this.queryStats = new Map(); // 统计查询频率
    this.hotQueryThreshold = 5; // 查询5次以上视为热查询
  }

  /**
   * 查询视频列表
   * TODO: keys 改为反向索引集合,查询列表设置过期时间24小时,小于1小时则刷新时间;上下架更新列表,如果列表过期删除集合的索引
   */
  async query(filters, options = {}) {
    const cacheKey = 'query:videos:' + crypto.createHash('md5').update(stringify(filters)).digest('hex')
    console.log(`\n查询: ${cacheKey} `);

    // 步骤1：查Redis缓存（快速路径）
    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        console.log('✓ Redis缓存命中');
        this._updateQueryStats(cacheKey, 'hit');
        return JSON.parse(cached);
      }
    } catch (err) {
      console.log('⚠ Redis查询失败，继续ES查询');
    }

    // 步骤2：ES查询（完整查询）
    console.log('→ Elasticsearch查询');
    const results = await this._esQuery(filters, options);

    // 步骤3：判断是否缓存
    this._updateQueryStats(cacheKey, 'miss');
    const stats = this.queryStats.get(cacheKey) || { hits: 0, misses: 0 };

    // 当查询频率高时，缓存到Redis
    if (stats.hits + stats.misses >= this.hotQueryThreshold) {
      console.log('🔥 热查询！缓存到Redis');
      await this._cacheToRedis(cacheKey, results);
    }

    return results;
  }

  /**
   * ES查询实现
   */
  async _esQuery(filters, options) {
    const must = [];
    const should = [];

    // 构建AND条件
    if (filters.region) {
      must.push({ term: { region: filters.region } });
    }
    if (filters.language) {
      must.push({ term: { language: filters.language } });
    }
    if (filters.yearFrom && filters.yearTo) {
      must.push({
        range: { year: { gte: filters.yearFrom, lte: filters.yearTo } }
      });
    }

    // 构建OR条件
    if (filters.styles && filters.styles.length > 0) {
      filters.styles.forEach(style => {
        should.push({ term: { style } });
      });
    }

    const query = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          should,
          minimum_should_match: should.length > 0 ? 1 : 0
        }
      },
      sort: options.sortBy ? [{ [options.sortBy]: 'desc' }] : [],
      from: options.offset || 0,
      size: options.limit || 20,
      // 聚合示例
      aggs: {
        by_region: { terms: { field: 'region', size: 100 } },
        by_style: { terms: { field: 'style', size: 100 } },
        year_range: {
          range: {
            field: 'year',
            ranges: [
              { to: 2010 },
              { from: 2010, to: 2020 },
              { from: 2020 }
            ]
          }
        }
      }
    };

    const start = Date.now();
    const response = await this.esClient.search({
      index: 'videos',
      body: query
    });
    const elapsed = Date.now() - start;

    console.log(`  查询耗时: ${elapsed} ms`);
    console.log(`  返回结果: ${response.hits.hits.length} 条`);
    console.log(`  聚合数据: `, response.aggregations);

    return {
      data: response.hits.hits.map(h => h._source),
      aggregations: response.aggregations,
      total: response.hits.total.value
    };
  }

  /**
   * 缓存到Redis
   */
  async _cacheToRedis(cacheKey, results) {
    const ttl = 1800; // 30分钟
    try {
      await this.redisClient.setex(
        cacheKey,
        ttl,
        JSON.stringify(results)
      );
    } catch (err) {
      console.error('缓存失败:', err);
    }
  }

  /**
   * 更新查询统计
   */
  _updateQueryStats(cacheKey, type) {
    let stats = this.queryStats.get(cacheKey) || { hits: 0, misses: 0 };
    if (type === 'hit') {
      stats.hits++;
    } else {
      stats.misses++;
    }
    this.queryStats.set(cacheKey, stats);

    const totalQueries = stats.hits + stats.misses;
    const hitRate = (stats.hits / totalQueries * 100).toFixed(2);
    console.log(`  统计: ${totalQueries} 次查询, 命中率${hitRate}% `);
  }

  /**
   * 数据上架/下架时清理缓存
   */
  async invalidateCache(filters, mode = 'partial') {
    const pattern = this._generatePattern(filters, mode);

    // 删除Redis中匹配的所有key
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      console.log(`清理了 ${keys.length} 个缓存`);
    }
  }

  _generatePattern(filters, mode) {
    if (mode === 'exact') {
      const hash = crypto.createHash('md5').update(stringify(filters)).digest('hex');
      return `query: videos:${hash} `;
    }
    // partial: 删除所有包含这些维度的查询
    return 'query:videos:*';
  }
}

// 使用示例
async function demo() {
  const cache = new HybridVideoCache();

  // 场景1：第一次查询（ES）
  console.log('【第1次查询】');
  const result1 = await cache.query({
    region: 'US',
    language: 'en',
    style: 'action'
  });

  // 场景2：相同查询（命中率上升）
  for (let i = 0; i < 5; i++) {
    console.log(`\n【第${i + 2} 次查询】`);
    await cache.query({
      region: 'US',
      language: 'en',
      style: 'action'
    });
  }

  // 场景3：复杂查询（ES发挥优势）
  console.log('\n【复杂查询：范围+OR逻辑】');
  const result2 = await cache.query({
    region: 'US',
    yearFrom: 2020,
    yearTo: 2023,
    styles: ['action', 'anime'] // OR逻辑
  }, {
    sortBy: 'hotness',
    offset: 0,
    limit: 20
  });
}

module.exports = HybridVideoCache;