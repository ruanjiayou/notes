# window系统中的问题

- window文件或目录损坏无法访问：右键该盘->选择工具->检查。第一次修复失败就再来一次
- node无法将C盘文件重命名到E盘: Error: EXDEV, cross-device link not permitted => copy & unlink
- win10用win7的图片查看器: HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Photo Viewer\Capabilities\FileAssociations, 新建-字符串值, .jpg, 保存,编辑输入 PhotoViewer.FileAssoc.Tiff.保存.选择一张jpg打开.png和gif同理.
- windows每次启动docker VM失败.第二次就好了,但数据不见了.
- 读取ext4磁盘: LinuxReader