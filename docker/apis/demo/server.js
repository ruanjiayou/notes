// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': headers['Content-Type'] || 'text/plain; charset=utf-8',
    ...headers,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // 只支持 GET / HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed');
  }

  // 防止 ../ 穿越
  const decoded = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, decoded);

  if (!filePath.startsWith(ROOT)) {
    // return send(res, 403, 'Forbidden');
    filePath = path.join(ROOT, 'index.html');
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      return send(res, 404, 'Not Found');
    }

    let target = filePath;

    // 目录 → index.html
    if (stat.isDirectory()) {
      target = path.join(filePath, 'index.html');
    }

    fs.readFile(target, (err, data) => {
      if (err) {
        return send(res, 404, 'Not Found');
      }

      const ext = path.extname(target).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';

      send(res, 200, data, {
        'Content-Type': type,
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});

// 👇 关键：暴露 close，方便测试 teardown
module.exports = {
  server,
  close() {
    return new Promise(resolve => server.close(resolve));
  },
};
