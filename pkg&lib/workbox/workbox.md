# workbox
> 2022-03-28 16:54:35

## 非framework usage
- 安装全局命令行: `npm install workbox-cli --global`
- 自动指导生成参数: `workbox wizard --injectManifest`
- `workbox injectManifest workbox-config.js`
  ```js
  module.exports = {
    globDirectory: 'public/',
    globPatterns: [
      '**/*.{html,ico,png,jpg,json,css,js}'
    ],
    swDest: 'public/sw.js',
    swSrc: 'sw.js'
  };
  ```
- 将CDN的文件拷贝到本地: `npx workbox copyLibraries public/workbox`
- 修改sw.js
  - precacheAndRoute 预缓存
  - registerRoute 动态缓存
- build reactjs后注入service-worker`PUBLIC_URL=/novel/ react-app-rewired build && workbox injectManifest ./workbox-config.js`

## CRA 使用
- 使用react-rewired,workbox-webpack-plugin将sw-template生成为sw.js
- service-worker管理中注册workbox生成的sw.js(自动生成的service-worker.js不使用忽略之)


## 参考
- [Build A PWA With Webpack And Workbox](https://www.smashingmagazine.com/2019/06/pwa-webpack-workbox/)
- [百度PWA文档](https://lavas-project.github.io/pwa-book/chapter01.html)