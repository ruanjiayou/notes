

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

- 查看命令所在位置: `whick docker`
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

## zsh
- 

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