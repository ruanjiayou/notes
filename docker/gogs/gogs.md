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
  grant all privileges on *.* to 'gogs'@'%';
  flush privileges;
  exit;
  ```
- (设置启动端口)执行初始化配置安装: `./gogs web -port 8888`
- 添加服务: `sudo cp /home/git/gogs/scripts/init/centos/gogs /etc/init.d/`
- 给予执行权限: `sudo chmod +x /etc/init.d/gogs`
- 检查gogs下的文件夹的权限: `ls -l` => 修改所有者: `sudo chown git:git log`
- centos中修改scripts/system/gogs.service: after的数据库只写mysqld.service(因为我们用的mysql...)
- 开机自启动: `sudo chkconfig gogs on`,取消: `sudo chkconfig gogs off`
- 启动服务: `sudo service gogs start`

- [配置介绍](https://gogs.io/docs/advanced/configuration_cheat_sheet)
- [常见问题](https://gogs.io/docs/intro/faqs)

## 步骤
- ./gogs/gogs就是所说的custom
- RUN_CROND=true 可以改 app.ini 也可以放环境变量?

- docker-compose up -d
- 访问 ip:port
- 设置
- 管理员 user pass email
- 设置hosts ip:port git.site.com

## 多仓库push
- git remote add gogs http://192.168.0.124:9999/username/repostry.git
- git push (git push gogs)

## git hook
> pre-receive,update,post-receive分别对应接收前,接收时,接收后三种状态，希望push代码后实现更新部署则会用到post-receive
- 修改自定义hook文件夹的用户: `chown -R git:git custom_hooks`
- 修改编译文件夹的权限: `chown -R git: git /home/deploy-registry && chmod -R 755 /home/deploy-registry`
```sh
#!/bin/sh
# 比较提交md5,看是否变化
while read oldrev newrev refname
do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    if [ "master" = "$branch" ]; then
        # Do something 或者 curl请求Jenkins
        if [ ! -d "/home/deploy-registry/web-admin" ]; then # 项目不存在，则clone
          git clone http://192.168.0.124:999/ruanjiayou/web-admin.git /home/deploy-registry
          echo "cloned"
        else 
          cd "/home/deploy-registry/web-admin"
          git fetch
          git pull
          echo "pulled"
        fi
        echo "test git hook deploy"
    fi
done
```

## docker启动
- docker-compose up -d
- 设置.数据库有 pg 的...
- 注册第一个账号
- 
## 备份
- 查看版本: `/app/gogs/gogs -v`
- 进入容器: `docker exec -ti gogs-git bash`
- 切换用户: `su - git`
- 备份: `/app/gogs/gogs backup --config /data/gogs/conf/app.ini --target /app/gogs/backups`
- 恢复: `/app/gogs/gogs restore --config /data/gogs/conf/app.ini --from /data/backups/gogs-backup.zip /tempdir=/data`.FATAL了还是恢复成功