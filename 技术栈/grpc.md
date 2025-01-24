# grpc

> 使用HTTP/2(rpc 可以使用 tcp)作为传输协议,默认基于protocol buffers 协议的

(HTTP+RESTful 也语言平台无关)

- gRPC 帮我们解决了 RPC 中的服务调用、数据传输以及消息编解码，我们剩下的工作就是要编写业务逻辑代码。

## 比较
- 最主要的是 rpc 的数据压缩提高效率,rest 的 http请求更通用