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

1. 创建脚本 /usr/bin/start-ttyd.sh 
```sh
#!/bin/sh
exec su ruanjiayou -c "/usr/bin/ttyd -p 8222 /bin/bash"
``````
1. 创建服务脚本: `vim /etc/init.d/ttyd8222`
   ```sh
   #!/bin/sh /etc/rc.common

   START=99
   STOP=10

   USE_PROCD=1

   start_service() {
      procd_open_instance
      procd_set_param command /usr/bin/ttyd -p 8222 /bin/bash --rcfile /home/ruanjiayou/.bashrc -i
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