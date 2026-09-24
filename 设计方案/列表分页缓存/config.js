'use strict';

/**
 * 模块级依赖单例 —— redis（缓存客户端）从外部导入，启动时注入一次：
 *
 *   const { setConfig } = require('./src');
 *   setConfig({ redis });
 *
 * 取用姿势：`config.redis.instance`（list-pagination.js 内部用 `config.get()` 拿到的就是这个对象）。
 * 对象本身恒定（只改字段、不换引用），所以可以安全地长期持有。
 * 源库 model 不走这里，它由 ListPagination 的构造参数传入。
 */
const config = {
  redis: { instance: null },
  setConfig: (next = {}) => {
    if (next.redis !== undefined) config.redis.instance = next.redis;
    return config;
  },
  get: () => config,
};

module.exports = config;
