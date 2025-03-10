#! /bin/sh
t=$(date "+%Y-%m-%d")
dump() {
  echo "备份数据库: $1"
  mongodump -u root -p 123456 --authenticationDatabase admin -d $1 -o /data/backup/$t
}
store() {
  echo "还原数据库: $1"
  mongorestore -u root -p 123456 --authenticationDatabase admin -d $1 /data/backup/$t/$1
}
exports() {
  echo "备份数据库.表: $1"
}
import() {
  echo "还原数据库.表: $1"
}

# sh cmd.sh dump novel

#read -p "请输入命令和path: " operation name
operation=$1
name=$2
case $operation in
  "dump"|"d") 
    dump $name
  ;;
  "store"|"s")
    store $name
  ;;
  "export"|"e")
    exports $name
  ;;
  "import"|"i")
    import $name
  ;;
  *)
    echo "$operation 命令不存在!"
  ;;
esac