# ubantu系统使用

## win10双系统安装
- 准备U盘,ubantu iso镜像文件, 启动U盘制作软件rufus, EasyBCD, DiskGenius
- 制作好后 重启
- install ubantu
- 卡住或黑屏: 在ubantu启动选项按E 加 nomodeset(临时解决显卡问题)
- 以后每次选 ubantu选项

## 将ubantu默认的中文文件夹名改为英文,资源管理器显示中文
1. vim /~/config/usesr-dirs.dirs
2. 终端中: `export LANG=en_US`, `xdg-user-dirs-gtk-update`
3. 打开文件,重命名.

## 问题
- 查看隐藏文件: ctrl+h
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