# 笔记

## 升级系统
- 必须在电脑网页端进行切换系统，app不行！
- 升级后，固态和磁盘可以作为外部存储，但是必须有个空盘用于建存储池！

### docker
- 使用 docker.1ms.run作为加速配置

#### nginx
> TMD pro系统1.31版本脚本强制读取default.conf
- 挂载的root位置html文件夹要chmod 755，不然访问403
- nginx.conf/default.conf 要区分！default.conf 放server。

#### cloudflared
- 下载并安装
```sh
sudo -i # 切换为 root 权限

# 下载适用于 x86_64 架构的 Debian 包（UGOS Pro DX4600等均为此架构）
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# 安装
dpkg -i cloudflared-linux-amd64.deb
```
- 注册守护服务(cloud面板有)： `cloudflared service install <👉这里替换为你刚才复制的Tunnel-Token👈>`
- 登录并创建路由和配置
```sh
cloudflared tunnel login
cloudflared tunnel create nas
# (复制上面的uuid)
vim /root/.cloudflared/config.yml
tunnel: nas
credentials-file: /root/.cloudflared/xx-x-xxx-xxx.json

ingress:
  - hostname: jiayou.work
    service: http://localhost:80
  - hostname: gogs.jiayou.work
    service: http://localhost:999
  - service: http_status:404
```
- 重启服务： `systemctl restart cloudflared`

### 网络修改造成能搜到设备但连接失败
- 笔记本设置ip为192.168.1.100 子网掩码为 255.255.255.0 网关为 192.168.1.1
- 网线连接笔记本和设备
- 搜索设备查看mac地址
- 路由器上绑定mac地址的ip
- 网线连接还原
- 笔记本上登录设备