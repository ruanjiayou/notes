# npm命令 

https://docs.npmjs.com/cli-documentation/cli
- npm init
- 搜索: npm search
- npm i / npm install [-g/-S/--save/-dev]
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

版本号
---
语义版本号分为X.Y.Z三位，分别代表主版本号、次版本号和补丁版本号。当代码变更时，版本号按以下原则更新。

如果只是修复bug，需要更新Z位。
如果是新增了功能，但是向下兼容，需要更新Y位。
如果有大变动，向下不兼容，需要更新X位。