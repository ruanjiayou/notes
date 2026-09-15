## 绿联nas

### hosts
```
192.168.0.124:8080 jenkins.jiayou.com
192.168.0.124:999 gogs.jiayou.com
192.168.0.124:5000 docker.jiayou.com
192.168.0.124:9200 es.jiayou.com
192.168.0.124:8083 registry.jiayou.com
192.168.0.124:16880 aria2.jiayou.com
192.168.0.124:8088 reader.jiayou.com
192.168.0.124:8081 mongo.jiayou.com
```

### ssh登录
- 启动远程调试后要重启设备
> `ssh root@ip -p 922`, 密码是固定的 L#W$%W1uGa 加上远程协助功能的验证码
- ssh里重启docker: service dockerd restart
花生壳

### lantern
> 首先右键桌面上的Lantern图标，选择“打开文件位置”，即可进入lantern的安装目录。在其中寻找一个setting.yaml的文件 \
> Mac系统路径在`/Users/jiayou/Library/Application Support/Lantern/settings.yaml`
- /etc/rc.local 里开机启动(密码是qq+123456)
- /home/ruanjiayou/lantern-headless start --http-proxy-addr 0.0.0.0:7890 &
## nas登录步骤
- curl "https://down.oray.com/hsk/linux/phddns_5.2.0_amd64.deb" -o phddns_5.2.0_amd64.deb
- dpkg -i phddns_5.2.0_amd64.deb  (没有wget会失败，apt install wget后phddns会自动成功)
- b.oray.com 使用SN登录跳转后手机扫码激活
## docker拉取失败
> 进到ssh可以拉取..
- 换镜像源: https://registry.cn-hangzhou.aliyuncs.com
- 修改远程访问: 0.0.0.0:9375

## 自动启动web-shell服务
- 非登录shell会加载.bashrc (中文编码显示问题/回车输入变补问题)
  ```
   cd /home/ruanjiayou
   alias duck='f() { docker exec "$1" sh -c "${*:2}"; }; f'
   export TERM=xterm-256color
   export LANG=zh_CN.UTF-8
   export LC_ALL=zh_CN.UTF-8
  ```
- 指定用户运行 su - username (-表示到用户默认目录)

- 脚本方式 /usr/bin/start-ttyd.sh `opkg install ttyd`的版本只有 1.6.3,github 发行版本 1.7.7 有问题用 1.7.2 `https_proxy=http://192.168.0.125:8888 wget https://github.com/tsl0922/ttyd/releases/download/1.7.2/ttyd.x86_64 -O /usr/bin/ttyd`
```sh
#!/bin/sh
exec su ruanjiayou -c "/usr/bin/ttyd -p 8222 /bin/bash"
```
- 服务方式
1. 创建服务脚本: `vim /etc/init.d/ttyd8222`
   ```sh
   #!/bin/sh /etc/rc.common

   START=99
   STOP=10

   USE_PROCD=1

   start_service() {
      procd_open_instance
      procd_set_param command /usr/bin/ttyd -p 8222 --base-path /ssh -- /bin/bash --rcfile /home/ruanjiayou/.bashrc -i
      procd_set_param respawn
      procd_close_instance
   }
   stop_service() {
      killall ttyd
   }
   ```
2. 设置权限
   ```shell
   chmod +x /etc/init.d/ttyd8222
   /etc/init.d/ttyd8222 enable
   /etc/init.d/ttyd8222 start
   /etc/init.d/ttyd8222 stop
   ```
3. 验证: `netstat -tnlp | grep 8222`, 查看日志 `logread | grep ttyd`
4. 当前用户： `id`


## cloudflared设置开机启动
- 创建服务脚本: `vim /etc/init.d/cloudflared`
  ```sh
   #!/bin/sh /etc/rc.common

   # 服务名称
   NAME="cloudflared"

   # 启动优先级（数字越小越早启动，通常网络服务设99）
   START=99
   # 停止优先级
   STOP=10

   # 使用procd进程管理框架
   USE_PROCD=1

   start_service() {
      # 开启一个procd实例
      procd_open_instance

      # 设置启动命令：cloudflared 的完整路径
      procd_set_param command /usr/bin/cloudflared --config /etc/cloudflared/config.yml tunnel run production

      # 设置日志输出到系统日志
      procd_set_param stdout 1
      procd_set_param stderr 1

      # 设置自动重启（进程意外退出时，服务会尝试重启）
      procd_set_param respawn

      # 设置运行用户（可选，留空则默认root）
      # procd_set_param user root

      # 关闭实例
      procd_close_instance
   }

   stop_service() {
      # 停止时直接kill所有cloudflared进程（procd也会自动处理，但可以保留）
      killall cloudflared 2>/dev/null || true
   }

   # 重启服务（通常procd已经处理好，但可以保留）
   restart() {
      stop
      sleep 1
      start
   }
  ```
- 检查shell语法: `bash -n /etc/init.d/cloudflared`
- 添加执行权限: `chmod +x /etc/init.d/cloudflared`
- 测试脚本: `/etc/init.d/cloudflared status`
- 设置开机启动: `/etc/init.d/cloudflared enable`
- 手动启动服务: `/etc/init.d/cloudflared start`
- 查看服务状态: `/etc/init.d/cloudflared status`

## lantern开机启动
- 创建服务脚本: `vim /etc/init.d/lantern-headless`
  ```sh
   #!/bin/sh /etc/rc.common

   # 服务名称
   NAME="lantern-headless"

   # 启动优先级（数字越小越早启动，通常网络服务设99）
   START=100
   # 停止优先级
   STOP=10

   # 使用procd进程管理框架
   USE_PROCD=1

   start_service() {
      # 开启一个procd实例
      procd_open_instance

      # 设置启动命令：cloudflared 的完整路径
      procd_set_param command /home/ruanjiayou/lantern-headless start --http-proxy-addr 0.0.0.0:7890

      # 设置日志输出到系统日志
      procd_set_param stdout 1
      procd_set_param stderr 1

      # 设置自动重启（进程意外退出时，服务会尝试重启）
      procd_set_param respawn

      # 设置运行用户（可选，留空则默认root）
      # procd_set_param user root

      # 关闭实例
      procd_close_instance
   }

   stop_service() {
      # 停止时直接kill所有cloudflared进程（procd也会自动处理，但可以保留）
      killall cloudflared 2>/dev/null || true
   }

   # 重启服务（通常procd已经处理好，但可以保留）
   restart() {
      stop
      sleep 1
      start
   }
  ```
- 检查shell语法: `bash -n /etc/init.d/lantern-headless`


## 升级UGOS Pro
- 关机断电：先把 NAS 正常关机，然后拔掉电源线。
- 取出所有硬盘：把你自己的硬盘（包括 SSD）全部抽出来，放在安全的地方。
- 空机升级：在不插入任何硬盘的情况下，开机并按照指引完成 UGOS Pro 系统切换。
- 重新插入硬盘：系统升级完成后，关机，把硬盘插回去，再开机。
- 挂载外部存储：进入新系统后，在「存储管理」中找到这些硬盘，选择以「外部存储」模式挂载，就能在文件管理器中访问原有数据了。
- 复制数据到新存储池：如果需要把这些硬盘转为内部存储（比如要组 RAID），需要先格式化，所以建议先把数据复制到新建的存储池里，再格式化旧盘

### 数据处理
- 备份相册
- docker
  - [ ] apis:260415
  - [ ] bun-hivemind:latest
  - [ ] 192.168.0.124:5000/ruanjiayou/download-api
  - [x] elasticsearch:8.6.0
  - [x] nginx:latest
  - [ ] jenkins/jenkins:latest
  - [x] hectorqin/reader:latest
  - [x] docker.1ms.run/pubuzhixing/drawnix:latest
  - [x] hectorqin/remote-webview:latest
  - [x] verdaccio/verdaccio:latest
  - [ ] jc21/registry-ui:latest
  - [ ] registry:2.8
  - [x] mongo:4.4
  - [x] redis:latest
  - [x] mysql:latest
  - [x] gogs/gogs:latest

#### nginx
root@1dcbdcd20100:/etc/nginx# ls
conf.d  fastcgi_params  mime.types  modules  nginx.conf  scgi_params  uwsgi_params

#### redis/mysql备份: `sudo -u git ./gogs backup --target /backup/gogs/`

#### gogs备份
```
222 -> 22
999 -> 999

GOGS_CUSTOM -> /data/gogs
```
钩子
```sh
#!/bin/sh
#
# An example hook script for the "post-receive" event.
#
# The "post-receive" script is run after receive-pack has accepted a pack
# and the repository has been updated.  It is passed arguments in through
# stdin in the form
#  <oldrev> <newrev> <refname>
# For example:
#  aa453216d1b3e49e7f6f98441fa56946ddcd6a20 68f7abf4e6f922807889f52bc043ecd31b79f814 refs/heads/master

while read oldrev newrev refname
do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    if [ "master" = "$branch" ]; then
        # Do something
        curl -X POST http://jenkins:114110faa96f12c798fce569f71290b28f@192.168.0.124:8080/job/download-api-build/build?token=download-123456
        echo "build image: download-api"
    fi
done
```

#### redis
- data目录有备份文件

#### mongodb
- mongodb: `mongodump --out /data/backup/all_4.4_20260607` -> `mongorestore --host localhost --port 27017 /backup/mongodb_4.4_20260107`

#### jenkins 
- Cloud host
```
Docker Host URI: tcp://192.168.0.124:9375
```
- credentials
```
gogs
docker
registry
```

- Directory for Dockerfile目录 `$WORKSPACE`
```sh
tag=$BUILD_NUMBER
curl --location --request POST 'http://192.168.0.124:9375/images/create?fromImage=192.168.0.124%3A5000%2Fruanjiayou%2Fdownload-api&tag='$tag'&message=test' \
--header 'X-Registry-Auth: eyJzZXJ2ZXJhZGRyZXNzIjoiMTkyLjE2OC4wLjEyNDo1MDAwIiwidXNlcm5hbWUiOiJyZWdpc3RyeSIsInBhc3N3b3JkIjoiMTIzNDU2In0='
d=$(TZ=UTC-8 date "+%Y-%m-%d %H:%M:%S")
data='{
    "msgtype": "markdown",
    "markdown": {
        "content": "'${d}' \r\n<font color='red'>download-api</font> 镜像制作成功"
    }
}'
curl --location --request POST 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=a158bc91-2ed0-40d6-8863-db42eac6ed62' --header 'Content-Type: application/json' --data-raw "$data"
```

#### init.d
- ttyd
```sh
#!/bin/sh /etc/rc.common

START=99
STOP=10

USE_PROCD=1

start_service() {
    procd_open_instance
    procd_set_param command /usr/bin/ttyd -p 8222 -c 2048:123456 --base-path /ssh -- /bin/bash --rcfile /home/ruanjiayou/.bashrc -i
    procd_set_param respawn
    procd_close_instance
}

stop_service() {
    killall ttyd
}
```
- cloundflared
```sh
#!/bin/sh /etc/rc.common

# 服务名称
NAME="cloudflared"

# 启动优先级（数字越小越早启动，通常网络服务设99）
START=99
# 停止优先级
STOP=10

# 使用procd进程管理框架
USE_PROCD=1

start_service() {
    # 开启一个procd实例
    procd_open_instance

    # 设置启动命令：cloudflared 的完整路径
    procd_set_param command /usr/bin/cloudflared tunnel run production

    # 设置日志输出到系统日志
    procd_set_param stdout 1
    procd_set_param stderr 1

    # 设置自动重启（进程意外退出时，服务会尝试重启）
    procd_set_param respawn

    # 设置运行用户（可选，留空则默认root）
    # procd_set_param user root

    # 关闭实例
    procd_close_instance
}

stop_service() {
    # 停止时直接kill所有cloudflared进程（procd也会自动处理，但可以保留）
    killall cloudflared 2>/dev/null || true
}

# 重启服务（通常procd已经处理好，但可以保留）
restart() {
    stop
    sleep 1
    start
}
```
- 