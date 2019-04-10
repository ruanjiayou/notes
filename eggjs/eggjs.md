# egg

https://www.yuque.com/jianxu/study/um4f6r

安装egg
```bash
$ npm i egg-init -g
$ egg-init egg-example --type=simple
$ cd egg-example
$ npm i

$ npm run dev
```

## 跨域cors与csrf
- npm i egg-cors --save
- 在plugin.js中设置开启cors 
  ```js
  exports.cors = {
    enable: true,
    package: 'egg-cors',
  };
  ```
- 在config.{env}.js中配置，注意配置覆盖的问题
  ```js
  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: true
    },
    domainWhiteList: ['*']
  };

  config.cors = {
    credentials: true,
    origin: ctx => ctx.get('origin'),
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  };
  ```

<details>
  <summary>mongoDB和mongoose在egg中的使用</summary>

  ```bash
  npm i egg-mongoose --save
  ```
  敲代码
  ```js
  // {APP_ROOT}/config/plugin.js 启用插件
  exports.mongoose = {
    enable: true,
    package: 'egg-mongoose'
  }

  // {APP_ROOT}/config/config.default.js 添加插件的配置 可以只用一个exports
  exports.mongoose = {
    clients: {
      dbN: {
        url: 'mongodb://127.0.0.1/example',
        options: {},
      },      
    }
  };

  // {APP_ROOT}/app/models/user.js 添加schema
  module.exports = app => {
    const mongooes = app.mongoose;
    const Schema = mongoose.Schema;
    const conn = app.mongooseDB.get('dbN');

    const UserSchema = new Schema({
      username: { type: String },
      password: { type: String },
    }, {
      collection: 'user'
    });
    return conn.model('User', UserSchema);
  }

  // controller中就可以操作数据库了
  // this.model.User.findOne();
  ...
  // 也可以把方法封装到services中
  // 
  ...
  ```
  csrf config.default.js
  ```js
  config.security = {
    csrf: {
      enable: false
    }
  }
  ```
</details>

## 封装
<details>
  <summary>egg二次设计(BaseController和BaseService)</summary>

```js
// app/utils/BaseController.js
'use strict';

class BaseController {
  /**
   * 构建查询对象
   * @param {function} cb 
   */
  query(cb) {
    const query = {
      page: parseInt(this.ctx.query.page) || 1,
      limit: Math.min(parseInt(this.ctx.query.limit) || 10, this.maxLimit())
    };
    if (cb) {
      cb(query, this.ctx.query);
    }
    return query;
  }
  /**
   * 限制
   */
  maxLimit() {
    return 20;
  }
  /**
   * 统一返回处理
   * TODO: group API 中只返回result,而不是设置到body
   * @param {object|array} data 数据
   * @param {object} opts 附加参数,如分页信息
   */
  return(data = null, opts) {
    const result = {
      rdata: data,
      ecode: 0,
      error: ''
    };
    Object.assign(result, opts);
    this.ctx.body = result;
  }
}

module.exports = BaseController;
```

```js
// app/utils/BaseService.js
'use strict';

const _ = require('lodash');
const Service = require('egg').Service;

class BaseService extends Service {

  constructor(ctx) {
    super(ctx);
    this.models = ctx.model;
    this.model = null;
  }

  _init(query) {
    // 允许多次调用_init()
    const opts = _.cloneDeep(query);
    // where sort limit 
    const opt = {
      where: {},
      page: 1,
      limit: 0,
      sort: {},
      lean: true,
      update: null
    }
    // 分页
    if (_.isInteger(opts.limit)) {
      opt.limit = opts.limit;
    }
    if (_.isInteger(opts.page)) {
      opt.offset = (opts.page - 1) * opt.limit;
    }
    // 事务

    // 关联查询

    // 过滤与排序

    return opt;
  }

  query(sql) {

  }

  getAll(query) {
    const opt = this._init(_.assign({}, query, { limit: 0 }));
    return this.model.find(opt.where).sort(opt.sort).limit(opt.limit).lean(opt.lean);
  }
  getList(query) {
    const opt = this._init(query);
    if (opt.limit = 0) {
      return this.model.find(opt.where);
    } else {
      return this.model.find(opt.where).limit(opt.limit).lean(opt.lean);
    }
  }
  getInfo(query) {
    const opt = this._init(query);
    return this.model.findOne(opt.where).sort(opt.sort).lean(opt.lean);
  }
  create(data) {
    return this.model.insert();
  }
  destroy(where) {
    return this.model.delete(where);
  }
  update(query) {
    const opt = this._init(query);
    return this.model.where(opt.where).update({ $set: opt.update });
  }
}

module.exports = BaseService;
```
</details>

## egg-static
- npm i egg-static -S
- config.default.js config.static = { prefix: '/static/', dir: appInfo.baseDir}+'/app/public'}
- plugin.js export.static = true;

## egg-redis
- npm i egg-redis --save
- config.default.js
  ```js
  config.redis = {
    clients: {
      ips: {
        host: '127.0.0.1',
        port: '6379',
        db: 0,
        password: ''
      }
    }
  }
  ```
- plugin.js
  ```js
  exports.redis = {
    enable: true,
    package: 'egg-redis',
  };
  ```

## egg-view
- npm i egg-view-nunjucks --save
- config.default.js
  ```js
  config.view = {
    mapping: {
      '.nj': 'nunjucks',
    },
    root: [
      path.join(appInfo.baseDir, 'app/view'),
      path.join(appInfo.baseDir, 'path/to/another'),
    ].join(',')
  };
  ```
- plugin.js
  ```js
  exports.nunjucks = {
    enable: true,
    package: 'egg-view-nunjucks',
  };
  ```
## 问题
- mac上心跳包 注释源码 cluster-client lib/leader.js#74