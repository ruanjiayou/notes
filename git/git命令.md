# git使用

### git环境

### 基本命令
- 克隆项目: git clone url[#branch] [dirname]
- 查看修改: git status
- 比较分支: git diff branchA branchB
  - 忽略文件权限: git config core.fileMode false
- 切换到本地分支: git checkout dev
- 拉取远程分支到本地: git fetch origin dev
- 创建本地分支切换,并拉取远程: git checkout -b dev origin/dev
- 取消所有文件的修改: git checkout .
- 取消文件的修改: git checkout -- filepath
- 查看所有分支: git branch -a
- 拉取: git pull [remoteName] [localBranchName]
- 推送: git push [localBranchName] [remoteName]
- 修改: git remote set-url --push [name] [newUrl]
- 删除: git remote rm [name]
- 删除本地分支: git branch -d [name]
- 查看日志: git log
- 还原版本: git revert hash
- 变基: git rebase
- 回滚: git reset
- git stash ?
- git config 
- 打标签(不用记hash了): git tag tag_name
- 查看连接仓库情况: git remote -v
- 取消本地所有提交:git reset --hard origin/
- 
### 生成公匙和私匙
- cd ~/.ssh
- ssh-keygen -t rsa -C xxx.gmail.com
- 输入名称: id_rsa_site
- git-bash中断中,还要: 
  > eval "$(ssh-agent -s)"
  > ssh-add ~/.ssh/id_rsa_site
  - ubantu中要ssh-add,但还是不行
- git config user.name "xx"
- git config user.email "xx"
- 仓库中加ssh密钥,不是authoizations加

### centos免密码登录
- ~~生成公匙(要设置passphrase): ssh-keygen -t rsa -C xxx@gmail.com~~
- ssh-keygen -t ecdsa -b 521 -C "your_email@example.com"
- 编辑配置
  > .ssh/config
  ```
  Host 别名
  HostName ip或域名
  Port 22
  User root
  IdentityFile ~/.ssh/id_rsa.pub
  IdentitiesOnly yes
  ```
- ssh-copy-id -i ~/.ssh/id_rsa_baidu.pub baidu
- ssh baidu
- 问题:
  ```
  vim /etc/selinux/config 修改disabled为enforcing,重启
  restorecon -r -vv /root/.ssh 修复tag,重启
  setenforce 0
  ```

### 修改ssh端口
- 添加测试端口: `vim /etc/ssh/sshd_config` => 添加 Port 22222
- 查看防火墙状态: `systemctl status firewalld`
- 启动防火墙: `systemctl start firewalld`
- 防火墙添加端口: `firewall-cmd --zone=public --add-port=22222/tcp --permanent`
- 查看开放端口: `firewall-cmd --list-ports`
- 查看单个端口: `firewall-cmd --zone=public --query-port=80/tcp`
- 添加selinux的semanage
    - `yum install policycoreutils-python`
    - `yum provides semanage`
- 查看ssh开放端口: `semanage port -l | grep ssh`
- 添加ssh端口: `semanage port -a -t ssh_port_t -p tcp 22222`
- 配置sshd?
- 重启sshd: `service sshd restart`
- 安装netstat: yum install net-tools

### 多账号问题
> git多账号登录问题: https://www.jianshu.com/p/0ad3d88c51f4
- 使用ssh方式就不用管window的凭据了
- 生成id_rsa(名字自取)
- 配置~/.ssh/config
- 根据config的host别名clone: git clone git@customHost:usernamexxx/project.git
- 配置git config user.name和user.email
- push => ok 

### Windows下每次都要ssh-add
- 进入git的安装目录
- `vim etc/bash.bashrc`
  ```bash
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_rsa
  ```

### Windows vscode设置默认bash终端
- 环境变量添加 C:\Program Files (x86)\Git\bin\bash.exe
- 添加"terminal.integrated.shell.windows": "C:\Program Files (x86)\Git\bin\bash.exe"

### 配置(global和local)
- git config --global user.name "xxx"
- git config --global user.email "xxx@gmail.com"
- git config --global --list
- git config --list

### 把本地项目推到远程仓库
```bash
git init // 初始化版本库
git add . // 添加文件到缓存区
git commit -m "init" // 提交
//取消没push的commit git reset --soft HEAD~1

git remote add origin 仓库地址 // 把本地与远程库关联 http://host/user/repo-name
git pull/push -u origin master // 第一次拉取/推送
git pull/push master // 后续
```

### rebase冲突
`Git: You have not concluded your merge (MERGE_HEAD exists)`
```bash
git merge --abort
git reset --merge
git reset <commit> (--hard)
// 双方修改一样,两个都需要保留,解决冲突后再改
git pull
git push
```

### 设置取消代理
`git config --global http.proxy 127.0.0.1:7890`
`git config --global --get http.proxy`
`git config --global --unset http.proxy`

### 取消本地commit但未push的
- `git reset --soft HEAD~1`
### 删除本地 commit 但未 push的
- `git reset --hard HEAD~1`
### 删除历史commit(密码等敏感记录)
- 删除最近一个commit: `git reset --hard HEAD~1` => `git push --force`
- 切换新分支: git checkout --orphan temp (空的)
- 删除主分支: git branch -D master
- 添加文件: git add -A
- 入库: git commit -am "xxx"
- 重命名分支: git branch -m master
- 强行提交: git push -f origin master

### 合并多个commit为一条
- git merge --squash bacnchname
- git commit -m "test squash"

### Permissions 0664/0777are too open
- chmod 600 ~/.ssh/id_rsa (默认700？)

### exec /usr/lib/ssh/ssh-askpass : No such file or directory error
- sudo apt-get autoremove git
- sudo apt-get install git
- git push

### SHA-1, which is no longer allowed
- 
### 参考文章
- https://git-scm.com/book/zh/v2
- http://gitref.justjavac.com/
- https://blog.csdn.net/ithomer/article/details/7529022

### fatal: detected dubious ownership in repository at
- git config --global --add safe.directory dirtoproject

### 自定义域名
- 需要github page上设置要解析的域名。不然dns设置的不生效
- 关于test子域名，TXT类型和CNAME的冲突。改为CNAME的简单可靠。