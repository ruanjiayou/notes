
搞不定授权就是浪费时间
- Linux系统安装docker: http://www.docker.com
  > `centos` yum安装:  \
  > 安装系统工具: `sudo yum install -y yum-utils device-mapper-persistent-data lvm2` \
  > 添加软件源信息: `sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo` \
  > 更新 yum 缓存: `sudo yum makecache fast` \
  > 安装 Docker-ce：`sudo yum -y install docker-ce` \
  > 启动docker后台服务: `sudo systemctl start docker` \
  > 脚本安装: \
  ```bash
  sudo yum update
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo systemctl start docker
  ```
  > 删除docker-ce: `sudo yum remove docker-ce && sudo rm -rf /var/lib/docker`
- 注册登陆: https://hub.docker.com
- 下载镜像: sudo docker pull johnshine/baidunetdisk-crossover-vnc:latest
- 新建下载目录: `mkdir /home/download`
- 日,作者多了个docker,我还以为是指定用户 `sudo docker run -d -p 5901:5901 -v /home/download:/mnt/drive_d -e vnc_password=123456 johnshine/baidunetdisk-crossover-vnc:latest`