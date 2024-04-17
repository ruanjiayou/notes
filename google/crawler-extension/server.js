const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('404 Not Found');
    }

    let contentType = 'text/html';
    if (filePath.endsWith('.css')) {
      contentType = 'text/css';
    } else if (filePath.endsWith('.js')) {
      contentType = 'text/javascript';
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// 创建一个 WebSocket 服务器，侦听 HTTP 服务器
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  ws.on('message', function incoming(message) {
    console.log('Received: %s', message);
    // 在这里处理接收到的消息
    // 也可以将消息广播给所有连接的客户端
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // setInterval(() => {
  //   ws.send(JSON.stringify({ 'a': 'b', 'type': 'resource_change', status: 'SYNCING' }))
  // }, 1000)

  ws.on('close', function close() {
    console.log('Client disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});