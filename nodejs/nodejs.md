# nodejs

## 镜像测试接口

> docker-compose up -d --name project

## 安装环境

- `yum install epel-release`
- `yum install nodejs`

TODO: .env publish.sh dev.sh

## docker

> docker-compose up -d

## nvm

- 安装: `$ ./nvm.sh`, 或者`wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash`
- source ~/.bashrc
- 重进: `$ exit`
- nvm ls-remote
- nvm install/use v11.14.0
- 切换版本
  - `nvm use` 临时
  - `nvm alias default` 永久

## npm
- 查看可以升级的包: npm outdated [packageName](不指定包名则查看全局的)
## node-canvas

- `sudo yum install gcc-c++ cairo-devel libjpeg-turbo-devel pango-devel giflib-devel`
- `npm install canvas`
- font: `yum search arial`, `yum install liberation-sans-fonts.noarch`

## 问题

- 表单提交,request的formData的files字段长度为一的数组,到服务器就变字符串了
- Error: ENOSPC: System limit for number of file watchers reached, watch 看deepin
- referenceerror primordials is not defined
  > unzip2 引起的之前gulp出现过.换个unzip包就可以了
- `npm version` 能执行 `sudo npm` 报错没找到
  - 进入`/usr/bin`
  - `which npm`
  - `sudo ln -s pathtonpm`
  - node同上