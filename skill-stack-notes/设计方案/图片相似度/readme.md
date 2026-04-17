# 图片相似度

## image-hash

> 生成图像的感知哈希值

```js
const promisify = require('util').promisify;
const { imageHash } = require('image-hash');

const hash = await promisify(imageHash)('./image.jpg', 16, true);
```

## sharp

> 图片处理库，支持缩放、裁剪、对比

```js

```
