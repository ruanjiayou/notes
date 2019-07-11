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