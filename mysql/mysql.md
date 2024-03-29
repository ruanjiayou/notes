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