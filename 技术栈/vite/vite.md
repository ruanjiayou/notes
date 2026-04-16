# vite

## react-app-rewired迁移
- index.html放根目录
- import { ReactFragment as svg} from "svg" 改为 import svg from "svg"
- 全局变量定义
  ```
  define: {
    APP: JSON.stringify("app"),
    'process.env': {

    },
  },
  ```