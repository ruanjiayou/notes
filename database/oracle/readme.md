# oracle

## docker 部署
```yml
version: '3.0'

services:
  oracle:
    image: container-registry.oracle.com/database/enterprise:19.3.0.0
    container_name: oracle-db
    # user: "${UID}:${GID}"
    restart: always
    ports:
      - "1521:1521"
      - "5500:5500"
    volumes:
      - ./data/:/opt/oracle/oradata
    environment:
      - ORACLE_SID=ORCLCDB
      - ORACLE_PDB=dbname
      - ORACLE_PWD=password
      - ORACLE_CHARACTERSET=AL32UTF8
```
- 官网注册
- 找到 database oracle 企业版 并同意协议
- `docker login container-registry.oracle.com` , `docker pull container-registry.oracle.com/database/enterprise:19.3.0.0`
- 进入容器
  ```sh
  $ docker exec -it oracle-db bash
  $ sqlplus / as sysdba
  ```
- 连接测试
  > host: 10.0.15.240 (测试服务器的局域网地址)
  > port: 1521
  > service_name/SID: yml文件的环境变量ORACLE_SID的设置
  > 账号: sys (默认)
  > 密码: yml文件的环境变量ORACLE_PWD设置的密码
  > 角色: sysdba/
## 操作
- 创建用户
  - 按前面方式进入容器
  - 打开状态: `ALTER PLUGGABLE DATABASE pdb_name OPEN;`
  - 连接到PDB: `CONNECT SYS@pdb_name AS SYSDBA;`
  - 创建用户: `CREATE USER username IDENTIFIED BY password;`
  - 授予权限: `GRANT CREATE SESSION TO username;GRANT CREATE TABLE TO username;GRANT RESOURCE TO username;`

- 显示所有表: `select table_name from user_tables`

CREATE TABLE employees (
  id NUMBER,
  name VARCHAR2(50),
  department VARCHAR2(50)
);


INSERT INTO employees VALUES (1, 'alice', 'HR');


CREATE USER dymamdb34 IDENTIFIED BY dymamdb34 DEFAULT TABLESPACE users TEMPORARY TABLESPACE temp;
GRANT CREATE SESSION, CREATE TABLE, UNLIMITED TABLESPACE TO dymamdb34;
