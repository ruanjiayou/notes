# redis

- 简单启动: `docker run --name redis-demo --restart always -p 6379:6379 -d redis:alpine`
- 主从集群(哨兵模式) http://www.cnblogs.com/vipzhou/p/8580495.html
- 注意事项

redis集群
1. 启动3个redis
  ```basn
    docker run --name redis-master -p 6379:6379 -d redis:alpine
    docker run --name redis-slave1 -p 6378:6379 -d redis:alpine
    docker run --name redis-slave2 -p 6377:6379 -d redis:alpine
  ```
2. 查看redis的ip
   > docker inspect #id 
3. 进入容器
  ```bash
    docker exec -ti #id sh  #sh bash /bin/bash
    redis-cli
    info replication
    slaveof 172.17.0.2 6379 #只在两个从机中设置
  ```
4. master中 `set hot 1` 两个slave会同步
5. 在三个redis上设置哨兵模式
  ```bash
    docker exec -ti #id sh  #sh bash /bin/bash
    cd / && vim /etc/redis/sentinel.conf
    > sentinel monitor mymaster 172.17.0.2 6379 1
    redis-sentinel /etc/redis/sentinel.conf  #启动哨兵
  ```
6. 验证。关闭主机
7. 查看2台从机有一个变为了主机
8. 启动关闭的主机,会变为从机

注意事项
- .yml中使用环境变量,默认test: `image: ${xxx:-test}`
- CMD中使用: `"$xxx"`
- --link的理解 env与etc/host的方式 https://www.jianshu.com/p/21d66ca6115e
- 关于redis-cluster中使用pipeline和multi(): All keys in the pipeline should belong to the same slot
  > test:key:{butOnlyThis}redis
- 密码不对,连上redis后执行命令会没有返回也没有报错

## redis命令
- 键(key)
  - `del key`: key存在时删除key
  - `dump key`: 序列化给定key，并返回被序列化的值
  - `exists key`: 检查给定key是否存在
  - `expire key seconds`: 为给定key设置过期时间
  - `expireat key timestamp`: UNIX时间戳
  - `pexpire key milliseconds`: 设置key的过期时间以毫秒计
  - `pexpireat key millseconds-timestamp`: 设置key过期时间的时间戳(unix timestamp) 以毫秒计
  - `keys pattern`: 查找所有符合给定模式的key
  - `move key db`: 将当前数据库的key移动到给定的数据库 db 当中
  - `persist key`: 移除key的过期时间,key将持久保持
  - `pttl key`: 以毫秒为单位返回key的剩余的过期时间
  - `ttl key`: 以秒为单位,返回给定key的剩余生存时间
  - `rename key newkey`: 修改key的名称
  - `renamex key newkey`: 仅当key存在时修改
  - `type key`: 返回key存储的类型
- 字符串(string)

- 哈希(hash)

- 集合(set)

- 有序集合(sorted set)

- 列表(list)
  - llen: 获取列表长度
  - lindex: 通过索引获取列表中的元素.`lindex 1`
  - linsert: 将值 value 插入到列表 key 当中，位于值 pivot 之前或之后。
  >`linsert key before|after pivot value`
  - lpush: 将一个或多个值插入到列表头部。返回操作后的列表长度
  >`lpush key one two three`
  - lpushx: 将一个值插入到已存在的列表头部，列表不存在时操作无效。
  - lpop: 移出并获取列表的第一个元素.不存在时返回nil
  - lset: 通过索引设置列表元素的值.`lset key index value`
  - ltrim: 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除
  >`ltrim key start top`
  - lrem: 根据参数COUNT的值,移除列表中与参数VALUE相等的元素.`lrem key count value`
  ```
  count > 0 : 从表头开始向表尾搜索，移除与 VALUE 相等的元素，数量为 COUNT
  count < 0 : 从表尾开始向表头搜索，移除与 VALUE 相等的元素，数量为 COUNT 的绝对值
  count = 0 : 移除表中所有与 VALUE 相等的值
  ```
  - lrange: 返回列表中指定区间内的元素，区间以偏移量START和END指定.[START,...,END]
  - rpush: 将一个或多个值插入到列表的尾部(最右边),如果列表不存在，一个空列表会被创建并执行 RPUSH 操作。 当列表存在但不是列表类型时，返回一个错误。返回操作后的列表长度
  >`rpush key one two three`
  - rpushx: 为已存在的列表添加值.`rpush key value`
  - rpop: 移除列表的最后一个元素，返回值为移除的元素.`rpop key`
  - rpoplpush: 移除列表的最后一个元素，并将该元素添加到另一个列表并返回.lpoplpush source destination
  - blpop
  - brpop
  - brpoplpush
  - ZREMRANGEBYRANK key start stop 删除多余的
  
## 发布订阅
- subscribe [channel ...] 订阅频道
- publish channel "msg" 发布消息
- psubscribe news.* 订阅符合模式的频道
- unsubscribe punsubscribe 取消订阅
- 没有应答机制,没有提供持久化功能有丢失风险,广播机制消费能力取决下游本身
- Redis的订阅只是基本需求,需要高可靠性用RabbitMQ,高吞吐量用kafka(elk日志) 

## window版设置
- 进入redis目录: `cd C:\Program Files\Redis`
- 先卸载服务: `redis-server.ext --service-uninstall`
- 修改 redis.windows.conf 和 redis.windows-service.conf 的 requirepass
- 注册服务 `redis-server.exe --service-install redis.windows-service.conf`
- 启动服务 `redis-server.exe --service-start`
- 测试连接