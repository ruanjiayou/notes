# typescript
> 不应该将 TSC 作为编译项目的工具，应该将 TSC 作为类型检查工具，代码编译的工作尽量交给 Rollup、Webpack 或 Babel 等打包工具!

## 提示 console 不存在
> tsconfig.json lib 数组添加 "DOM"

## 编译后 ESM 项目中提示需要后缀名
> ts 文件中引用添加.js后缀,编译后的 js 文件就会带上.js 后缀
## 编译后自定义路径(路径别名)没有改为相对路径
1. typescript-transform-paths插件