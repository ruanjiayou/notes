# 笔记

## 概念
- 坐标系: Y 轴向上,X 轴向右,Z 轴向外

## 基础对象

### ArcRotateCamera
- 创建 
  ```js
  new ArcRotateCamera(
    name: string,
    alpha: number,
    beta: number,
    radius: number,
    target: Vector3,
    scene?: Scene,
    setActiveOnSceneIfNoneActive?: boolean,
  )
  ```
  - name: 相机名称
  - alpha: 旋转经度
  - beta: 旋转维度
  - radius: 与目标点的距离
  - target: 目标点坐标
  - scene?: 所属场景