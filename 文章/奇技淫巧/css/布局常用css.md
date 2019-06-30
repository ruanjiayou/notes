# css

- 内部水平垂直居中
  ```css
  .center-xy {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    }
  ```
- 两端对齐
  ```css
  .align-side {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  ```
- 上下占满
  ```css
  .full-height {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  ```