## googleapis 默认使用示例
- 创建project和API密匙 
- 启用Google+ API和youtube Data API V3服务
- 创建OAuth2.0客户端ID
- 下载OAuth的json
- 准备oauth信息
```js
const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
// 第一次生成验证url获取code.如果有redirectUrl可以在回调接口里获取
// const authUrl = oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   scope: SCOPES
// });
// // 保存token
// const token = await oauth2Client.getToken(code);
// 之后
oauth2Client.credentials = token;
```
- 上传视频
```js
const { google } = require('googleapis');
const service = google.youtube('v3');
service.videos.insert({
  auth: oauth2Client,
      part: 'snippet,contentDetails,status',
      resource: {
        snippet: {
          title: 'option.title',
          description: 'option.desc',
        },
        status: {
          privacyStatus: 'private' // pubic 或 private
        }
      },
      media: {
        body: fs.createReadStream(filepath) // Change here to your real video
      }
});
```

## service账号上传
- 