# valtio+lianria

## svg导入
- tsconfig的types添加"vite-plugin-svgr/client"

## 引入外部的相同项目
- `bun add @babel/preset-react @babel/preset-typescript @linaria/babel-preset`
- wyw插件修改: 
  ```js
  wyw({
    preserveCssPaths: true,
    transformLibraries: true,
    include: [/node_modules\/user-info/, './src/**/*.{ts,tsx}'],
    babelOptions: {
      presets: [
        '@babel/preset-typescript',
        '@babel/preset-react',
        '@linaria/babel-preset',
      ],
    },
  }),
  ```
- 其他配置:
  ```js
  {
    optimizeDeps: {
      include: [
        'react',
        'react-dom'
      ],
      // 关键：让 Vite 扫描项目目录外的源码文件，自动发现它们依赖的库
      entries: [
        './index.html',
        './src/**/*.{ts,tsx}',
      ],
    },
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    build: {
      outDir: 'plan',
    },
  }
  ```