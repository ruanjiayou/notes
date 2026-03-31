# 学习新的日志采集系统


- bunjs 不支持 pino 的 pino-send-http 插件...
- 测试添加日志
```sh
curl --location 'http://localhost:8080' \
--header 'Content-Type: application/json' \
--data '{
    "app": "bot",
    "service": "http",
    "user_id": "2048",
    "level": "info",
    "message": "hello vector"
}'
```