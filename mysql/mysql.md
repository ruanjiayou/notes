## docker-compose
- https://dev.mysql.com/doc/refman/5.7/en/environment-variables.html
- env https://hub.docker.com/_/mysql
-   MYSQL_ROOT_PASSWORD
-   MYSQL_DATABASE
-   MYSQL_USER, MYSQL_PASSWORD
-   MYSQL_ALLOW_EMPTY_PASSWORD
-   MYSQL_RANDOM_ROOT_PASSWORD
-   MYSQL_ONETIME_PASSWORD

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