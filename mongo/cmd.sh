#! /bin/sh
dump() {
  echo "备份数据库: $1"

}
store() {
  echo "还原数据库: $1"
}
export() {
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
    export $name
  ;;
  "import"|"i")
    import $name
  ;;
  *)
    echo "$operation 命令不存在!"
  ;;
esac