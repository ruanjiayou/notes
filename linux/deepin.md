# deepin
- 系统iso: http://packagess.deepin.com:8088/releases/15.10.1/deepin-15.10.1-amd64.iso
- window版启动盘制作: http://cdimage.deepin.com/applications/deepin-boot-maker/windows/deepin-boot-maker.exe
- Mac版启动盘制作: http://cdimage.deepin.com/applications/deepin-boot-maker/macos/deepin-boot-maker.zip
- 制作完启动盘后重启.
- 飞行堡垒按F2进入BIOS
- 将boot中的U盘设为第一优先,F10保存重启
- 在选择启动项时按E(不然N卡的显卡电脑会卡在logo)
- quiet后面,空格并加nouveau.modeset=0
- 注意: windows的区分NTFS是MBR格式,deepin会要求格式化整个磁盘,而不是单个分区!
- window下用paragon 12 格式化为ext4格式; DiskGenius 4.3 不行

## 一些配置
- 安装vscode
- 关闭音效; 鼠标自然模式
- 编辑vim配置: vim ~/.vimrc
  > . ~/.vimrc
  ```
  set nu
  set paste
  set encoding=utf-8
  set cul
  set mouse=a
  set tabstop=2
  ```
- 配置搜狗输入法
- 挂载磁盘
    ```
    # 查看磁盘和分区信息
    sudo fdisk -l
    # 查看UUID
    sudo blkid
    # 设置开机挂载
    $ sudo vim /etc/fstab
    $ # /dev/sda2
    $ UUID=xxx /mnt/e ntfs defaults 0 1
    $ sudo mount -a (一定要这个先测试！关闭占用的：sudo umount /dev/sda1)
    ```

## 安装node和npm
- wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
- source ~/.bashrc
- nvm install stable
- node -v
- npm -v

## 安装git
- sudo apt-get install git
- git config --global user.name "ruanjiayou"
- git config --global user.email "ruanjiayou123@gmail.com"
- cd ~/.ssh (不然都在~目录了...)
- 0777too open: chmod 600 ~/.ssh/id_rsa, chmod 600 ~/.ssh/config
- ssh-keygen -t rsa -C ruanjiayou123@gmail.com << id_rsa_baidu和gogs
  ```
  Host baidu
    HostName xx.xx.xx.ip
    Port 22222
    User git
    IdentityFile ~/.ssh/id_rsa_baidu.pub
    IdentitiesOnly yes

  Host gogs
    HostName xx.xx.xx.ip
    Port 2222
    User git
    IdentityFile ~/.ssh/id_rsa_gogs.pub
    IdentitiesOnly yes
  ```
- 添加高速缓存?
  ```bash
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_rsa_baidu
  ```
- 云服务器免密登录: 
  ```bash
  ssh-copy-id -i ~/.ssh/id_rsa_baidu.pub baidu
  ssh baidu
  ```
- 添加hosts
  > sudo vim /etc/hosts
  ```
  xx.xx.xx.ip www.test.com
  ```
- gogs添加公匙

## docker
> https://wiki.deepin.org/wiki/Docker
- 如果安装过旧的docker: `sudo apt-get remove docker.io docker-engine`
- 如果依赖没有可安装候选应该是新版本不需要了: `sudo apt-get install apt-transport-https ca-certificates curl python-software-properties software-properties-common`
- 建议用清华源。官方源: `curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -`, 清华源: `curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/debian/gpg | sudo apt-key add -`
- 查看秘钥是否安装成功: `sudo apt-key fingerprint 0EBFCD88`
- 查看版本号: `cat /etc/debian_version`.deepin 15.9.2 基于 debian 9.0对应stretch
- 在 source.list 中添加 docker-ce 软件源
  > 官方源: `sudo add-apt-repository  "deb [arch=amd64] https://download.docker.com/linux/debian stretch stable"` \
  > 清华源: `sudo add-apt-repository "deb [arch=amd64] https://mirrors.ustc.edu.cn/docker-ce/linux/debian stretch stable"`
- 报错的话就(清华源): `sudo vim /etc/apt/sources.list` << `deb [arch=amd64] https://mirrors.ustc.edu.cn/docker-ce/linux/debian stretch stable`
- 更新仓库: `sudo apt-get update`
- 安装docker-ce: `sudo apt-get install docker-ce`
- 启动docker: `systemctl start docker`
- 查看安装的版本信息: `docker version`
- 验证 docker 是否被正确安装并且能够正常使用: `sudo docker run hello-world`
- 让普通用户也能运行起来: `sudo usermod -aG docker $USER`
- 查看: `docker ps -a`.失败就看docker.md deepin里要重启
- 关闭开机启动: 安装chkconfig->`sudo apt-get install chkconfig`,移除自启->`sudo chkconfig --del docker`

## docker-compose 
- `sudo curl -L https://github.com/docker/compose/releases/download/1.19.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose`
- `sudo chmod +x /usr/local/bin/docker-compose`
- `docker-compose --version`
## navicat和AndroidStudio

## 安装Python和pip
> sudo apt install -y python-pip python3-pip 然后用pip命令调用python2的pip
pip3命令调用python3的

## chrome
- 改主页和默认引擎,Google搜索设置改地区
- 插件: qrcode,adblock,jsonViewer,colorZilla
- 书签栏: youtube,火萤,

## 应用商店
- 4k video download
- AndroidStudio(不能用)
- vscode
- 

## logo卡住的问题
> 两个deepin碰到的问题：update-grub会修改所有系统的grub配置（每个系统的grub.cfg有所有引导项），但只该了其他系统的配置。到其他系统再改一次就好了。也是因为我的当前系统不是主系统
- logo卡住解决方案一:(a start job is running for live-config xxx 的问题也可以解决...)
  > 启动项按e, quiet 后面加: `acpi_osi=! acpi="windows 2009"`, F10(保存并继续启动) \
  > sudo vim /etc/default/grub  最后面加一行: GRUB_CMDLINE_LINUX_DEFAULT="$GRUB_CMDLINE_LINUX_DEFAULT"'acpi_osi=! acpi="windows 2009"' \
  > sudo update-grub (艹,很多教程没这句)
- logo卡住解决方案二:(之前这个也可以,现在要第一种才能解决)
  > 启动项按e, quiet 后面加: `uveau.modeset=0`, F10(保存并继续启动)

## 修改网卡默认名称,开热点
- sudo vim /etc/default/grub
- GRUB_CMDLINE_LINUX_DEFAULT 那行改成 后面添加 net.ifnames=0 biosdevname=0
- 保存并退出
- sudo update-grub
- sudo apt-get install hostapd iptables dnsmasq
- git clone https://github.com/oblique/create_ap 
- cd create_ap
- sudo make install
- sudo create_ap wlan0 eth0 myhost 12345678 &  #开启热点并后台运行，可以关闭终端(重启不用再执行了)

## 休眠死机
- deepin 15.11升级内核到5.1.20版
  - 配置编译环境: `sudo apt-get install build-essential kernel-package libncurses5-dev fakeroot libssl-dev`
  - 下载5.1.20内核: https://www.kernel.org/
  - 在home目录下建立一个linux目录，并将内核文件解压其中: tar xfv linux-5.1.20.tar.xz
  - 进入解压目录，运行以下命令: `make mrproper`
  - 拷贝现内核配置文件到编译目录的.config: cp /boot/config-`uname -r`* .config
  - 依据现有配置文件配置新内核，新设置用缺省值: `make olddefconfig`
  - 根据自己的需要修改配置参数，此步骤本人省略了: `make menuconfig`
  - 开始编译deb包: `make -j8 deb-pkg`
  - 编译完成后，deb包会在上一级目录上，安装就可以: `sudo dpkg -i linux-*.deb`
  - 重启完事
  - 卸载你安装的内核包可用下面的命令: `sudo dpkg --purge linux-image-NNN`(其中NNN为你编译的内核版本号，如5.1.20)
- planB
  - https://kernel.ubuntu.com/~kernel-ppa/mainline/v5.1.20/
  - 下载amd64(64位cpu,i386是32位cpu的意思).4个(就是不下有lowlatency的)
  - 四个安装包下载并且放在同一文件夹下，然后右键在该文件夹内打开终端，准备开始安装
  - sudo dpkg -i *.deb
  - 安装完成后保险起见手动更新新内核的引导项（正常自动会更新，这里保险起见）: `sudo update-grub`
  - 重新启动系统，然后选择新内核Linux 5.0.1启动即可，通常情况下都可以顺利完成

## 问题
- win10快速启动造成不能挂载磁盘(系统无法启动...得另外登录Linux系统来修复)
- 貌似解决logo卡住问题引入的.Error: Driver 'pcspkr' is already registered, aborting.
  > /etc/modprobe.d/blacklist.conf << blacklist pcspkr
- 解决pcspkr问题引入的.ACPI Error.无法启动.最后把blacklist.conf删除了就好了
- fsck: error 2(No such file or directory) while xxx
- ACPI Error: logo卡住方案一?
- Driver 'pcspkr' is already registered, aborting: 蜂鸣器有关?
- a start job is running for live-config: swap的问题?
  - 查看swap分区是否正常: `swapon --show`
  - 关闭现有的swap: `sudo swapoff -a`
  - 创建要作为swap分区的文件2G: `sudo dd if=/dev/zero of=/root/swapfile bs=1M count=2048`
  - 格式化为交换分区文件: `sudo mkswap /root/swapfile`
  - 启用交换分区文件: `sudo swapon /root/swapfile`
  - 开机时自启用: /etc/fstab中 `/root/swapfile swap swap defaults 0 0`
  - 重启后验证: `free -m`
- root file system requires a manual fsck
  > 执行 fsck /dev/sda3
- Error: ENOSPC: System limit for number of file watchers reached, watch
  > sudo vim /etc/sysctl.conf \
  > 修改或添加fs.inotify.max_user_watches=524288
  > 生效 sudo sysctl -p 