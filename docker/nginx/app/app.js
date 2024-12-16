const http = require('http');
const url = require('url');
const querystring = require('querystring');

const app = http.createServer(function (request, response) {
  request
  /**
   * request
   *   .url
   *   .method
   *   .headers
   */
  const url1 = url.parse(request.url);
  console.log(url1)
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.write('{"state": "success", "code": 0, "message": "", "data": "'+url1.pathname+'"}');
  response.end()
});

app.listen(process.env.PORT, function () {
  console.log(`服务器已启动,端口: ${process.env.PORT}`);
});