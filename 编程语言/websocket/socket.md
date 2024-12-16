# 聊天系统

## socket.io

## socket | admin UI
- 必须放根目录? https://github.com/socketio/socket.io-admin-ui/tree/main/ui/dist
- 连接参数, url为http://localhost:3322/admin,path不用填

## socket.io | client
- 第一个参数: "ws://example.com/my-namespace"
  - 简短模式(option只有auth参数有效): "/my-namespace"
- connect_error  server error at Socket.onPacket
  > 版本不一致
## socket.io | server
- .to(room).emit(),对room里的其他用户发消息,不包括自己
  - 因为.to(socket.id)不起作用,用socket.emit代替
- disconnect会自动离开room
- .except.emit(),不会发送给room里的人,包括自己
- socket.broadcast.emit(),发送给所有socket,除了自己
- io.engine.clientsCount: 当前连接的客户端数量
- 

## 聊天室
### 功能
- 未登录只能看,登录后可以发消息
- 消息类型: 文本,表情,图片
- 用户类型: 管理员,房管,普通用户
- 