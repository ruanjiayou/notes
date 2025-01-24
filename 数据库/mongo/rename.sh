#!/bin/bash

# 检查输入参数
echo "命令使用: $0 --old <old_database_name> --new  <new_database_name> --user <username> --pass <password>"

# 输入参数
OLD_DB_NAME=""  # 第一个参数，旧数据库名称
NEW_DB_NAME=""  # 第二个参数，新数据库名称
MONGO_HOST="localhost"           # MongoDB 主机地址
MONGO_PORT="27017"               # MongoDB 端口
BACKUP_PATH="/data/backup"  # 备份文件存储路径
MONGO_USER="root"
MONGO_PASS="123456"

# 参数解析
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --old) OLD_DB_NAME="$2"; shift ;;  # 旧数据库名称
    --new) NEW_DB_NAME="$2"; shift ;;  # 新数据库名称
    --user) MONGO_USER="$2"; shift ;;  # 用户名（可选）
    --pass) MONGO_PASS="$2"; shift ;;  # 密码（可选）
    *) echo "Unknown parameter passed: $1"; exit 1 ;;
  esac
  shift
done

# 构造 MongoDB 连接认证参数
AUTH_PARAMS=""
if [[ -n "$MONGO_USER" && -n "$MONGO_PASS" ]]; then
  AUTH_PARAMS="--username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin"
fi

# 创建备份目录
mkdir -p $BACKUP_PATH

echo "Step 1:  备份旧数据库: $OLD_DB_NAME..."
mongodump --host $MONGO_HOST --port $MONGO_PORT $AUTH_PARAMS --db $OLD_DB_NAME --out $BACKUP_PATH

if [ $? -ne 0 ]; then
  echo "错误: 备份数据库失败 $OLD_DB_NAME. 脚本终止."
  exit 1
fi

echo "备份完成. 文件存储在 $BACKUP_PATH."

echo "Step 2: 删除旧数据库: $OLD_DB_NAME..."
mongo $MONGO_HOST:$MONGO_PORT $AUTH_PARAMS --eval "db.getSiblingDB('$OLD_DB_NAME').dropDatabase()"

if [ $? -ne 0 ]; then
  echo "错误: 删除数据库失败 $OLD_DB_NAME. 脚本终止."
  exit 1
fi

echo "旧数据库 $OLD_DB_NAME 已删除."

echo "Step 3: 恢复到新数据库: $NEW_DB_NAME..."
mongorestore --host $MONGO_HOST --port $MONGO_PORT $AUTH_PARAMS -d $NEW_DB_NAME "$BACKUP_PATH/$OLD_DB_NAME"

if [ $? -ne 0 ]; then
  echo "错误: 恢复到数据库失败 $NEW_DB_NAME. 脚本终止."
  exit 1
fi

echo "数据库重命名成功 from $OLD_DB_NAME to $NEW_DB_NAME."

echo "Step 4: 清除备份文件..."
rm -rf "$BACKUP_PATH/$OLD_DB_NAME"

if [ $? -ne 0 ]; then
  echo "错误: 删除备份文件失败. 请检查权限."
  exit 1
fi

echo "备份文件已删除. 操作完成."
