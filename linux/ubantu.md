# ubantu系统使用

## linux环境
- 安装node
## win10双系统安装
- 准备U盘,ubantu iso镜像文件, 启动U盘制作软件rufus, EasyBCD, DiskGenius
- 制作好后 重启
- install ubantu
- 卡住或黑屏: 在ubantu启动选项按E 加 nomodeset(临时解决显卡问题)
- 以后每次选 ubantu选项

### 将ubantu默认的中文文件夹名改为英文,资源管理器显示中文
1. vim /~/config/usesr-dirs.dirs
2. 终端中: `export LANG=en_US`, `xdg-user-dirs-gtk-update`
3. 打开文件,重命名.

### 设置快捷键
- 打开指定目录: `nautilus /home/username/Desktop`
### 软件安装
- mpv视频播放
- 搜狗输入法
  ```
  sudo apt install fcitx
  搜狗官网下载Linux版 双击安装
  # 安装过程中如果有错，运行sudo apt  --fix-broken install
  区域和语言,管理已安装的语言,选择fcitx,应用到整个系统
  reboot
  ```
### 问题
- 查看隐藏文件: ctrl+h
- 改hosts文件不生效: `sudo /etc/init.d/dns-clean start`
- 创建快捷方式: `ln -s 绝对路径 ~/桌面/名称`
- 因分辨率导致界面显示不全: alt+F7
- Nvidia显卡设置
  - 连接显卡：ubuntu-drivers devices
  - 自动安装：sudo ubuntu-drivers autoinstall
  - 修改grub配置：sudo gedit /boot/grub/grub.cfg quiet slash（三处）后添加 acpi_osi=linux nomodeset
  - passwd修改密码
  - UFET bios关闭Security Boot，华硕还要关fast boot
  - 重启：reboot
- ssh无法登录: 配置.ssh/config的形式就可以...
- 安装ftp客户端: `sudo apt install filezilla`
- 挂载磁盘上的项目 不能运行docker: ERROR: .IOError: [Errno 13] Permission denied: './docker-compose.yml'
  > 把项目复制到home里再执行
- 状态栏显示秒: sudo apt install gnome-tweak-tool => win+a => 优化 => 外观