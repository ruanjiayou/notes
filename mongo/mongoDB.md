#mongodb

- 启动：`docker-compose up -d`
- 

### 备份与还原
> 写了个shell, 加权限`chmod u+x`, 执行`cmd.sh dump db`
- 备份整个库： `mongodump -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test -o /data/backup`
- 备份单个表：`mongoexport -u root -p 123456 -h 127.0.0.1 -d test --authenticationDatabase admin --collection test -o /data/backup/test/test.json`
- 还原整个库：`mongorestore -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test /data/backup/test`
- 还原单个表：`mongoimport -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d test --collection test --file /data/backup/test/test.json`

### 复制数据库
- 

## 问题
- server returned error on SASL authentication step: Authentication failed.
  > 加 `--authenticationDatabase admin`

## 参考
- 官方文档：https://docs.mongodb.com/manual/reference/configuration-options/
- 配置参考： https://www.jianshu.com/p/f179ce608391