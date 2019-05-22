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

## node-canvas

- `sudo yum install gcc-c++ cairo-devel libjpeg-turbo-devel pango-devel giflib-devel`
- `npm install canvas`
- font: `yum search arial`, `yum install liberation-sans-fonts.noarch`

## 问题

- 表单提交,request的formData的files字段长度为一的数组,到服务器就变字符串了