import _ from 'lodash'
import sequelize, { Sequelize } from 'sequelize';

const logger = {
  info() {
    console.log(Array.from(arguments))
  },
  error() {
    console.log(Array.from(arguments));
  },
  debug() {
    console.debug(Array.from(arguments))
  }
};

class FilterListCache {
  /**
   * @type {ReturnType<import('redis').createClient>}
   */
  #client = {}
  #scripts = {}
  constructor(client) {
    this.#client = client;
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
   * @param {'syncing'|'empty'|'map'} prefix 前缀类型
   * @param {string} key 缓存列表key名
   * @returns 
   */
  getFlagByName(prefix, key) {
    return `${prefix}:${key}`
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

        -- for i = 1, #items, 2 do
        --   if ${patterns.map(v => "string.find(items[i], '" + v + "')").join(' or ')} then
        --     table.insert(members, items[i])
        --     table.insert(scores, items[i+1])
        --   end
        -- end
        
        return { newCursor, scanned, members, scores}
      `;
  }

  /**
   * 扫描全量zset重建子zset
   * @param {string} key 缓存列表主体名
   * @param {string} types 组合类型名称
   * @param {number} limit 分页数量
   * @param {Function} cb 提前返回函数
   * @returns string[]
   */
  async scanRedis(key, types, limit, cb) {
    // types不能是[all]，否则直接查全量列表了
    if (!types) {
      return;
    }
    console.time('scan redis')
    const hash = types.toString()
    const patterns = types.map(type => `${type}_`);
    const rgp = new RegExp(patterns.join('|'));
    console.log(this.getScript(patterns))
    const sha = this.#scripts[hash] || await this.#client.scriptLoad(this.getScript(patterns));
    if (!this.#scripts[hash]) {
      logger.debug('缓存编译脚本')
      this.#scripts[hash] = sha;
    }
    logger.debug('扫描位置游标，扫描数，有效数，是否提前返回')
    let cursor = '0', scanned = 0, valided = 0, returned = false;
    const MAX_SCAN = 500;
    const collects = [];

    // 全量列表key，同步标识key，空标识key
    const key_all = `${key}:all`
    const key_sub = `${key}:${this.getCombineName(types)}`
    const flag_key = this.getFlagByName('syncing', key_sub);
    const empty_key = this.getFlagByName('empty', key_sub);
    const map_key = this.getFlagByName('map', key);
    const replies = await this.#client.multi().setNX(flag_key, '1').expire(flag_key, 60).del(empty_key).sAdd(map_key, this.getCombineName(types)).exec();
    if (!replies[0]) {
      logger.debug('防止高并发时的重复scan')
      return cb([]);
    }
    const total = await this.#client.zCard(key_all);
    logger.debug('按规模扫描')
    const count = total > 1000000 ? 2000 : total > 100000 ? 1000 : total > 10000 ? 500 : total > 1000 ? 200 : 100;
    do {
      try {
        const result = await this.#client.evalSha(sha, {
          keys: [key_all],
          arguments: [cursor, count.toString()]
        });
        cursor = result[0];
        scanned += result[1];
        if (_.isArray(result[2]) && result[2].length !== 0) {
          valided += result[2].length;
          const pipeline = this.#client.multi();
          result[2].forEach((id, idx) => {
            pipeline.zAdd(key_sub, { score: result[3][idx], value: types.length === 1 ? id.replace(rgp, '') : id });
          });
          await pipeline.exec();
          if (!returned && collects.length < limit) {
            collects.push(...result[2]);
          }
        }
        if (!returned && (scanned >= MAX_SCAN || collects >= limit)) {
          logger.debug('提前返回数据', scanned, limit)
          returned = true
          cb(collects)
        }
      } catch (e) {
        logger.error(e);
        break;
      }
    } while (cursor !== '0');
    await this.#client.del(flag_key);
    if (valided === 0) {
      logger.debug('空数据删除反向索引并设置空标识')
      await this.#client.multi().sRem(map_key, types).set(empty_key, 1).expire(empty_key, 600).exec();
    } else {
      await this.#client.expire(key_sub, 60 * 60 * 30);
    }
    if (!returned) {
      cb(collects)
    }
    console.timeEnd('scan redis')
  }

  /**
   * 扫描全量zset重建子zset
   */
  async buildTypes(key, types, limit) {
    return new Promise((resolve, reject) => {
      this
        .scanRedis(key, types, limit, (ids) => {
          resolve(ids);
        })
        .then(() => {
          logger.info(key, types, 'finished')
        })
        .catch(e => {
          console.log(e)
          logger.error(key, types, 'error')
        })
    })
  }
  /**
   * 构建全量zset
   * @param {import('mongoose').Model} model 表
   * @param {string} key 主体名 
   * @param {object} where 查询条件
   * @param {string[]} fields 分数字段
   */
  async buildAllMongo(model, key, where, fields) {
    const [field_score = 'modified_time', field_type = 'res_type', field_id = '_id'] = fields;
    const key_all = `${key}:all`
    const empty_key = this.getFlagByName('empty', key_all)
    const syncing_key = this.getFlagByName('syncing', key_all)
    const total = await model.countDocuments(where);
    if (total === 0) {
      logger.debug('没数据设置空标识然后返回')
      await this.#client.multi().set(empty_key, 1).expire(empty_key, 600).exec();
      return;
    }
    logger.debug('设置开始同步标识')
    await this.#client.multi().set(syncing_key, 1).expire(syncing_key, 60).exec();
    /**
     * @type {import('mongoose').QueryCursor}
     */
    let cursor = model.find(where, { [field_score]: 1, [field_score]: 1, [field_type]: 1 }).cursor();
    let doc = null;
    console.time('mongo cursor scan');
    let batch = [], size = 400;
    do {
      doc = await cursor.next()
      if (doc) {
        try {
          doc = doc.toObject();
          // console.log(doc._id)
          batch.push({ score: new Date(doc[field_score]).getTime(), value: `${doc[field_type]}_${doc[field_id]}` });
          if (batch.length >= size) {
            const pipeline = this.#client.multi()
            batch.forEach(member => {
              pipeline.zAdd(key_all, member);
            })
            await pipeline.exec();
            batch = [];
          }

        } catch (e) {

        }
      } else {
        break;
      }
    } while (doc);
    if (batch.length) {
      const pipeline = this.#client.multi()
      batch.forEach(member => {
        pipeline.zAdd(key_all, member);
      })
      await pipeline.exec();
      batch = [];
    }
    console.timeEnd('mongo cursor scan');
    await this.#client.del(syncing_key)
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
    const syncing_key = this.getFlagByName('syncing', key_all)
    const total = await model.count({ where });
    if (total === 0) {
      logger.debug('没数据设置空标识然后返回')
      await this.#client.multi().set(empty_key, 1).expire(empty_key, 600).exec();
      return;
    }
    logger.debug('设置开始同步标识')
    await this.#client.multi().set(syncing_key, 1).expire(syncing_key, 60).exec();

    let cursor = null;
    console.time('mysql cursor scan');
    let batch = [], limit = 200;
    do {
      if (cursor) {
        where[field_score] = { [sequelize.Op.lt]: cursor };
      }
      const results = await model.findAll({
        where,
        limit,
        raw: true,
        order: [[field_score, 'DESC']],
        attributes: [field_score, field_type, field_id],
      });
      results.forEach(v => {
        batch.push({ score: new Date(v[field_score]).getTime(), value: `${v.res_type}_${v.res_id}` });
      })
      if (batch.length) {
        const pipeline = this.#client.multi()
        batch.forEach(member => {
          pipeline.zAdd(key_all, member);
        })
        await pipeline.exec();
        batch = [];
      }
      cursor = results.length ? results[results.length - 1][field_score] : null; // 获取下一页的游标
    } while (cursor)

    console.timeEnd('mysql cursor scan');
    await this.#client.del(syncing_key)
  }
  /**
   * 增量数据缓存处理
   * @param {string} key 
   * @param {string} value type_id
   * @param {number} score 时间戳
   * @param {number} action 发布动作.大于0上线,小于等于0下线
   */
  async publish(key, value, score, action) {
    const id = value.split('_')[1];
    const exists = await this.#client.exists(`${key}:all`)
    if (exists) {
      action > 0 ? await this.#client.zAdd(`${key}:all`, { score, value }) : await this.#client.zRem(`${key}:all`, value)
      const types = await this.#client.sMembers(`map:${key}`)
      logger.debug('维护子类型列表', types)
      for (let i = 0; i < types.length; i++) {
        const key_sub = `${key}:${types[i]}`;
        const value_sub = types[i].includes('_') ? value : id;
        const found = await this.#client.exists(key_sub);
        if (found) {
          logger.debug('子类型列表未过期则发布')
          action > 0 ? await this.#client.zAdd(key_sub, { score, value: value_sub }) : await this.#client.zRem(key_sub, value_sub)
        } else {
          logger.debug('子类型列表过期则删除反向索引')
          await this.#client.sRem(`map:${key}`, types[i])
        }
      }
    }
  }

  /**
   * 获取缓存列表分页数据
   * @param {string} key 主键名
   * @param {string[]} types 组合类型
   * @param {{cursor:string;page:number;limit:number}} pagination 分页信息
   * @returns 
   */
  async paginate(key, types, pagination) {
    const { cursor, page, limit } = pagination;
    const list_name = types.map(v => v.toString()).sort((a, b) => a.localeCompare(b)).join('_')
    const key_all = `${key}:all`
    const key_sub = `${key}:${list_name}`
    // 要取的zset列表是否存在.
    if (await this.#client.exists(key_sub)) {
      logger.debug('存在则直接查找')
      const ids = cursor
        ? await this.#client.zRangeByScore(key_sub, cursor, '+inf', { LIMIT: { offset: 0, count: limit } })
        : await this.#client.zRange(key_sub, (page - 1) * limit, page * limit - 1, { REV: true });
      return ids;
    }
    if (await this.#client.exists(`empty:${key_sub}`) || await this.#client.exists(`syncing:${key_sub}`)) {
      logger.debug('不存在zset,且标记为空或在同步中,直接返回')
      return []
    }
    if (list_name === 'all' || !await this.#client.exists(key_all)) {
      logger.debug('需要同步数据库记录创建全量列表')
      return null;
    } else {
      logger.debug('扫描重建子类型列表')

      const results = await this.buildTypes(key, types, limit);
      return page * limit > results.length ? results.splice(0 - limit) : results.splice((page - 1) * limit, limit)
    }
  }
}

export default FilterListCache;