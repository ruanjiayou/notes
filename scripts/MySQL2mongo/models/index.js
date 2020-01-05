const Sequelize = require('sequelize');
const mysqlCfg = require('../config');
const loader = require('../loader');

const models = {
  Op: null,
  sequelize: null
};

const DB = new Sequelize(
  mysqlCfg.database,
  mysqlCfg.username,
  mysqlCfg.password,
  {
    dialect: mysqlCfg.dialect,
    host: mysqlCfg.host,
    port: mysqlCfg.port,
    define: {
      // 默认驼峰命名 false 下划线蛇形 true
      underscored: false
    },
    // logging 为 false 则不显示
    //logging: logger,
    timezone: mysqlCfg.timezone,
    dialectOptions: {
      // 2018-8-18 19:05:06 这个配置开始弃除
      //requestTimeout: 15000
    }
  }
);

loader({
  dir: __dirname,
  recusive: false
}, (info) => {
  if (__filename !== info.fullpath) {
    let fn = require(info.fullpath);
    let model = fn(DB, Sequelize);
    model.getAttributes = function () {
      return Object.keys(this.attributes);
    }
    models[model.name] = model;
  }
});

// 添加约束
for (let k in models) {
  if (typeof models[k] === 'function') {
    models[k].associate(models);
  }
};

models.sequelize = DB;
models.Op = DB.Op;

module.exports = models;