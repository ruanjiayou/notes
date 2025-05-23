## docker-compose
- https://dev.mysql.com/doc/refman/5.7/en/environment-variables.html
- env https://hub.docker.com/_/mysql
-   MYSQL_ROOT_PASSWORD
-   MYSQL_DATABASE
-   MYSQL_USER, MYSQL_PASSWORD
-   MYSQL_ALLOW_EMPTY_PASSWORD
-   MYSQL_RANDOM_ROOT_PASSWORD
-   MYSQL_ONETIME_PASSWORD

## 触发器
```
事件触发器: 不如写在业务逻辑中
时间触发器: 如下
#开启定时器：要使event起作用，MySQL的常量GLOBAL event_scheduler必须为ON或者是1

#（1）查看是否开启定时器
SHOW VARIABLES LIKE 'event_scheduler';

#（2）开启定时器 0：off 1：on
SET GLOBAL event_scheduler = 1;

#（3）开启event_scheduler SQL指令
SET GLOBAL event_scheduler = ON;  
SET @@global.event_scheduler = ON;  
SET GLOBAL event_scheduler = 1;  
SET @@global.event_scheduler = 1;

#（4）定义存储过程
DELIMITER |
DROP PROCEDURE IF EXISTS update_invitation |
CREATE PROCEDURE update_invitation()
BEGIN
  update invitation set `status`='success' where status='pending' and UNIX_TIMESTAMP() > UNIX_TIMESTAMP(startAt)+ 3600;
END
  |  
DELIMITER;
#（5）创建定时器，每间隔一秒调用一次存储过程
DELIMITER //  
CREATE EVENT  event_update_invitation
ON SCHEDULE EVERY 1 second  do  
begin  
call update_invitation();  
end //  
DELIMITER;  

#（6）启动定时器
ALTER EVENT update_invitation ON    
COMPLETION PRESERVE ENABLE; 

#Navicat 只看到创建定时器,没见到定义的存储过程 网上说是定义 函数那里
CREATE DEFINER=`root`@`%` PROCEDURE `update_invitation`()
BEGIN
  update invitation set `status`='success' where status='pending' and UNIX_TIMESTAMP() > UNIX_TIMESTAMP(startAt)+ 3600;
END
#定义
begin  
  call update_invitation();  
end
#计划
EVERY 1 seconds
STARTS 2018-08-20 14:44:54
```

## 常用语法
- 导入sql文件: `mysql -uname -ppass -D db < filetosql`(-u -p 后面不留空格,要先创建表)
```SQL
CREATE TABLE `profile_infos` (
  `id` varchar(36) NOT NULL,
  `account_id` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `res_type` varchar(50) NOT NULL,
  `res_id` varchar(50) NOT NULL,
  `res_info` text CHARACTER SET utf8 COLLATE utf8_general_ci,
  `res_state` int(10) DEFAULT NULL,
  `act_time` date DEFAULT NULL,
  `act_ip` varchar(50) DEFAULT NULL,
  `act_plat` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`) USING BTREE,
  KEY `type` (`type`),
  KEY `res_type` (`res_type`),
  KEY `res_id` (`res_id`),
  KEY `act_time` (`act_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户记录表';
```
- 批量修改字段:
  ```sql
  update profile_infos set tag_name=REPLACE(tag_name,"-","")
  update profile_infos set tag_name=CONCAT("dyh_", tag_name)
  ```
## 常见问题
- 1045 access denied for user 'root'@'localhost' using password yes
  - 修改my.ini 
  - [mysqld]下加: `skip_grant_tables`
  - mysql 回车
  - use mysql;
  - *修改密码: `update user set password=password("123456") where user="root"`;
  - 刷新权限: `flush privileges;`
  - 退出重启mysql: `service mysql restart`
  - 开启远程访问: ?
    ```sh
    mysql -u root -p;
    use mysql;
    alter user 'root'@'localhost' identified with mysql_native_password by '123456';
    flush privileges;
    ```
    > docker必须要局域网ip...
- 2095- Authentication plugin 'caching_sha2_password' cannot be loaded
  > 进入数据库: `alter user 'root'@'%' identified with mysql_native_password by 'xxxxx'`
- Table flags are 0 in the data dictionary but the flags in file ./ibaredata1
  > window里可以到C:\Users\username\Documents\Kitematic\mysql-demo\var\lib\mysql 删除文件
  > ip是192.168.99.100
- docker mysql mysqld: Error on realpath() on '/var/lib/mysql-files' No such file or directory
  > 在启动容器时 需要加上 -v /home/mysql/mysql-files:/var/lib/mysql-files/
- Client does not support authentication protocol requested by server; consider upgrading MySQL client
  > 

## 死锁
> 两个事务互相等待对方释放锁,MySQL 检测到死锁后，会中止其中一个事务，返回 ER_LOCK_DEADLOCK

### 原因
- 并发请求同时更新相同的行
- update 语句 where 条件不是主键或唯一索引，导致行锁升级为表锁或范围锁(用4个字段 (type, res_type, res_id, account_id) 做 where，虽然这可能是联合索引，但不是主键，仍可能锁多行或范围)
- 缺少合适的唯一索引或主键导致锁粒度太大(没有唯一约束，MySQL 会加 间隙锁（gap lock） 或 范围锁)
- InnoDB 的行锁是基于索引的

### 联合索引
- WHERE 子句连续命中索引前缀，跳过字段仅用于排序/返回时不会阻断过滤: 索引(account_id, type, res_id, res_type, act_time) where查询 account_id,type,res_type,排序用act_time,没问题.但如果 where 查询 account_id,type,res_type,act_time 这样不行,
### 普通联合索引改为唯一联合索引
> ALTER TABLE profile_infos; ADD UNIQUE KEY uniq_account_type_resid (account_id, type, res_id, res_type, act_time);
- 1.批量操作更方便快捷 2.避免出现锁
- 需要先删除重复数据,然后建新索引,最后删除旧索引

## 回表
> 性能与空间的权衡,要考虑回表是否可以接受
最佳实践
- 查询记录少（LIMIT 小）回表可接受
- 查询字段很大,字段不加索引允许回表
- 高频接口尽量覆盖索引不回表

## 性能分析 explain
1. 返回字段

  | 字段名          | 含义                                                                                                          |
  | --------------- | ------------------------------------------------------------------------------------------------------------- |
  | `id`            | 查询中语句的标识符，越大表示越先执行（多表 JOIN 时很关键）                                                    |
  | `select_type`   | 查询的类型，比如 SIMPLE（简单查询）、PRIMARY（外层查询）、SUBQUERY（子查询）等                                |
  | `table`         | 当前访问的表名或临时表名                                                                                      |
  | `partitions`    | 查询扫描的分区（如果用了分区表）                                                                              |
  | `type`          | 连接类型，表示访问表的方式，性能从好到差为：`system` > `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` |
  | `possible_keys` | 查询中可能会使用的索引列表（推荐的索引）                                                                      |
  | `key`           | 实际使用的索引名称（如果没用到索引，这里是 NULL）                                                             |
  | `key_len`       | 实际使用的索引长度（字节），可用于判断是否使用了联合索引中的全部字段                                          |
  | `ref`           | 哪个列或常量与索引进行了比较，比如 `const`、`func`、`table.column`                                            |
  | `rows`          | MySQL 估算要读取的行数（越少越好）                                                                            |
  | `filtered`      | 表示符合条件的行数百分比（估算值），配合 `rows` 可以估算最终输出行数                                          |
  | `Extra`         | 附加信息，比如：是否使用文件排序、是否回表、是否使用索引等                                                    |
2. type

  | type     | 说明                                           |
  | -------- | ---------------------------------------------- |
  | `system` | 表只有一行，性能最佳                           |
  | `const`  | 表示主键或唯一索引匹配常量，最多返回一条记录(无需计算和转换)   |
  | `eq_ref` | 用于 JOIN 操作中，主键或唯一索引匹配，返回单行 |
  | `ref`    | 非唯一索引扫描，返回多行                       |
  | `range`  | 范围扫描，如 `BETWEEN`、`>`、`<`、`IN()`       |
  | `index`  | 全索引扫描（不查表），可能是覆盖索引           |
  | `ALL`    | 全表扫描，性能最差                             |
3. extra

  | Extra 值                                              | 含义                                       |
  | ----------------------------------------------------- | ------------------------------------------ |
  | `Using where`                                         | 有 WHERE 过滤条件                          |
  | `Using index`                                         | 使用了覆盖索引（不需回表）                 |
  | `Using index condition`                               | 用了索引，但部分字段还需回表               |
  | `Using filesort`                                      | 用于排序时未使用索引（⚠️性能差）            |
  | `Using temporary`                                     | 用了临时表（多见于 GROUP BY）              |
  | `Range checked for each record`                       | 没有合适索引，尝试对每行使用 range，性能差 |
  | `Impossible WHERE noticed after reading const tables` | 条件永远不成立                             |
## show index
| 字段名             | 含义说明                                                                            |
| --------------- | ------------------------------------------------------------------------------- |
| `Table`         | 表名。                                                                             |
| `Non_unique`    | 是否唯一索引： `0` 表示唯一索引（`UNIQUE`） `1` 表示非唯一索引                              |
| `Key_name`      | 索引名称（包括主键索引 `PRIMARY`）。                                                         |
| `Seq_in_index`  | 列在索引中的顺序（从 1 开始）。                                                               |
| `Column_name`   | 被索引的列名。                                                                         |
| `Collation`     | 索引的排序方式： `A`：升序（Ascending） `D`：降序（Descending） `NULL`：不排序（例如全文索引） |
| `Cardinality`   | 该列的唯一值估算数量（基于统计信息，用于优化器判断索引是否高效）。                                               |
| `Sub_part`      | 如果是前缀索引，这一列表示索引的字符数。`NULL` 表示不是前缀索引。                                            |
| `Packed`        | 索引是否压缩（压缩算法），`NULL` 表示未使用压缩。                                                    |
| `Null`          | 该列是否可以为 `NULL`。                                                                 |
| `Index_type`    | 索引类型： `BTREE`（默认） `FULLTEXT` `HASH` 等                            |
| `Comment`       | 索引注释（比如某些类型索引的描述信息）。                                                            |
| `Index_comment` | 建立索引时附加的 `COMMENT 'xxx'`。                                                       |
