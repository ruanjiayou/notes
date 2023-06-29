# jenkins

## node项目编译
- `docker pull jenkins/jenkins`
- 进入服务器复制密码: `cat /var/jenkins_home/secrets/initialAdminPassword`
- 安装推荐的插件
- 创建管理员
- 选择url地址等待重启成功
- 首页 > 系统管理 > 插件管理 > 可选插件 > 搜索选中 NodeJS/docker-build-step/docker/version number > 安装完成后重启服务
- 安装node版本(首页 > 系统管理 > 全局工具工具配置 > NodeJS > 新增)
- 新建自由风格的项目
- 设置源码管理的git
- 添加全局账号密码
- 构建环境选择
- 构建 > 增加构建步骤 > 执行 shell
  ```sh
  npm i --registry https://registry.npmmirror.com
  npm run build
  tar zcvf dist.tar build/*
  tar -cvzf build.tar build/*
  tar xvzf build.tar -C dist --strip-components 1
  rm -rf /home/html/novel/* && cp ./build/* /home/html/novel/
  ```
- gogs设置请求的auth信息: jenkins用户列表给对应用户设置api token
[参考](https://juejin.cn/post/7067790095767568397)

## node项目打包镜像
- 在有docker环境的系统expose端口
  1. 修改daemon.json 添加hosts:["tcp://0.0.0.0:2375"],`netsh advfirewall firewall add rule name="docker_name" dir=in action=allow protocol=TCP localport=2375`
  2. ```
  $ docker pull alpine/socat
  $ docker run -d --restart=always \
      -p 0.0.0.0:2376:2375 \
      -v /var/run/docker.sock:/var/run/docker.sock \
      alpine/socat \
      tcp-listen:2375,fork,reuseaddr unix-connect:/var/run/docker.sock
  ```
- cloud配置: Docker Cloud detail => Docker Host URI => tcp://192.168.3.238:2376
- 自由风格项目
  - 源码管理: https://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@github.com/ruanjiayou/node-mongo-api.git
  - 构建环境: provide Node
  - build steps: build/publish docker image
    - $WORKSPACE
    - cloud: novel-api
    - image: ruanjiayou/node-novel-api
    - push image: 
    - clean local images: true
    - pull base image: true