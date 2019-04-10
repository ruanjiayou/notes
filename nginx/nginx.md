# nginx
## 参考文章
> https://www.cnblogs.com/wang-yc/p/8118347.html \
> https://juejin.im/post/5bff57246fb9a049be5d3297

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

## 重启失败
- 先检查拼写...
- bind() to 0.0.0.0:2017 failed (13: Permission denied)
  > selinux开启了造成的...
- window中不能挂载文件?
- nginx默认错误日志在/var/log/nginx