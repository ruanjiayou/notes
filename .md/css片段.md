# flex
容器属性
- justify-content 主轴上点对齐方式
- align-items 纵轴点对齐方式
- align-content 多主轴对齐方式
- flex-direction 排列方向
- flex-wrap 是否换行
- flex-flow 是flex-direction合flex-wrap点简写
项目属性
- order 项目排列顺序
- flex-grow 放大比例
- flex-shrink 缩小比例
- flex-basis 默认宽度
- align-self 单个项目对齐方式 覆盖继承自align-items的,默认auto
- flex = flex-grow flex-shrink flex-basis
## 两端分散对齐
```less
.cls {
  display: flex;
  justify-content: space-between;
}
```

## 水平垂直居中
```less
.clsV {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.clsH {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
```

## 高度占满
```less
.cls-box {
  display: flex;
  flex-direction: column;
}
.cls-full {
  flex: 1;// flex-grown flex-shink flex-basis
  overflow-y: auto;
}
```