# centos
> 2021年底官方源已不再维护

## 修改官方源为阿里云镜像
- `cd /etc/yum.repos.d/`
- `sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*`
- `sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*`
- `wget -O /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-vault-8.5.2111.repo`
- 如果wget命令找不到 `yum -y install wget`
## windows上用docker不如搞个虚拟机安装centos.不然问题贼多!
- 管理员身份运行 Hyper-v.cmd (家庭版window10开启Hyper-v)
  ```sh
  pushd "%~dp0"
  dir /b %SystemRoot%\servicing\Packages\*Hyper-V*.mum >hyper-v.txt
  for /f %%i in ('findstr /i . hyper-v.txt 2^>nul') do dism  online /norestart  add-package:"%SystemRoot%\servicing\Packages\%%i"
  del hyper-v.txt
  Dism /online /enable-feature /featurename:Microsoft-Hyper-V-All  LimitAccess /ALL
  ```
- 具体步骤: https://blog.csdn.net/u012963756/article/details/77900484
- 网络
  - 新建虚拟交换机
  - 选择外部本地连接或WiFi
  - 本地连接属性设置允许新交换机共享
  - cmd查看新交换机的信息
  - 设置centos内部静态ip
- 免密码登录真爽
参考: https://www.poweronplatforms.com/enable-disable-hyper-v-windows-10-8/
- 关闭Hyper-v(文件共用是个大问题,还不如docker)
  - 通过小娜打开powershell
  - Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
  - dism.exe /Online /Disable-Feature:Microsoft-Hyper-V-All


重装系统 centos > 7.5
root/admin/
docker-ce安装
git安装: yum install git
vim配置: yum -y vim
gogs安装
drone安装
harbor？
ffmepg
elk

.env
sh-demo/
mongodb-docker
redis-docker
mysql-docker
node-docker
nginx-docker

ssh user@ip "shell"
oauth？
proxy
ui2017/ui2019
password
utils
images
novel
blog
disk-cloud

## 安装列表
- node & nvm
- git
- mysql
- gogs
- docker
- drone
- 

```
10022 gogs-ssh 
9999 gogs git.my.com
9988 drone ci.my.com
9900 docker.my.com
8888 proxy.my.com
8090 file.my.com
8091 utils utils.my.com
8096 password pass.my.com
2017 2017.ui.my.com
2019 2019.ui.my.com

21 ftp
22 ssh
23 telnet 
25 smtp
80 http
443 https
3000 express/gogs 
3306 mysql
6379 redis
7001 egg
9000 php
9001 php1
27017 mongo
8888 charles
```

## 安全问题
- 指定ip登陆： `vim /etc/ssh/sshd_config` => `AllowUsers root@ip1,ip2` => `service restart sshd`
- 查看登陆失败日志: `tail /var/log/secure | grep Failed`
- 查看用户: `w`, `who`, `ps`, `kill`, `pkill`
- 修改ssh端口: 
- 限制登陆次数: `whereis pam_tally2` => `vim /etc/pam.d/login` => add `auth required pam_tally2.so deny=3 unlock_time=3600 even_deny_root root_unlock_time=3600`
- 软件改默认端口，使用复杂密码，应用升级最新版本

## n管理node版本
- 安装指定版本`n 版本`如`n 16.15.0`
- 查看安装的版本列表`n`
- 切换版本不生效的问题: n安装版本时有安装目录的信息, 如`/usr/local/n/versions/node/16.15.0`, 
  - 编辑 ~/.bash_profile 添加`export $N_PREFIX=/usr/local/n/versions/node/16.15.0` 
  - `$PATH=$N_PREFIX/BIN:$PATH`
  - `source ~/.bash_profile`
  - 查看版本: `node -v`

## 安装python3和pip3

### 安装EPEL和IUS软件源
 ```sh
  yum install epel-release
  yum install https://centos7.iuscommunity.org/ius-release.rpm
 ```
### 安装Python3.6
> yum install python36u
### 安装pip3
> yum install python3-pip