# nginx
## 参考文章
> https://www.cnblogs.com/wang-yc/p/8118347.html \
> https://juejin.im/post/5bff57246fb9a049be5d3297 \
> https://mp.weixin.qq.com/s/LmtHTOVOvdcnMBuxv7a9_A

## centos 安装
- yum install -y nginx
- 启动服务: systemctl start nginx.service
- 开机启动: systemctl enable nginx.service

## 完整的docker方案
> 一步启动
- `sh ./start.sh`
- `docker-compose up -d nginx`
- `docker-compose up -d --name nginx`

## nginx-docker详细步骤(最终版本在nginx文件夹中)
1.  安装好docker环境
2.  运行nginx镜像(访问127.0.0.1:8080看是否是Hello World)
    ```bash
    $ mkdir html
    $ vim html/index.html < <h1>Hello World</h1>
    $ docker container run \
      -d \
      -p 127.0.0.1:8080:80 \
      --rm \
      --name nginx-demo \
      --volume "$PWD":/usr/share/nginx/html/static \
      nginx:alpine
    ```
3.  复制进行中的配置
    ```bash
    $ docker container cp nginx-demo:/etc/nginx/ ./conf
    ```
4.  停止镜像重新启动
    ```bash
    $ docker container rum \
      --rm \
      --name nginx-demo \
      --volume "$PWD/html":/usr/share/nginx/html \
      --volume "$PWD/conf":/etc/nginx \
      -p 127.0.0.1:8080:80
      -d \
      nginx:alpine
    ```
5.  自签名证书(机器要安装了OpenSSL)
    ```bash
    sudo openssl req \
      -x509 \
      -nodes \
      -days 36500 \
      -newkey rsa:2048 \
      -keyout example.key \
      -out example.crt
    ```
    最重要的CommonName填域名或127.0.0.1
    将生成的文件放到 conf/certs中
    ```
    openssl req -x509 -out registry.crt -keyout registry.key \
    -newkey rsa:2048 -nodes -sha256 \
    -subj '/CN=192.168.0.124' -extensions EXT -config <( \
    printf "[dn]\nCN=192.168.0.124\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:192.168.0.124\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
    ```
6.  配置HTTPS
    ```
    server {
        listen 443 ssl http2;
        server_name  localhost;
 
        ssl                      on;
        ssl_certificate          /etc/nginx/certs/example.crt;
        ssl_certificate_key      /etc/nginx/certs/example.key;
 
        ssl_session_timeout  5m;
 
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers   on;
 
        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }
    }
    ```
    重新启动:
    ```bash
    $ docker container run \
      --rm \
      --name mynginx \
      --volume "$PWD/html":/usr/share/nginx/html \
      --volume "$PWD/conf":/etc/nginx \
      -p 127.0.0.1:8080:80 \
      -p 127.0.0.1:8443:443 \
      -d \
      nginx:alpine
    ```
    访问: https://127.0.0.1:8443和http://127.0.0.1:8080
7.  写docker-compose.yml 
    > 一行命令启动: `docker-compose up -d --name nginx-demo` 
    ```bash
    version: "3"
    services:
      nginx:
        image: nginx:alpine
        ports:
          - 8080:80
          - 8443:443
        volumes:
          - ./html:/usr/share/nginx/html
          - ./conf:/etc/nginx
    ```
## 语法
- 直接返回json:
  ```
  ## antd-pro
  location /api/auth_routes {
    default_type application/json;
    return 200 '{"/form/advanced-form":{"authority":["admin","user"]}}';
  }
  ```
- 正则匹配: ~ ^
- 前缀匹配: ^~ 不支持正则表达式,优先级高, `^~/gw/(manger/demo)/`这种是不支持的
## window上
- win10-64位 下载 1.17.0
- http://nginx.org/en/download.html
- 解压到项目那个盘(跨盘有问题)
- 启动: start nginx.ext
- 查看端口: netstat -aon | findstr :80
- 退出: nginx.exe -s quit
- 重新加载nginx.exe -s reload
- 停止: nginx.exe -s stop
## 本地同步配置到服务器并重启
- 进入cmd目录
- 执行: `sh ./sync_servers.sh`
- proxy中使用变量造成： *1 no resolver defined to resolve localhost
  ```
  nginx.conf中http里添加
  resolver 127.0.0.1 [::1]:5353;
  resolver_timeout 5s;
  ```

## https
```
#比较两个hash是否相同(.crt/.cer)
openssl x509 -noout -modulus -in test.crt | openssl md5
openssl rsa -noout -modulus -in test.key | openssl md5
```

## freessl
- 下载keymanage软件
- 先生成测试证书
- 输入域名和邮箱
- 选择文件验证
- 上传到服务器验证路径
- 检测文件是否可以访问
- 下载证书
- 导入解压后的文件
- 重新部署
- myssl查看结果

## 查看日志
- service nginx status

## 重启失败
- 先检查拼写...
- bind() to 0.0.0.0:2017 failed (13: Permission denied)
  > selinux开启了造成的...
- 13: Permission denied: semanage port -l | grep http_port_t, semanage port -a -t http_port_t  -p tcp 809
- window中不能挂载文件?
- nginx默认错误日志在/var/log/nginx
- mac上安装: brew install nginx. 启动要: sudo nginx. brew services nginx start localhost会拒绝连接
  ```
  /usr/local/var/www
  /usr/local/etc/nginx/nginx.conf
  ```
  > 重启: nginx -s reload
- 转发出现502,  Permission denied while connecting to upstream
  > selinux开了造成的,关掉, setenforce 0
- 访问不了 看是不是端口没打开或防火墙屏蔽了...fuck
- cors options和后续的请求header里要保持一致 比如 access-control-allow-origin,不然corb
- 405 method not allowed?fuck
- chrome自签名不能识别(必须重新-install并生成证书) [参考](https://blog.csdn.net/qq_45392321/article/details/119676301) 开始还是显示不安全，过几天发现好了...
  - `mkcert --install`(在客户端安装mkcert的根证书，服务端的证书就会被信任)
  - `mkcert -cert-file ./server.crt -key-file ./server.key 192.168.0.124 192.168.100.19 localhost 127.0.0.1 ::1`