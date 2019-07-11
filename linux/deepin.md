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

## 安装node和npm
- wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
- source ~/.bashrc
- source ~/.bashrc
- node -v
- npm -v