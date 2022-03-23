#!/bin/bash
echo "1.打包后端代码: npm run build:prod"
npm run build:prod

OIFS=$IFS
IFS=$'\n'

newfile=""
versionLine=""

while read line
do
  if [[ $line = *"image:"* ]]
  then
    oldPrefix=${line:0:30}
    oldVersion=${line##*.}
    let version=$oldVersion+1
    echo "2.镜像tag版本号+1"
    versionLine=${oldPrefix}${version}
    newfile=${newfile}${versionLine}"\n"
  else
    newfile=${newfile}${line}"\n"
  fi
done < docker-compose.yml

# 去掉末尾的\n
len=${#newfile}-2
newfile=${newfile:0:len}

echo "3.修改docker-compose文件"
echo -e $newfile > docker-compose.yml

IFS=$OIFS
tag=${versionLine:6}
echo "4.创建镜像文件 ${tag}"
docker build -t $tag .

echo "5.启动镜像"
docker-compose up --scale contentservice=3 -d