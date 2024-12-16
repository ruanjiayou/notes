#mongodb

- 启动：`docker-compose up -d`
- 

## 安装
- mac: brew install mongo
- centos: vim /etc/yum.repos.d/mongodb-org-4.0.repo
  > 安装在 /var/lib/mongo
  ```
  [mongodb-org-4.0]
  name=MongoDB Repository
  baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.0/x86_64/
  gpgcheck=1
  enabled=1
  gpgkey=https://www.mongodb.org/static/pgp/server-4.0.asc
  ```
  > sudo yum install -y mongodb-org
- which mongorestore
- window10 https://www.mongodb.com/what-is-mongodb 下载
- C:\Program Files\MongoDB\Server\4.2\bin 
  - mongo.exe启动
  - mongod.exe命令行 mongod --version
  - 连接: 127.0.0.1:27017(默认无账号密码)

## 备份与还原
- mongodump参数
  - 显示日志详情: -v, -vvvv, --verbose=<level>
  - 不显示日志: --quiet
  - 地址: -h --host=<hostname>
  - --ssl
  - --sslCAFile=<filename>
  - --sslPEMKeyFile=<filename>
  - --sslPEMKeyPassword=<password>
  - --sslCRLFile=<filename>
  - tlsInsecure
  - 指定验证库: --authenticationDatabase=<database-name>
  - 指定验证机制: --authenticationMechanism=<mechanism>
  - -d --db 指定库名
  - -c --collection=<collection-name> 指定集合
  - -q --query='{"nth":{"$gt":1}}'
  - --queryFile=
  - -o --out=<directory>
  - --gzip 压缩备份文件
  - --oplog 备份oplog完成一致性快照备份
  - --archive=<file-path> 不能和-o同时使用
  - --dumpDbUsersAndRole
  - --excludeCollection=<collection> 可以多个
- mongorestore参数
  - --drop 
  - --stopOnError
  - --noIndexRestore
  - --objcheck 插入前检查记录有效性
  - --oplogReplay 恢复数据后重放oplog
  - --oplogFile=<filepath>
  - --archive=<filepath>
  - --restoreDbUsersAndRoles
  - --dir
  - --gzip
- docker exec -ti mongo-demo bash
> 写了个shell, 加权限`chmod u+x`, 执行`cmd.sh dump db`
- 备份整个库： `mongodump -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test -o /data/backup`
- 备份单个表：`mongoexport -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test --collection test -o /data/backup/test/test.json`
- 还原整个库：`mongorestore -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test /data/backup/test`
- 还原单个表：`mongoimport -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test --collection test --file /data/backup/test/test.json`

## 复制数据库
- 

## 用户管理
- 创建用户
  ```js
  mongo
  use admin  // (如果是在当前数据库,这链接无需 authSource 选项)
  db.auth("root","123456")
  db.createUser({user:"test",pwd:"123456",roles:[{role:"readWrite",db:"test"}]})
  ```
- 创建管理员, `roles: [ { role: "userAdminAnyDatabase", db: "admin"} ]` 对所有数据库进行管理
- 删除用户, `db.dropUser("test")`
- 角色类型
  ```
  数据库用户角色
      read: 只读数据权限
      readWrite:学些数据权限
  数据库管理角色
      dbAdmin: 在当前db中执行管理操作的权限
      dbOwner: 在当前db中执行任意操作
      userADmin: 在当前db中管理user的权限
  备份和还原角色
      backup
      restore
  夸库角色
      readAnyDatabase: 在所有数据库上都有读取数据的权限
      readWriteAnyDatabase: 在所有数据库上都有读写数据的权限
      userAdminAnyDatabase: 在所有数据库上都有管理user的权限
      dbAdminAnyDatabase: 管理所有数据库的权限
  集群管理
      clusterAdmin: 管理机器的最高权限
      clusterManager: 管理和监控集群的权限
      clusterMonitor: 监控集群的权限
      hostManager: 管理Server
  超级权限
      root: 超级用户
  ```

## 索引
> [参考](https://mongoing.com/eshu_explain1)
- explain三种模式
  - queryPlanner模式下并不会去真正进行query语句查询，而是针对query语句进行执行计划分析并选出winning plan
  - executionStats
  - allPlansExecution
- stage(如explain.queryPlanner.winningPlan.stage和explain.queryPlanner.winningPlan.inputStage等)
  - 全表扫描: COLLSCAN
  - 索引扫描: IXSCAN
  - 根据索引查找文档: FETCH
  - SHARD_MERGE
  - SORT
  - LIMIT
  - SKIP
  - IDHACK
  - SHARDING_FILTER
  - COUNT
  - COUNTSCAN
  - COUNT_SCAN
  - SUBPLA
  - PROJECTION
- _id
  - 默认ObjectId: 
  - uuid: 字符串更长,数据量大时插入效率降低

## 问题
- server returned error on SASL authentication step: Authentication failed.
  > 加 `--authenticationDatabase admin`
- WiredTiger "handle-open: open: File exists" error when using NFS persistent storage
  > 挂载目录问题.注释db目录启动.去掉注释重新启动
## 参考
- 官方文档：https://docs.mongodb.com/manual/reference/configuration-options/
- 配置参考： https://www.jianshu.com/p/f179ce608391

数据库备份
docker exec -ti mongo-demo bash
cd /data/backup
mongodump -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d novel -o /data/backup/2019-12-29
rsync -vzrtopg --progress /mnt/codes/projects/notes-gogs/mongo/backup/2019-12-29/ root@baidu:/home/notes/mongo/backup/2019-12-29
数据库还原
docker exec -ti mongo-demo bash
mongorestore -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d novel /data/backup/2019-12-29/novel
pwa构建
rsync -vzrtopg --progress --exclude='build/workbox-v4.3.1' ./build/ root@baidu:/home/web-novel/build/ 