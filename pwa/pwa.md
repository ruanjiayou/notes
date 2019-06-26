# PWA 渐进式Web应用

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