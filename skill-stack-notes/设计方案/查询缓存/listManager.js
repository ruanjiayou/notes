const _ = require('lodash');
const { Op } = require('sequelize')
const logger = require('./log.js')('list_manager');
const config = require('../config.js').get();

const redis = config.redis.instance;

/**
 * 资源项
 * @typedef {['video' | 'article' | 'ticker' | 'awhile' | 'live' | 'dynamic' | 'user' | 'subscription' | 'program', string, string][]} ResourceItem
 */
class ListManager {
  /**
   * @param {ReturnType<import('redis').createClient>} client 
   */
  constructor(client) {
    this.client = client;
    this.scripts = {};
  }
  /**
   * 子组合类型计算key(从小到大连接)
   * @param {string[]} types 类型数组
   * @returns 
   */
  getCombineName(types) {
    return types.map(v => v.toString()).sort((a, b) => a.localeCompare(b)).join('_');
  }

  /**
   * 获取缓存列表标识的key名
   * @param {'sync'|'empty'|'idx'} prefix 前缀类型
   * @param {string} key 缓存列表key名
   * @returns 
   */
  getFlagByName(prefix, key) {
    return `${config.redis.keyV5}:${prefix}${key.replace(config.redis.keyV5, '')}`
  }
  /**
   * 构建lua脚本
   * @param {string[]} patterns 
   * @returns 
   */
  getScript(patterns) {
    logger.debug('根据目标和规则生成lua脚本')
    return `
        local key = KEYS[1]
        local cursor = ARGV[1]
        local count = tonumber(ARGV[2])
        local patterns = {${patterns.map(p => `"${p}"`).join(', ')}}

      
        local scanResult = redis.call('ZSCAN', key, cursor, 'COUNT', count)
        local items = scanResult[2]

        local newCursor = scanResult[1]
        local scanned = #items / 2
        local members = {}
        local scores = {}
      
        for i = 1, #items, 2 do
          for _, prefix in ipairs(patterns) do
            if string.sub(items[i], 1, #prefix) == prefix then
              table.insert(members, items[i])
              table.insert(scores, items[i+1])
            end
          end
        end
 
        return { newCursor, scanned, members, scores}
      `;
  }

  /**
   * 扫描全量zset重建子zset
   * @param {string} key 缓存列表主体名
   * @param {string} types 组合类型名称
   * @param {number} limit 分页数量
   * @returns string[]
   */
  async scanRedis(key, types, limit) {
    // 这里的types不会是all，否则直接查全量列表了
    if (!types) {
      return;
    }
    const hash = types.toString()
    const patterns = types.map(type => `${type}_`);
    const rgp = new RegExp(patterns.join('|'));
    const sha = this.scripts[hash] || await this.client.scriptLoad(this.getScript(patterns));
    if (!this.scripts[hash]) {
      logger.debug('缓存编译脚本')
      this.scripts[hash] = sha;
    }
    logger.debug('扫描位置游标，扫描数，有效数，是否提前返回')
    let cursor = '0', scanned = 0, valided = 0;

    // 全量列表key，同步标识key，空标识key
    const key_all = `${key}:all`
    const key_sub = `${key}:${this.getCombineName(types)}`
    const sync_key = this.getFlagByName('sync', key_sub);
    const empty_key = this.getFlagByName('empty', key_sub);
    const idx_key = this.getFlagByName('idx', key);
    const replies = await this.client.multi().setNX(sync_key, '1').expire(sync_key, 600).del(empty_key).sAdd(idx_key, this.getCombineName(types)).exec();
    if (!replies[0]) {
      logger.debug('防止高并发时的重复scan')
      return;
    }
    const [total, ttl] = await this.client.multi().zCard(key_all).ttl(key_all).exec();
    logger.debug('按规模扫描')
    const count = total > 1000000 ? 2000 : total > 100000 ? 1000 : total > 10000 ? 500 : 200;
    // 全量列表重置过期时间
    if (ttl < config.redis.expires * 24 * 2) {
      await this.client.expire(key_all, config.redis.expires * 24 * 14);
    }
    do {
      let result = [];
      try {
        result = await this.client.evalSha(sha, {
          keys: [key_all],
          arguments: [cursor, count.toString()]
        });
      } catch (e) {
        // lua缓存失效重新加载
        if (e.message.includes('NOSCRIPT')) {
          logger.info('lua script expired', patterns)
          this.scripts[hash] = await this.client.scriptLoad(this.getScript(patterns));
          result = await this.client.evalSha(sha, {
            keys: [key_all],
            arguments: [cursor, count.toString()]
          });
        } else {
          logger.error('excute script error', e.message);
          break;
        }
      }
      try {
        const [, , members, scores] = result;
        cursor = result[0];
        scanned += result[1];
        if (members.length !== 0) {
          valided += members.length;
          const pipeline = this.client.multi();
          members.forEach((id, idx) => {
            pipeline.zAdd(key_sub, { score: scores[idx], value: types.length === 1 ? id.replace(rgp, '') : id });
          });
          await pipeline.exec();
        }
      } catch (e) {
        logger.error(e);
        break;
      }
    } while (cursor !== '0');
    await this.client.del(sync_key);
    if (valided === 0) {
      logger.debug('空数据删除反向索引并设置空标识')
      await this.client.multi().sRem(idx_key, types).set(empty_key, 1).expire(empty_key, config.redis.expires).exec();
    } else {
      await this.client.expire(key_sub, config.redis.expires * 24 * 15);
    }
  }

  /**
   * 构建全量zset
   * @param {import('sequelize').ModelStatic<import('sequelize').Model>} model 表
   * @param {string} key 主体名 
   * @param {object} where 查询条件
   * @param {string[]} fields 分数字段
   */
  async buildAllMysql(model, key, where, fields) {
    const [field_score = 'modified_time', field_type = 'res_type', field_id = 'res_id'] = fields;
    const key_all = `${key}:all`
    const empty_key = this.getFlagByName('empty', key_all)
    const sync_key = this.getFlagByName('sync', key_all)
    const total = await model.count({ where });
    logger.info(`构建全量zset: ${key_all}`, JSON.stringify(where), fields)
    if (total === 0) {
      logger.debug('没数据设置空标识然后返回')
      await this.client.multi().set(empty_key, 1).expire(empty_key, config.redis.expires).exec();
      return;
    }
    logger.debug('设置开始同步标识')
    await this.client.multi().set(sync_key, 1).expire(sync_key, 600).exec();

    let cursor = null, lastId = null, times = 0;
    let batch = [], limit = 200, all = 0;
    do {
      if (cursor) {
        where[Op.or] = [
          { [field_score]: { [Op.lt]: cursor } },
        ];
      }
      if (lastId) {
        if (!where[Op.or]) {
          where[Op.or] = [];
        }
        where[Op.or].push({ [field_score]: cursor, id: { [Op.lt]: lastId } })
      }
      const results = await model.findAll({
        where,
        limit,
        raw: true,
        order: [[field_score, 'DESC'], ['id', 'DESC']],
        attributes: fields.filter(f => !f.startsWith('#')),
      });
      all += results.length;
      times++;
      logger.info(key_all, all);
      results.forEach(v => {
        batch.push({ score: new Date(v[field_score]).getTime(), value: `${field_type.startsWith('#') ? field_type.substring(1) : v[field_type]}_${v[field_id]}` });
      })
      if (batch.length) {
        const pipeline = this.client.multi()
        batch.forEach(member => {
          pipeline.zAdd(key_all, member);
        })
        await pipeline.exec();
        batch = [];
      }
      cursor = results.length ? results[results.length - 1][field_score] : null; // 获取下一页的游标
      lastId = results.length ? results[results.length - 1].id : null;
      if (results.length < limit) {
        break;
      }
    } while (cursor && lastId !== null && times < 100)
    if (times >= 100) {
      logger.info(`异常数据: ${key_all}`)
    }
    await this.client.multi().del(sync_key).expire(key_all, config.redis.expires * 24 * 15).exec();
  }
  /**
   * 增量数据缓存处理
   * @param {string} key 
   * @param {string} value type_id
   * @param {number} score 时间戳
   * @param {number} action 发布动作.大于0上线,小于等于0下线
   */
  async publish(key, value, score, action) {
    const [type, id] = value.split('_');
    const key_all = `${key}:all`;
    const idx_key = this.getFlagByName('idx', key);
    const exists = await this.client.exists(key_all)
    if (exists) {
      action > 0 ? await this.client.zAdd(key_all, { score, value }) : await this.client.zRem(key_all, value)
    } else if (action > 0) {
      await this.client.del(this.getFlagByName('empty', key_all))
    }
    const types = await this.client.sMembers(idx_key)
    logger.debug('维护子类型列表', types)
    for (let i = 0; i < types.length; i++) {
      const child_types = types[i].split('_');
      // 发布的资源属于子列表才处理
      if (child_types.includes(type)) {
        const key_sub = `${key}:${types[i]}`;
        const value_sub = child_types.length > 1 ? value : id;
        const found = await this.client.exists(key_sub);
        if (found) {
          logger.debug('子类型列表未过期则发布')
          action > 0 ? await this.client.zAdd(key_sub, { score, value: value_sub }) : await this.client.zRem(key_sub, value_sub)
        } else {
          logger.debug('子类型列表过期则删除反向索引')
          await this.client.sRem(idx_key, types[i])
        }
      }
    }
  }

  /**
   * 获取缓存列表分页数据
   * @param {string} key 主键名
   * @param {'all' | string[]} types 组合类型
   * @param {{cursor:string;page:number;limit:number}} pagination 分页信息
   * @returns {Promise<ResourceItem[]>} [type,id,score]数组
   */
  async paginate(key, types, pagination) {
    const { cursor, page, limit } = pagination;
    const sub = types === 'all' ? 'all' : types.map(v => v.toString()).sort((a, b) => a.localeCompare(b)).join('_')
    const key_all = `${key}:all`
    const key_sub = `${key}:${sub}`
    const ttl = await this.client.ttl(key_sub);
    // 要取的zset列表是否存在.
    if (ttl > -2) {
      logger.debug('存在则直接查找')
      // 自动续长过期时间
      if (ttl < config.redis.expires * 24 * 2) {
        await this.client.expire(key_sub, config.redis.expires * 24 * 14);
      }
    } else if (
      (sub !== 'all' && await this.client.exists(this.getFlagByName('empty', key_sub)))
      || await this.client.exists(this.getFlagByName('empty', key_all))
      || await this.client.exists(this.getFlagByName('sync', key_sub))) {
      logger.debug('不存在zset,且标记为空或在同步中,直接返回')
      return []
    } else if (sub === 'all' || !await this.client.exists(key_all)) {
      logger.debug('需要同步数据库记录创建全量列表')
      return null;
    } else {
      logger.debug('扫描重建子类型列表')
      await this.scanRedis(key, types, limit);
    }
    const pairs = cursor
      ? await this.client.zRangeByScore(key_sub, cursor, '+inf', limit > 0 ? { WITHSCORES: true, LIMIT: { offset: 0, count: limit } } : { WITHSCORES: true })
      : await this.client.sendCommand(['ZREVRANGE', key_sub, ((page - 1) * limit).toString(), (page * limit - 1).toString(), 'WITHSCORES']);
    const arr = _.chunk(pairs, 2)
    if (types.length === 1) {
      return arr.map(([member, score]) => [types[0], member, score])
    } else {
      return arr.map(([type_id, score]) => [...type_id.split('_'), score]);
    }
  }
}

module.exports = new ListManager(redis);