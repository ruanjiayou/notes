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
- 编辑vim配置
- chrome改主页和默认引擎,Google搜索设置改地区
- 配置搜狗输入法
```
set nu
set paste
set encoding=utf-8
set cul
set mouse=a
set tabstop=2
```
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
    $ sudo mount -a (一定要这个先测试！)
    ```
- (貌似没效果,换下面的)解决开机卡在logo的bug
  ```
  sudo vim /etc/modprobe.d/blacklist.conf
  >> blacklist nouveau
  >> options nouveau modeset=0
  ```
- 解决开机卡在logo的bug(这是解决鼠标的?logo第一个quiet后加 acpi_osi=! acpi="window 2009" 还有sudo vim /etc/default/grub !!!好像都不是!!!难道是有两个deepin造成的?)
  ```
  sudo vim /boot/grub/grub.cfg
  在quiet后面加 nouveau.modeset=0
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

## 问题
- win10快速启动造成不能挂载磁盘(系统无法启动...得另外登录Linux系统来修复)
- 貌似解决logo卡住问题引入的.Error: Driver 'pcspkr' is already registered, aborting.
  > /etc/modprobe.d/blacklist.conf << blacklist pcspkr
- 解决pcspkr问题引入的.ACPI Error.无法启动.最后把blacklist.conf删除了就好了