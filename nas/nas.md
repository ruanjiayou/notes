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
> 首先右键桌面上的Lantern图标，选择“打开文件位置”，即可进入lantern的安装目录。在其中寻找一个setting.yaml的文件

## nas登录步骤
- curl "https://down.oray.com/hsk/linux/phddns_5.2.0_amd64.deb" -o phddns_5.2.0_amd64.deb
- dpkg -i phddns_5.2.0_amd64.deb  (没有wget会失败，apt install wget后phddns会自动成功)
- b.oray.com 使用SN登录跳转后手机扫码激活
## docker拉取失败
> 进到ssh可以拉取..
- 换镜像源: https://registry.cn-hangzhou.aliyuncs.com
- 修改远程访问: 0.0.0.0:9375
