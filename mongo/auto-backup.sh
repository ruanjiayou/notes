#!/bin/bash
DIR=/data/backup #备份目录

DATE=`date +%Y_%m_%d` #获取当前系统时间

# mkdir -p $DIR/$DATE

cd $DIR

mongodump -u root -p 123456 --authenticationDatabase admin -o $DIR/$DATE #备份全部数据库

echo $DATE" backup success" >> backup.log

# crontab -e 0 0 6 * * ? /data/auto-backup.sh