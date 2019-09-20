# PWA 渐进式Web应用
service-work才是PWA的精髓

## manifest 应用清单

## react-router-dom
- Switch: 返回第一个匹配成功的Route, 只渲染第一个与当前地址匹配的<Route>或<Redirect>

## @csstools/normalize.css
> fuck.react-scripts不支持less.自己fork.哼!

## 技术选型要点
- react function代替class
- react context上下文
- mobx-state-tree定义数据model
- mobx-state-lite相当于setState.监控model的变化并使在页面生效
- ant-mobile
- axios+mockjs
- react-scripts.自动webpack配置.不支持less要自己fork.

## workbox(react-app-rewired+react-app-rerire-workbox)
> 参考文章: https://medium.com/la-creativer%C3%ADa/using-workbox-with-create-react-app-without-ejecting-b02b804854b
- 安装(npm也可以)
  ```bash
  yarn add workbox-webpack-plugin 
  yarn add react-app-rewire-workbox 
  yarn add react-app-rewired
  ```
- package.json里的react-scripts 都换成 react-app-rewired
- 项目根目录添加config-overrides.js
  ```js
  const {rewireWorkboxInject, defaultInjectConfig} = require('react-app-rewire-workbox');
  const path = require('path');

  module.exports = function override(config, env) {
    if (env === "production") {
      console.log("Production build - Adding Workbox for PWAs");
      // Extend the default injection config with required swSrc
      const workboxConfig = {
        ...defaultInjectConfig,
        swSrc: path.join(__dirname, 'src', 'custom-sw.js'),
        // 下面两行: 不加就有坑
        swDest: 'service-worker.js',
        importWorkboxFrom: 'local'
      };
      config = rewireWorkboxInject(workboxConfig)(config, env);
    }

    return config;
  };
  ```
- 写自己的service-worker.js(src/custom-sw.js,原来的service-worker.js里将).workbox4.3的写法变了.原来是3.4版本的
  > react-app的index.js入口 import * as serviceWorker from './service-work'; serviceWorker.register(); 注册服务的
  ```js
  // See https://developers.google.com/web/tools/workbox/guides/configure-workbox
  workbox.core.setLogLevel(workbox.core.LOG_LEVELS.debug);

  // 默认的
  // self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
  // self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

  // We need this in Webpack plugin (refer to swSrc option): https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin#full_injectmanifest_config
  workbox.precaching.precacheAndRoute(self.__precacheManifest);

  // app-shell
  workbox.routing.registerRoute("/root", new workbox.strategies.NetworkFirst({
    networkTimeoutSeconds: 10,
    ignoreSearch: {
      ignoreSearch: true
    }
  }));
  // webapp补充缓存规则.注意服务器添加支持.CDN也要注意 
  workbox.routing.registerRoute(/\.(?:png|svg|jpg|gif)(?:\?.*?)?$/, new workbox.strategies.CacheFirst({
    cacheName: 'images',
    fetchOptions: {mode:'no-cors'}
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200]
      }),
      new workbox.expiration.Plugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 *60,
        purgeOnQuotaError: false,
      })
    ],
  }));
  ```

## 捕获错误
- app类适用: react16 hooks.解决js报错问题
  ```js
  import React from 'react';
  import ReactDOM from 'react-dom';
  import App from './App';
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    componentDidCatch(error, info) {
      this.setState({ hasError: true });
      // todo something
    }
    reload(){
      this.setState({ hasError: false }, ()=>{
        window.location.reload();
      });
    }
    render(){
      if(this.state.hasError) {
        return <h1 onClick={this.reload}>something went wrong</h1>;
      } else {
        return this.props.children;
      }
    }
  }
  ReactDOM.render(<ErrorBoundary><App/></ErrorBoundary>, document.getElementById('root'))
  ```

## 域名防封
> 首页域名组, 接口域名组.解决刷新出现Safari不能连接到服务器.
- window.navigator.onLine
- isOnline = try { Promise.resolve(fetch('https://www.baidu.com',{mode:'no-cors'})).timeout(5000) }
- canRefresh = checkHost('/')
- getHosts()
- return { status, host }

## 离开超时自动刷新
- document.addEventListener('visibilitychange')

## 与主进程的通信
- 特殊的postMessage

## 模式判断
- iosPWA: window.navigator.stanalone
- chromePWA: window.matchMedia('display-mode: standalone').matches
## TODO:
- base-loader.js 缺少remove()方法 filter隐藏

## 问题
- 第三方输入法卡死
- 进入先进about: blank,再进pwa白屏
- ios版本.支持11.3,但会自动刷新.12.0不会