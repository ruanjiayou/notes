# docker
常用命令
- 
- 
[docker 命令大全](http://www.runoob.com/docker/docker-command-manual.html)

```bash
// 查看版本
docker --version
// 登陆
docker login
// 上传前给j镜像打tag
docker tag project:0.1 username/project:0.1 && docker push username/project:.01
// 将镜像保存为文件
docker save username/project:0.1 > project.tar
// 从文件中加载镜像
docker load path/to/file
// 列出进程(容器)
docker ps
// 列出本地主机上的镜像 --filter -f -q --format 
docker images/docker image ls/docker image ls ubuntu
// 获取镜像,如: docker pull ubuntu:16.04
docker pull [选项] [Docker Registry 地址[:端口号]/]仓库名[:标签]
// 查找镜像
docker search httpd
// 删除镜像
docker image rm [选项] <镜像1> [<镜像2> ...] 

// 运行镜像(-i 交互 -t 终端 -d 守护进程的方式 -e 环境遍历 -p 80:80 映射端口本机80端口访问docker中的80端口 --name webserver 命名 --rm 退出后删除容器 --link 连接(多个)容器 -f ? --tail ? --scale web=3 -v volume名称)
docker run -d -p 80:80 --name webserver nginx
// 停止容器进程
docker stop webserver
// 删除容器
docker rm webserver
// 理解镜像构成,不建议用这个命令
docker commit 
//
docker ps -a
// 
docker restarting name
// 调试
docker exec -it [container_id] bash
```
## dockerfile
- FROM 指定基础镜像, scratch代表不以任何镜像为基础
- RUN 执行命令并创建新的Image Layer
- COPY 复制文件 COPY [--chown=<user>:<group>] <源路径>... <目标路径>
- ADD 自动下载解压
- CMD 设置容器启动后默认执行的命令和参数，如果docker run指定了其他命令，CMD命令被忽略，如果定义了多个CMD，只有最后一个会执行。
- ENTRYPOINT 设置容器启动时运行的命令，让容器以应用程序或服务的形式运行，如果定义了多个ENTRYPOINT，不会被忽略，都会执行
- ENV 设置环境变量(当变量用,方便修改)
- ARG 构建参数
- VOLUME 定义匿名
- EXPOSE 声明端口(暴露容器端口给link到当前容器的容器而不会暴露给主机, 负载均衡时直接指定ports会有重复绑定的问题)
- WORKDIR 指定工作目录
- USER 指定当前用户 USER <用户名>[:<用户组>]
- HEALTHCHECK 健康检查
- ONBUILD 是一个特殊的指令，它后面跟的是其它指令，比如 RUN, COPY 等，而这些指令，在当前镜像构建时并不会被执行。只有当以当前镜像为基础镜像，去构建下一级镜像的时候才会被执行。
- 


## docker-compose 编排容器,方便起 
https://blog.csdn.net/skh2015java/article/details/80410306
https://www.jianshu.com/p/2217cfed29d7
- 使用: `docker-compose [-f=<arg>...] [options] [COMMAND] [ARGS...]`
- commands
  - build
  - config
  - create
  - down
  - events
  - help
  - kill
  - logs
  - pause
  - port
  - ps
  - pull
  - restart
  - rm 
  - run 
  - scale
  - start
  - stop
  - unpause
  - up
  - version
- options
  - -f, --file FILE
  - -p, --project-name NAME
  - --verbose
  - -v, --version
  - -H, --host HOST
  - --tls
  - --tlscacert CA_PATH
  - --tlscert CLIENT_CERT_PATH
  - --tlskey TLS_KEY_PATH
  - --tlsverify
  - --skip-hostname-check
- image
- container_name
- arg与env_file 
- environment
- depends_on 解决启动顺序问题
- entrypoint
- extends
- restart
- ports 主机访问容器端口.因为YAML将会解析xx:yy这种数字格式为60进制。所以建议采用字符串格式 '8000:8000'
- expose 供外部容器link访问
- links 使用的别名将会自动在服务容器中的/etc/hosts里创建?
- external_links
- extra_hosts 往/etc/hosts中添加
- build
- networks 安装docker默认创建3个网络. bridge/none/host. 具体区别 https://blog.csdn.net/gezhonglei2007/article/details/51627821
- network_mode
- work_dir 相当 cd
- volumes
  ```
  长语法
  type(挂载类型): volume(文件夹), bind(文件), tmpfs, npipe \
  source(挂载来源): 
  target(挂载目标路径): 
  read_only(只读):
  bind:  配置额外 bind 选项.propagation/create_host_path
  volume: 配置额外 volume 选项.nocopy
  tmpfs: 配置额外 tmpfs 选项.size
  consistency: 
  ```
- volumes_from
  - service_name
  - service_name:ro
  - container:container_name
  - container:container_name:rw
- security_opt
- tmpfs 挂载临时目录到容器内部
- cap_add, cap_drop 添加或删除容器的内核功能
- cgroup_parent 
- devices
- cpu_shares, cpu_quota, cpuset, domainname, hostname, ipc, mac_address, mem_limit, memswap_limit, privileged, read_only, restart, shm_size, stdin_open, tty, user, working_dir
水平扩展: docker-compose up --scale web=3 -d
```yml
#docker-compose部署通用型项目
version: '3'
services:
  mysql:
    images: mysql:5.7.21
    volumes:
      - "db-data:/var/lib/postgresql/data"
    networks: 
      - back-tier
  redis:
    images: redis:14.2
  web:
    build: ./web
    links:
      - mysql
      - redis
    networks:
      - back-tier

```
负载均衡 ![负载均衡](https://user-gold-cdn.xitu.io/2018/8/12/1652a0175d461457?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
```yml
#docker-compose.yml
version: "3"
services:
  redis:
    image: redis
  web:
    build:      #指定的镜像需要build
      context: .    #build的路径
      dockerfile: Dockerfile    #要build的dockerfile文件名
    environment:
      REDIS_HOST: redis
  lb:
    image: dockercloud/haproxy  #负载均衡的镜像
    links:      #连接到上面的service名为web的App
      - web
    ports:
      - 8080:80
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock 
```


## centos安装docker ==> centos上装 docker-ce http://www.runoob.com/docker/centos-docker-install.html
- 更新软件包: `sudo yum update`
- yum provides '*/applydeltarpm'
- yum install deltarpm -y
- 下载(建议用阿里的): `curl -sSL http://acs-public-mirror.oss-cn-hangzhou.aliyuncs.com/docker-engine/internet | sh`, `curl -sSL https://get.docker.com/ | sh`
- sudo docker engine activate
- 运行: `systemctl start docker`
- 失败?: `systemctl status -l docker.service`
- 自启动: 
  > `systemctl enable docker` \
  > `in -s '/usr/lib/systemd/system/docker.service' '/etc/systemd/system/multi-user.target.wants/docker.service'`
- 安装SQlite: `yum install sqlite-devel`
- 安装docker-compose
  - 安装python-pip: 
  - `yum -y install epel-release`
  - `yum -y install python-pip`
  - `pip install --upgrade pip`
  - `pip install docker-compose`

## windows 10 安装
> * checking if isocache exists: CreateFile
- wsl --update
- wsl --set-default-version 2
- netsh winsock reset
- wsl --shutdown
## 问题
- Delta RPMs disabled because /usr/bin/applydeltarpm
  > 先看`docker -v` \
  > 如果没有该命令: `yum provides '*/applydeltarpm'`, `yum install deltarpm`
- the docker command appears to already exist on this system
  > `yum list installed | grep docker`
- unable to access local containerd: failed to dial "/run/containerd/containerd.sock": context deadline exceeded
  > ? enterprise?
- cannot connect to the docker daemon at unix ///var/run/docker.sock. is the docker daemon running
  > docker 客户端通过unix:///var/run/docker.sock与docker daemon通信，unix:///var/run/docker.sock需要管理员权限才能访问，所以要么运行`sudo docker run hello-world`，要么将当前用户添加在docker用户组中 
`sudo usermod -aG docker $USER`,但必须重新登陆 \
  > 还是要修改docker.sock文件.https://stackoverflow.com/questions/42217526/cannot-start-docker-daemon-in-centos7
  先改用户和组然后:
  ```sh
  systemctl daemon-reload
  systemctl start docker.socket
  systemctl start docker
  ```
- docker build . 上下文问题
  ```ymal
  FROM nginx
  RUN echo '<h1>Hello, Docker!</h1>' > /usr/share/nginx/html/index.html
  ```
- docker无法启动: 登录Kitematic(不是Docker Quickstart)
- the input device is not a TTY.  If you are using mintty, try prefixing the command with 'winpty'
  > winpty docker exec -it --name redis-master bash
- starting container process caused "exec: \"bash\"
  > bash改为sh试试
- 复制docker中的文件到宿主: docker cp container_name:/path /path-to-out
-  'requests'. It is a distutils installed project and thus we cannot accurately determine which files belong to it which would lead to only a partial uninstall.
  > pip install docker-compose --ignore-installed requests 
- ERROR: Failed to Setup IP tables: Unable to enable SKIP DNAT rule:  (iptables failed: iptables --wait -t nat -I DOCKER -i br-a32657d7990a -j RETURN: iptables: No chain/target/match by that name.
  > 原因是关闭防火墙之后docker需要重启，执行以下命令重启docker即可：service docker restart
  - 查看日志: `docker logs --tail 10 xxx`
- 进入容器: `docker exec -ti name或id sh或bash` [--user=root 管理员身份进入]
- 容器内测试http请求: `wget localhost:3000 -O -`
- ERROR:Docker Got permission denied while trying to connect to the Docker daemon socket
  ```
  sudo groupadd docker
  sudo gpasswd -a ${USER} docker? sudo usermod -aG docker ${USER}
  reboot
  groups
  ```
- No route to host: 重启docker`service docker restart`
- [1号进程处理SIG*消息](https://github.com/Yelp/dumb-init)
- Cannot restart container manage: iptables failed
  ```
  pkill docker 
  iptables -t nat -F 
  ifconfig docker0 down
  ifconfig docker0 up
  systemctl restart docker
  ```