
## mac命令(有不同于Linux的)
- 查看TCP进程:(linux中用netstat)
  ```bash
  lsof -nP -iTCP -sTCP:LISTEN
  // 过滤
  lsof -nP -iTCP -sTCP:LISTEN | grep node
  kill -9 进程id
  ```
- 查看环境变量: `echo $PATH`

## 清除dns缓存
- `sudo killall -HUP mDNSResponder`
## mac技巧
- vscode+homebrew+node.js+git+docker(mysql+redis)+item2+zsh
- docker和docker-compose安装: brew install就可以
- 打开终端执行：/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
- vs code中新建.sh文件, chmod +x 文件.sh 赋予权限
- 预览所有桌面和窗口: ctrl+⬆ 或者 四指伸开
- 切换输入法: ctrl+空格
- finder右侧显示文件夹: 右键桌面,在上层文件夹显示
- 新建projects文件夹,按window(command将新文件夹拖到左侧)
- 截图: cmd+shift+4
- 监视器: 启动台-实用工具-监视器
- 修改hosts: sudo vim /etc/hosts
- ip查看: 设置-->网络
- 剪切: 源 cmd+c 目标: cmd+alt+v

## 添加系统命令别名
```sh
vim ~/.bash_profile
>> alias [xxx]='[yyy]' (如: `dev="cd ~/projects/notes/proxy && node app.js"`)
source ~/.bash_profile
alias
```

## Mac安装mysql
之前安装了homebrew: 
1. brew install mysql
2. brew services start mysql
3. /usr/local/opt/mysql/bin/mysql_secure_installation
4.

问题: 
  1.navicat能连,但nodejs报错 1251,Client does not support authentication protocol
进入数据库mysql表:alter user '用户名'@localhost IDENTIFIED WITH mysql_native_password by '你的密码’;flush privileges;

centos导入.sql文件:
执行:  mysql -u root -p 数据库名称 < sql文件的路径
Access denied for user ''@'localhost' to database 'mysql’: 因为有匿名账号
1. 关闭mysql: service mysqld stop
2. 屏蔽权限守护启动: mysqld_safe —skip-grant-table
3. 另起终端,删除匿名的user记录,刷新权限

## tree
```bash
$ brew install tree
```

## 解压rar
- brew install unrar
- unrar x path-to-file

- ## 导出插件
- Mac: `cd ~/Library/Application Support/Google/Chrome/Default/Extensions`
- 