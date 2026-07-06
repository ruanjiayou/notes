# minio

- key优化(取前两位 0a 和 8e): /images/poster/0a/8e/0a8efaa0d55cefbf2feaa3c61429b612_ce0ebbba77a380caf9d38aef802364b3.jpg
- 下载到MinIO
  ```js
  import * as Minio from 'minio';
  import axios from 'axios';
  import * as crypto from 'crypto';

  // 1. 初始化 MinIO 客户端（图片实例：端口 9000）
  const minioClient = new Minio.Client({
      endPoint: '你的NAS_IP',
      port: 9000,
      useSSL: false,
      accessKey: '你的AccessKey',
      secretKey: '你的SecretKey'
  });

  async function uploadWebImageToMinIO(imageUrl: string) {
      try {
          // 2. 使用 axios 获取网络图片的二进制流（stream）
          const response = await axios({
              method: 'GET',
              url: imageUrl,
              responseType: 'stream'
          });

          // 3. 根据图片 URL 生成 MD5，用来做打散的路径和文件名
          const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
          const dirPrefix = hash.substring(0, 2); // 提取前两位，如 "0a"
          
          // 拼接成完美的 SSD 友好路径
          const objectName = `poster/${dirPrefix}/${hash}.jpg`; 
          const bucketName = 'images';

          // 4. 直接将流式数据推送到 MinIO，无须本地暂存
          // 注意：流式上传通常需要指定文件大小，或者使用 MinIO SDK 的 putObject 自动处理分片
          await minioClient.putObject(bucketName, objectName, response.data);

          console.log('上传成功！外链地址为:');
          console.log(`http://你的NAS_IP:9000/${bucketName}/${objectName}`);
          
      } catch (error) {
          console.error('上传失败:', error);
      }
  }

  // 测试调用
  uploadWebImageToMinIO('https://example.com/some-online-poster.jpg');
  ```