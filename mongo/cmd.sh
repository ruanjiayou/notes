#! /bin/sh
t=$(date "+%Y-%m-%d")
dump() {
  echo "备份数据库: $1"
  mongodump -d $1 -o backup/$t
}
store() {
  echo "还原数据库: $1"
  mongorestore -d test-$1 backup/$t/$1
}
exports() {
  echo "备份数据库.表: $1"
}
import() {
  echo "还原数据库.表: $1"
}

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