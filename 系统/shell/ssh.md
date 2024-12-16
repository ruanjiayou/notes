# ssh

## 安装

### ubantu
> 没有/etc/init.d/ssh就是安装失败
- `apt install openssh-client openssh-server -y`
- `/etc/init.d/ssh start`
- systemctl enable ssh

### window10
- https://www.cnblogs.com/sparkdev/p/10166061.html
  > TMD ssh里执行的是cmd命令(账号密码是Windows的登录账号密码)
## 卸载
### ubantu
- sudo apt-get remove openssh-client openssh-server --purge
## 远程登录
- 修改root密码: `sudo passwd`
- 修改sshd配置
  `vim /etc/ssh/sshd_config` 
  ```
  PermitRootLogin yes
  PasswordAuthentication yes
  ```
