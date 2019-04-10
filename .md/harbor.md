企业级私人镜像仓库
https://www.ctolib.com/topics-130484.html
https://juejin.im/post/5b933f4df265da0a9e52edd5

## 要求: 
- 硬件
  - cpu >= 2核
  - 内存 >= 4G 
  - 磁盘 >= 40G
- 软件
  - python >= 2.7
  - docker engine >= 1.10
  - docker-compose >= 1.6.0
  - openssl 最新版
- 网络
  - 443: https请求
  - 4443: 链接docker信任服务
  - 80: http请求

## 步骤
- `wget https://github.com/vmware/harbor/releases/download/v1.2.0/harbor-online-installer-v1.2.0.tgz`
- `tar zxvf harbor-online-installer-v1.2.0.tgz && cd harbor`
- `vim harbor.cfg`
  > hostname => ip (禁止127.0.0.1)
- ./install.sh
- > 安装成功: ✔ ----Harbor has been installed and started successfully
- 修改docker client
  > vim /etc/default/docker DOCKER_OPTS="--insecure-registry=10.10.37.18 --iptables=false --bridge=br0 --ip-masq=false"

本地
- 申请账号
- docker login
- `vim Dockerfile`
  > FROM centos:centos7.5 \
  > ENV TZ "Asia/Shanghai"
- docker build -t ip/library/centos7.5:0.1
- docker pull ip/library/centos7.5:0.1