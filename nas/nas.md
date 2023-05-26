## 绿联nas

### ssh登录
- 启动远程调试后要重启设备
> `ssh root@ip -p 922`, 密码是固定的 L#W$%W1uGa 加上远程协助功能的验证码
- ssh里重启docker: service dockerd restart
花生壳

## nas登录步骤
- curl "https://down.oray.com/hsk/linux/phddns_5.2.0_amd64.deb" -o phddns_5.2.0_amd64.deb
- dpkg -i phddns_5.2.0_amd64.deb
- b.oray.com 使用SN登录跳转后立即用账号再登陆一次绑定设备

## docker拉取失败
> 进到ssh可以拉取..
- 换镜像源: https://registry.cn-hangzhou.aliyuncs.com