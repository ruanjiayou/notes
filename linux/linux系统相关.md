# Linux

- 常用: https://www.cnblogs.com/fnlingnzb-learner/p/5831284.html
- 用户和组: https://www.jianshu.com/p/f468e02f38a0
- linux命令大全: http://man.linuxde.net/

## 文件相关
<details>
  <summary>文件相关</summary>

- 当前目录路径: pwd
- `cd`
  - ~ 用户的目录
  - \- 回到上一个访问的目录
- 创建文件夹: `mkdir`
  - -p 支持创建多级文件夹
- 查看文件与目录: `ls` 
  - -a 显示隐藏文件(.开头)
  - -l 显示文件的属性与权限数据
  - -d 仅列出目录本身，而不是列出目录的文件数据
  - -h 将文件容量以较易读的方式（GB，kB等）列出来
  - -R 连同子目录的内容一起列出（递归列出）
- cp 复制文件,可以把多个文件一次性地复制到一个目录下
  - -a 将文件的特性一起复制
  - -p 连同文件的属性一起复制，而非使用默认方式，与-a相似，常用于备份
  - -i 若目标文件已经存在时，在覆盖时会先询问操作的进行
  - -r 递归持续复制，用于目录的复制行为
  - -u 目标文件与源文件有差异时才会复制
  > cp -a file1 file2 #连同文件的所有特性把文件file1复制成文件file2 \
    cp file1 file2 file3 dir #把文件file1、file2、file3复制到目录dir中
- rsync -avzu --progress test root@ip:/path
  - -v, --verbose 详细模式输出
  - -q, --quiet 精简输出模式
  - -c, --checksum 打开校验开关
  - -a, --archive 归档模式 等于 -rlptgoD
  - -r, --recursive 对子目录递归
  - -R, --relative 使用相对路径信息
  - -b, --backup 对已有的文件,讲老的文件重命名位~file
  - --backup-dir 备份文件存放目录
  - -suffix-SUFFIX 备份文件前缀
  - -l, --links 保留软链接
  - -u, --update 仅进行更新,跳过所有已存在DST且文件时间晚于要备份的文件
  - -L, --copy-links 软链接也进行传输
  - --copy-unsafe-links 
  - --safe-links 忽略指向src路径目录以外的连接
  - -H, --hard-links 保留硬链接
  - -p, --perms 保持文件权限
  - -o, --owner 保持文件属主信息
  - -g, --group 保持文件属组信息
  - -D, --devices 保持设备文件信息
  - -t, --times 保持文件时间信息
  - -S, --sparse                   对稀疏文件进行特殊处理以节省DST的空间
  - -n, --dry-run                  现实哪些文件将被传输
  - -W, --whole-file             拷贝文件，不进行增量检测
  - -x, --one-file-system      不要跨越文件系统边界
  - -B, --block-size=SIZE   检验算法使用的块尺寸，默认是700字节
  - -e, --rsh=COMMAND 指定使用rsh、ssh方式进行数据同步
  - --rsync-path=PATH      指定远程服务器上的rsync命令所在路径信息
  - -C, --cvs-exclude          使用和CVS一样的方法自动忽略文件，用来排除那些不希望传输的文件
  - --existing                      仅仅更新那些已经存在于DST的文件，而不备份那些新创建的文件
  - --delete                         删除那些DST中SRC没有的文件
  - --delete-excluded          同样删除接收端那些被该选项指定排除的文件
  - --delete-after                传输结束以后再删除
  - --ignore-errors             及时出现IO错误也进行删除
  - --max-delete=NUM     最多删除NUM个文件
  - --partial                        保留那些因故没有完全传输的文件，以是加快随后的再次传输
  - --force                          强制删除目录，即使不为空
  - --numeric-ids                不将数字的用户和组ID匹配为用户名和组名
  - --timeout=TIME IP       超时时间，单位为秒
  - -I, --ignore-times          不跳过那些有同样的时间和长度的文件
  - --size-only                    当决定是否要备份文件时，仅仅察看文件大小而不考虑文件时间
  - --modify-window=NUM 决定文件是否时间相同时使用的时间戳窗口，默认为0
  - -T --temp-dir=DIR      在DIR中创建临时文件
  - --compare-dest=DIR   同样比较DIR中的文件来决定是否需要备份
  - -P 等同于 --partial
  - --progress                    显示备份过程
  - -z, --compress             对备份的文件在传输时进行压缩处理
  - --exclude=PATTERN  指定排除不需要传输的文件模式
  - --include=PATTERN   指定不排除而需要传输的文件模式
  - --exclude-from=FILE   排除FILE中指定模式的文件
  - --include-from=FILE   不排除FILE指定模式匹配的文件
  - --version                      打印版本信息
  - --address                     绑定到特定的地址
  - --config=FILE             指定其他的配置文件，不使用默认的rsyncd.conf文件
  - --port=PORT              指定其他的rsync服务端口
  - --blocking-io               对远程shell使用阻塞IO
  - -stats                           给出某些文件的传输状态
  - --progress                   在传输时现实传输过程
  - --log-format=formAT  指定日志文件格式
  - --password-file=FILE 从FILE中得到密码
  - --bwlimit=KBPS         限制I/O带宽，KBytes per second
  - -h, --help                    显示帮助信息
- scp -r folder1 user@ip:/path-to-folder
- mv 用于移动文件、目录或更名
  - -f force强制 如果目标文件已经存在，不会询问而直接覆盖
  - -i 若目标文件已经存在，就会询问是否覆盖
  - -u 若目标文件已经存在，且比目标文件新，才会更新
- rm 用于删除文件或目录
  - -f 忽略不存在的文件; 不会出现警告消息
  - -i 在删除前会询问用户是否操作
  - -r 递归删除
- file
- diff
- touch 创建新文件/修改访问时间修改时间
- 查看文件前5行: head -n 5 path-to-file
- vim 
- find 
  > find [PATH] [option] [action]
- zip解压和压缩: unzip file / zip file
  > yum install zip unzip
- tar 压缩和解压
  - -c 新建打包文件
  - -t 查看打包文件的内容含有哪些文件名
  - -x 解打包或解压缩的功能，可以搭配-C（大写）指定解压的目录，注意-c,-t,-x不能同时出现在同一条命令中
  - -j 通过bzip2的支持进行压缩/解压缩
  - -z 通过gzip的支持进行压缩/解压缩
  - -v 在压缩/解压缩过程中，将正在处理的文件名显示出来
  - -f filename ：filename为要处理的文件
  - -C dir ：指定压缩/解压缩的目录dir
- cat 用于查看文本文件的内容
- tail 默认显示文件最后的10行文本
- du
  ```
  查看挂载的磁盘情况: du -h
  查看文件夹大小: du -h --max-depth=1, du -sh images
  ```
  - -a 显示目录中个别文件的大小
  - -b 显示目录或文件大小时，以byte为单位
  - -c 除了显示个别目录或文件的大小外，同时也显示所有目录或文件的总和
  - -D 显示指定符号连接的源文件大小
  - -h 以K，M，G为单位，提高信息的可读性
  - -k 以1024 bytes为单位
  - -l 重复计算硬件连接的文件
  - -m 以1MB为单位
  - -s 仅显示总计
- stat
- 查找位置：
  - 查找文件： `find / -name kafka-topics.sh`
  - 查找程序： `which nginx`
  - `whereis docker`
</details>

<details>
  <summary>权限相关</summary>

- id
- 添加用户组: `groupadd elk`
- 添加用户: `useradd elk`; `adduser git`,会自动在HOME下创建用户文件夹
- 查看用户所在组: `groups elk`
- 查看所有组: `cat /etc/group`
- 用户组改名: `groupmod -n new old`
- 删除用户组: `groupdel elk`
- 配置权限: `chown -R elk:elk /usr/local/elk/elasticsearch`
- 修改用户密码: `passwd git`
- chgrp 改变文件所属用户组
  > chgrp users -R ./dir # 递归地把dir目录下中的所有文件和子目录下所有文件的用户组修改为users
- chown 改变文件的所有者
- ls -l file
- ls-ld dir
- chmod 改变文件的权限
  > chmod [-R] xyz 文件或目录\
  > chmod 0755 file # 把file的文件权限改变为-rxwr-xr-x\
  > chmod g+w file # 向file的文件权限中加入用户组可写权限
- passwd
- 
</details> 

<details>
  <summary>程序相关</summary>

- 查看命令所在位置: `which docker`
- 查看service: systemctl list-units --type=service
- 挂载外部存储:
  ```
  sudo vim /etc/fstab
  添加: 
  <fs spec> <fs file> <fs vfstype> <fs mntops> <fs freq> <fs passno>
  <fs spec>: 分区定位, UUID或label
  <fs file> 挂载点位置如, /data
  <fs vfstype> 挂载磁盘类型,linux一般为ext4,windows一般为ntfs
  <fs nmtopts> 挂载参数,一般为defaults
  <fs freq> 磁盘检查,默认0
  <fs passno> 磁盘检查,默认0
  验证配置: sudo mount -a
  reboot
  ‵‵‵
- free
- top 
- service
- crontab
- nslookup baidu.com 查ip
- time 测算一个命令（即程序）的执行时间
- grep 常用于分析一行的信息，若当中有我们所需要的信息，就将该行显示出来，该命令通常与管道命令一起使用，用于对一些命令的输出进行筛选加工
  - -a
  - -c
  - -i
  - -v
  - --color 
- 查找进程: ps -ef | grep logstash
- kill -signal PID
  - 1：SIGHUP，启动被终止的进程
  - 2：SIGINT，相当于输入ctrl+c，中断一个程序的进行 
  - 9：SIGKILL，强制中断一个进程的进行
  - 15：SIGTERM，以正常的结束进程方式来终止进程
  - 17：SIGSTOP，相当于输入ctrl+z，暂停一个进程的进行
</details> 

网络相关
- netstat -ntlp | grep 3306
wget
ping
rpm
curl
- curl -o filename "url:..."

- 修改环境变量后有的要退出终端生效,有的要 
  > $ `source ~/.bashrc`
- 清除shell记录: 
  > $ `history -c`
- 查看shell记录: 
  > $ `vim ~/.bash_history`
- Linux系统有三个标准的显示用户最近登录信息的命令： last, lastb,和lastlog
  - last命令，对应的日志文件/var/log/wtmp； 成功登录用户
  - lastb命令，对应的日志文件/var/log/btmp； 尝试登录信息
  - lastlog命令，对应的日志文件/var/log/lastlog； 显示最近登录信息
  - 清除当前登录session的历史：
    > $ `history -r`
  - 清除所有历史：
    > $ `history -cw`
- 查看程序端口占用情况: 
  > $ `ps -aux | grep node`
- 显示服务器端口
  > 所有tcp端口: $ `netstat -ntlp`
  > 所有端口: $ `netstat -ntulp | grep 80`
- shutdown
- sort
- ifconfig
- uname
- whereis
- whatis
- man
- 

## 挂载
- 查看硬盘信息: `sudo fdisk -l`
- 临时挂载: `mkdir /mnt/resource`, `sudo mount /dev/sda2 /mnt/resource`
  ```
  <fs spec> <fs file> <fs vfstype> <fs mntops> <fs freq> <fs passno>
  具体说明，以挂载/dev/sdb1为例：
  <fs spec>：分区定位，可以给UUID或LABEL，例如：UUID=6E9ADAC29ADA85CD或LABEL=software
  <fs file>：具体挂载点的位置，例如：/data
  <fs vfstype>：挂载磁盘类型，linux分区一般为ext4，windows分区一般为ntfs
  <fs mntops>：挂载参数，一般为defaults 等于rw,suid,dev,exec,auto,nouser,async
  <fs freq>：磁盘检查，默认为0
  <fs passno>：磁盘检查，默认为0，不需要检查
  ```
- 查看磁盘分区的UUID: `sudo blkid`
- 配置开机自动挂载: 
  - `sudo vim /etc/fstab`
  - 增加: `UUID=xxxx /mnt/resource ntfs defaults 0 1`
  - 验证配置: `sudo mount -a`

## tree
- -a 显示所有文件和目录。
- -A 使用ASNI绘图字符显示树状图而非以ASCII字符组合。
- -C 在文件和目录清单加上色彩，便于区分各种类型。
- -d 显示目录名称而非内容。
- -D 列出文件或目录的更改时间。
- -f 在每个文件或目录之前，显示完整的相对路径名称。
- -F 在执行文件，目录，Socket，符号连接，管道名称名称，各自加上"*","/","=","@","|"号。
- -g 列出文件或目录的所属群组名称，没有对应的名称时，则显示群组识别码。
- -i 不以阶梯状列出文件或目录名称。
- -I 不显示符合范本样式的文件或目录名称。
- -l 如遇到性质为符号连接的目录，直接列出该连接所指向的原始目录。
- -n 不在文件和目录清单加上色彩。
- -N 直接列出文件和目录名称，包括控制字符。
- -p 列出权限标示。
- -P 只显示符合范本样式的文件或目录名称。
- -q 用"?"号取代控制字符，列出文件和目录名称。
- -s 列出文件或目录大小。
- -t 用文件和目录的更改时间排序。
- -u 列出文件或目录的拥有者名称，没有对应的名称时，则显示用户识别码。
- -x 将范围局限在现行的文件系统中，若指定目录下的某些子目录，其存放于另一个文件系统上，则将该子目录予以排除在寻找范围外。

## alias
- `sudo vim ~/.bashrc`
- `alias cmd='cd ~/projects && npm run dev'`
- `source ~/.bashrc`

## systemctl
> 是CentOS7的服务管理工具中主要的工具，它融合之前service和chkconfig的功能于一体
- 启动一个服务：`systemctl start firewalld.service`
- 关闭一个服务：`systemctlstop firewalld.service`
- 重启一个服务：`systemctlrestart firewalld.service`
- 显示一个服务的状态：`systemctlstatus firewalld.service`
- 在开机时启用一个服务：`systemctlenable firewalld.service`
- 在开机时禁用一个服务：`systemctldisable firewalld.service`
- 查看服务是否开机启动：`systemctlis-enabled firewalld.service`
- 查看已启动的服务列表：`systemctllist-unit-files|grep enabled`
- 查看启动失败的服务列表：`systemctl --failed`

## semanage
> selinux极大的增强了Linux的安全性,包括 文件系统,目录,文件,文件启动描述符,端口,消息接口和网络接口
- 查看当前允许的httpd端口: `semanage port -l|grep xxx`,xxx代表端口类型(名称?)或端口号
- 添加允许的httpd端口: `semanage port -a -t http_port_t -p tcp 8090`.像squid是squid_port_t
- 删除允许的httpd端口: `semanage port -d -t http_port_t -p tcp 8097`

## Linux 的安全配置四个级别
- firewall -> service -> filesystem -> selinux

## 防火墙
> CentOS7的防火墙换成了firewall了
- 开启端口 : `firewall-cmd --zone=public --add-port=80/tcp --permanent`
  - 命令含义：
  - --zone #作用域
  - --add-port=80/tcp #添加端口，格式为：端口/通讯协议
  - --permanent #永久生效，没有此参数重启后失效
- 查看防火墙状态: `systemctl status firewalld`
- 关闭防火墙: `systemctl stop firewalld.service`,`systemctl stop firewalld`
- 开启防火墙: `systemctl start firewalld.service`
- 禁止开机启动启动防火墙: `systemctl disable firewalld.service`
- 重新加载防火墙: `sudo firewall-cmd --reload`
- 添加例外端口: `firewall-cmd --add-port=8080/tcp`
- 永久添加: `firewall-cmd --permanent --add-port=8080/tcp`
- 设置端口范围: `firewall-cmd --add-port=80-8080/tcp`
- 删除例外端口: `firewall-cmd --remove-port=8080/tcp`
- 查看例外端口: `firewall-cmd --query-port=8080/tcp`

- 查看版本： `firewall-cmd --version`
- 查看帮助： `firewall-cmd --help`
- 显示状态： `firewall-cmd --state`
- 查看所有打开的端口： `firewall-cmd --zone=public --list-ports`
- 更新防火墙规则： `firewall-cmd --reload`
- 查看区域信息:  `firewall-cmd --get-active-zones`
- 查看指定接口所属区域： `firewall-cmd --get-zone-of-interface=eth0`
- 拒绝所有包：`firewall-cmd --panic-on`
- 取消拒绝状态： `firewall-cmd --panic-off`
- 查看是否拒绝： `firewall-cmd --query-panic`

## ftp
> https://www.cnblogs.com/zhouhbing/p/5564512.html
- yum install vsftpd
- vim /etc/vsftpd/vsftpd.conf
  ```
  # 禁止匿名访问
  anonymous_enable=NO

  # 允许本地用户登录FTP
  local_enable=YES

  # ftpusers是不允许登录的,user_list默认是不许登录的,下面是打开方式?
  userlist_enable=YES
  userlist_deny=NO
  ```
- 创建用户: useradd -d /home/ftp -g ftp -s /sbin/nologin userName -p password
- 启动服务: service vsftpd start
- 设置开机启动: chkconfig vsftpd on
- 配置防火墙...
- 不支持 FTP over TLS: 文件->站点管理器 选择普通ftp
- 530 Permission denied: 
- 530 login incorrect 是密码错了...
- 竟然能访问根目录...

## dns服务器
- `yum install bind-chroot bind-utils`
- 开机启动: `systemctl enable named-chroot`
- 修改: vim /etc/named.conf. 
  ```
  listen-on port 53 { any;}; # 监听任何ip对53端口的请求
  allow-query     { any; }; # 接收任何来源查询dns记录
  ```
- 添加解析域
- 检查主配置语法: `named-checkconf`
- 检查解析域: `named-checkzone "jiayou.com" /var/named/jiayou.com.zone`
- 重启服务: `service named restart`
- 测试dns: `host -t A www.jiayou.com 172.18.0.1`, 端口怎么来的? `netstat -ntlp`

## 技巧
- centos: xxx is not in the sudoers file
  ```bash
  su root
  chmod u+w /etc/sudoers
  vim /etc/sudoers
  yyp >> xxx ALL=(ALL) ALL
  ```
- centos查看版本: `lsb_release -a`, `rpm -q centos-release`, `cat /etc/issue`
- 查看Linux版本: `cat /proc/version`
- 查看Linux64位还是32位: `getconf LONG_BIT`
- 安装tree: `yum -y install tree`