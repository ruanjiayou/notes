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
  if (url1.pathname.startsWith('/api')) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write('{"state": "success", "code": 0, "message": "", "data": null}');
  } else {
    response.writeHead(400);
  }
  response.end('');
});

app.listen(process.env.PORT, function () {
  console.log(`服务器已启动,端口: ${process.env.PORT}`);
});