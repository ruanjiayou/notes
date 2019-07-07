# gogs
> 环境: `centos=7.0`, `mysql(INNODB)>=5.7`, `2018-12-26`, `gogs=0.11.79`

```
1.adduser和useradd home/git目录
2.gogs.service
3.git权限
```
- 先安装好mysql(INNODB引擎)
- 添加git用户并进入git的HOME目录: `adduser git & cd git`
- 设置密码: `passwd git`, 123456
- git添加sudo写权限: 
  ```
  su root
  chmod u+w /etc/sudoers
  vim /etc/sudoers
  yyp >> git ALL=(ALL) ALL
  ```
- 下载gogs: `https://dl.gogs.io/0.11.79/gogs_0.11.79_linux_amd64.tar.gz`
- 解压并进入gogs目录: `tar -zxvg gogs_0.11.79_linux_amd64.tar.gz & cd gogs`
- 初始化数据库: `mysql -u root -p < scripts/mysql.sql`
- 创建gogs用户并授权: `mysql -u root -p`
  ```sql
  # (输入密码)
  create user 'gogs'@'localhost' identified by '密码';
  grant all privileges on gogs.* to 'gogs'@'localhost';
  flush privileges;
  exit;
  ```
- (设置启动端口)执行初始化配置安装: `./gogs web -port 8888`
- 添加服务: `sudo cp /home/git/gogs/scripts/init/centos/gogs /etc/init.d/`
- 给予执行权限: `sudo chmod +x /etc/init.d/gogs`
- 检查gogs下的文件夹的权限: `ls -l` => 修改所有者: `sudo chown git:git log`
- centos中修改scripts/system/gogs.service: after的数据库只写mysqld.service(因为我们用的mysql...)
- 开机自启动: `sudo chkconfig gogs on`,取消: `sudo chkconfig gogs off`
- 启动服务: `sudo service gogs start`

- [配置介绍](https://gogs.io/docs/advanced/configuration_cheat_sheet)
- [常见问题](https://gogs.io/docs/intro/faqs)

## 步骤
- ./gogs/gogs就是所说的custom
- RUN_CROND=true 可以改 app.ini 也可以放环境变量?

- docker-compose up -d
- 访问 ip:port
- 设置
- 管理员 user pass email
- 设置hosts ip:port git.site.com