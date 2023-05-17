# registry
> in docker

## setup
- volume
  - /path/auth:/auth
  - /path/certs:/certs
  - /path/data:/var/lib/registry
  - /path/config.yml:/etc/docker/registry/config.yml
- environment
  - REGISTRY_AUTH=htpasswd
  - REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd
  - REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm
  - REGISTRY_HTTP_TLS_KEY=/certs/server.key
  - REGISTRY_HTTP_TLS_CERTIFICATE=/certs/server.crt

## docker插件使用
- window docker desktop 设置开放调试端口2375
- 

## push
- docker tag novel-api:v0.0.v15 192.168.0.0.124:5000/username/novel-api:v0.0.15
- docker login 192.168.0.0.124:5000
- docker push 192.168.0.0.124:5000/username/novel-api:v0.0.15
docker:tUwFyYppK4jJdO6jqR5yzVry5yNhDhpS4A2dHKGdjf8

## 问题
- registry不能pull镜像: server gave HTTP response to HTTPS client
  > 修改 /etc/docker/daemon.json 加入 {"insecure-registries":["ip:5000"]}
- registry的账号密码登录错误: status 400 bad request
  - apt update
  - apt install apache2-utils
  - htpasswd registry 123456 (以后不用再麻烦了,registry:$2y$05$dd3kjWhGbnUR2j975f5Am.mOCKiSptSrO01S4FOCXOHIc1yh2l9eW)