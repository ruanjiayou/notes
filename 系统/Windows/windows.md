# window系统中的问题

- window文件或目录损坏无法访问：右键该盘->选择工具->检查。第一次修复失败就再来一次
- node无法将C盘文件重命名到E盘: Error: EXDEV, cross-device link not permitted => copy & unlink
- win10用win7的图片查看器: HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Photo Viewer\Capabilities\FileAssociations, 新建-字符串值, .jpg, 保存,编辑输入 PhotoViewer.FileAssoc.Tiff.保存.选择一张jpg打开.png和gif同理.
- windows每次启动docker VM失败.第二次就好了,但数据不见了.
- 读取ext4磁盘: LinuxReader

## 系统引导
> 每个系统都有 启动管理器和启动加载器
- `bcdedit /?`: 帮助命令
- `bcdedit /? /delete`: 查看删除命令
- `bcdedit /enum`: 列出所有
- `bcdedit /delete {7f4f47c9-8b58-11e9-9322-00bb6062e877}`: 删除启动项(启动加载器)
- `bcdedit /set {bootmgr} timeout 0`: 关闭windows启动管理器(一闪而逝...)
- `bcdedit /set {bootmgr} displaybootmenu No`: 关闭windows启动管理器

## win10里删除顽固的ubantu引导
- 选择win10的260M的EFI分区
  - 打开cmd
  - 打开系统工具: `diskpart`
  - 查询磁盘信息: `list disk`
  - 选择磁盘: `select disk 1`
  - 选择分区: `select partition 1`
- 分配盘符: `assign letter=p`
- 管理员权限打开记事本
- 记事本打开文件访问p盘
- 直接在对话框里删除EFI文件夹里的ubantu
- 删除盘符: `remove letter=p` 
  ```
  打开cmd
  diskpart命令
  list disk
  ```
## window10开机Local Session Manager CPU 100%
> 是superfetch服务造成的?
在命令提示符(管理员)下键入以下命令：sfc /SCANNOW 及
Dism /Online /Cleanup-Image /ScanHealth
这条命令将扫描全部系统文件并和官方系统文件对比，扫描计算机中的不一致情况。
Dism /Online /Cleanup-Image /CheckHealth
这条命令必须在前一条命令执行完以后，发现系统文件有损坏时使用。
DISM /Online /Cleanup-image /RestoreHealth
这条命令是把那些不同的系统文件还原成官方系统源文件。
完成后重启，再键入以下命令：sfc /SCANNOW，
检查系统文件是否被修复。
同时检查更新您计算机所有的设备驱动程序

## 安装docker