const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer();

// 监听 proxyReq 事件
proxy.on('proxyReq', function (proxyReq, req, res, options) {
  // 在这里修改代理请求的路径
  if (proxyReq.host === 'localhost' && proxyReq.path.startsWith('/user')) {
    const newPath = proxyReq.path.replace(/^\/user/, '') || '/';
    console.log(`重写路径: ${proxyReq.path} -> ${newPath}`);
    proxyReq.path = newPath;
  }
});

const server = http.createServer((req, res) => {
  console.log('收到请求:', req.method, req.url);

  if (req.url.startsWith('/user')) {
    proxy.web(req, res, {
      // target: 'https://test-m-dev.fengshows.com',
      target: 'http://localhost:8990',
      changeOrigin: true
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(80, () => {
  console.log('代理服务器运行在 http://localhost:80');
});
