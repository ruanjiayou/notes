# npm命令 

https://docs.npmjs.com/cli-documentation/cli
- npm init
- 搜索: npm search
- npm i / npm install [-g/-S/--save/-dev]
- npm i package --force 更新包版本
- npm uninstall 
- 链接本地文件夹为包(适合测试开发包): npm link
- npm list [-g]
- npm ls
- npm adduser
- 发布: npm publish .
- npm -v
- npm help
- 查看信息: npm view [moduleName]
- npm config
 - npm get key
 - npm set key value [-g|--global]
 - npm set proxy http://192.168.0.1:8888
- 设置安装包时不自动添加前缀^或~: `npm config set save-exact true`
- 默认使用前缀~：npm config set save-prefix '~'

版本号
https://blog.xcatliu.com/2015/04/14/semantic_versioning_and_npm/
---
语义版本号分为X.Y.Z三位，分别代表主版本号、次版本号和补丁版本号。当代码变更时，版本号按以下原则更新。

如果只是修复bug，需要更新Z位。
如果是新增了功能，但是向下兼容，需要更新Y位。
如果有大变动，向下不兼容，需要更新X位。

## bug
- window中发布失败: operation not permitted.(主要是nodejs安装在了C盘)
> 删除 ~/.npmrc或npm cache clean --force
- npm登录失败: 使用了淘宝源...
  ```
  npm install -g nrm 
  nrm use taobao
  nrm use npm
  ```
- ENOSPC: System limit for number of file watchers reached
  > deepin上: 其实是在/etc/sysctl.d/99-sysctl.conf里加了
  ```bash
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
  sudo sysctl --system
  ```