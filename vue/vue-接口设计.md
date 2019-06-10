# api

## 设计思路

- 按模块分文件 xxx.js 与 view文件夹一一对应
- 每个函数即接口:

  ```js
  import shttp from '@utils/shttp'
  export function xxx(params) {
      return shttp();
  }
  ```