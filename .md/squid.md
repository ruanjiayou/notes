## squid
- yum install -y squid
- vim /etc/squid/squid.conf
- # 允许所有ip: 0.0.0.0/0.0.0.0 允许局域网ip: 192.168.0.1/24
- acl client src ip
- http_access allow client
- systemctl start squid.service 
- systemctl enable squid.service
- firewall-cmd --zone=public --add-port=3128/tcp --permanent
- firewall-cmd --reload

## squid代理服务器
```yml
Squid:
  image: sameersbn/squid:3.5.27-1
  ports:
    - "3128:3128"
  volumes:
    - /srv/docker/squid/cache:/var/spool/squid
  restart: always
```

## 添加帐号
- yum install httpd-tools -y
- mkdir /etc/squid3/
- htpasswd -cd /etc/squid3/passwords [account]
- # 输入密码(最长8位)
- 测试帐号比如 admin 12345678
- /usr/lib64/squid/basic_ncsa_auth /etc/squid3/passwords
- 修改squid配置文件
  `auth_param basic program /usr/lib64/squid/basic_ncsa_auth /etc/squid3/passwords `
  `http_access allow authenticated`
  `http_port 0.0.0.0:3128`
- 初始化服务并重新启动
  ```
  squid -z
  systemctl restart squid.service
  ```
## nginx
```conf
# HTTP 1.1 support
proxy_http_version 1.1;
proxy_buffering off;
proxy_set_header Host $http_host;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $proxy_connection;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $proxy_x_forwarded_proto;
proxy_set_header X-Forwarded-Ssl $proxy_x_forwarded_ssl;
proxy_set_header X-Forwarded-Port $proxy_x_forwarded_port;

# Mitigate httpoxy attack (see README for details)
proxy_set_header Proxy "";
```