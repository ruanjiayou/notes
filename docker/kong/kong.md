# kong

## 步骤
- `docker network create kong-net`
- 第一次运行kong(带有command)
- 第二次运行kong
- 第一次运行konga(带有command,NODE_ENV=development)
- 第二次运行konga(NODE_ENV=production)
- 访问`http://localhost:9001/`查看配置
- 访问`http://localhost:1337`进行第一次注册
- 设置kongAdminApi连接(konga容器内部可以访问的地址,`http://192.168.x.x:9001`的地址或`http://kong:8001`)

## konga
### plugin
- [jwt](https://blog.csdn.net/hhj724/article/details/103187166)
  - 在 route 里加是单个应用的,plugin 里加是全局的
  - 
- [proxy-cache]() 配置修改后重启(不然总是Bypass)
  - memory策略,name 要从 kong 的 pod 里的 /usr/local/kong/kong-nginx.conf 找.