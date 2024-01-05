# uws

## nodejs示例
```js
const { App } = require("uWebSockets.js");
const { Server } = require("socket.io");

const app = new App();
const io = new Server({
  cors: {
    origin: "http://localhost:7003",
    credentials: true
  }
});

io.attachApp(app);

io.on("connection", (socket) => {
  console.log("initial transport", socket.conn.transport.name); // prints "polling"

  socket.onAny((event, ...args) => {
    console.log(`got ${event}`, args);
  });

});

app.get('/cmd', (res, req) => {
  res.writeStatus('200 OK').writeHeader('X-Signature', 'Yes').end('Hello');
})

app.listen(3000, (token) => {
  console.log('3000')
  if (!token) {
    console.warn("port already in use");
  }
});
```
## uws文档
### req
- forEach(cb: ((key: string, value: string) => void)): void: 遍历所有header字段
- getCaseSensitiveMethod: deprecated
- getHeader: 返回key(小写)的值或空字符串
- getQuery: 返回原生querystring(?后)的字符串
- getMethod: http方法(小写)
- getParameter: 
- getUrl
- setYield

### res
- close
- cork
- end
- getProxiedRemoteAddress
- getProxiedRemoteAddressAsText
- getRemoteAddress
- getRemoteAddressAsText
- getWriteOffset
- onAborted
- onData
- onWritable
- pause
- resume
- tryEnd
- upgrade
- write
- writeHeader
- writeStatus