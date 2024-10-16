# Verdaccio

## docker部署
- port 4873
- volume
  - npmjs/conf:/verdaccio/conf (使用淘宝镜像源不用http_proxy)
  - npmjs/storage:/verdaccio/storage
  - npmjs/plugins:/verdaccio/plugins

## 注意事项
- npmjs: https://registry.npmmirror.com/
- storage 直接挂载被转 link 到其他地方了
- 缓存问题: bun 要删除 bun.lockb, npm 要 `npm cache clean --force`