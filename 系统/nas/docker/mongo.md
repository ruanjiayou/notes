## mongo
1. 修改了配置会删除镜像
2. 设置MONGO_INITDB_ROOT_USERNAME环境变量参数无效
3. 挂载默认的两个目录: `/data/db和/data/backup`
4. 启动容器后先创建超级用户: 
   ```shell
   mongo;
   use admin;
   db.createUser({user:"root",pwd:"123456",roles:[{role:"root",db:"admin"}]})
   db.auth("root","123456")
   ```

## mongo-express
- 设置mongo的账号密码
- 默认的mongo_url会覆盖其他链接配置ME_CONFIG_MONGODB_SERVER