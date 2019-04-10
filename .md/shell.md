参考: http://www.runoob.com/linux/linux-shell-variable.html

- 开头: #!/bin/bash
- 变量: varial=''
  - 只读变量: `readonly varial`
  - 删除变量: `unset varial`

- 数组: arr=(a b "c" d)
  ```sh
  arr[1]='a'
  echo ${arr[1]}
  ```
- 运算符: + - * / % = == !=
  ```sh
  # 加
  val=`expr 2 + 2`
  echo 'sum is: $val'

  a=10
  b=20
  val=`expr $a \* $b`
  ```
- 关系运算符: -eq -ne -gt -it -ge -le -o ! -a && || 
- 字符串运算符: = != -z -n $
- 文件测试运算符: -b -c -d -f -g -k -p -u -r -w -x -s -e
- read:
  - -p 提示文字
  - -n 长度限制(自动结束)
  - -t 输入限时
  - -s 隐藏输入内容
- 读取一行: 
  ```sh
  read name
  echo "name is $name"
  ```
- echo
  - 显示换行: `echo -e "ok \n"`
  - 输出后不换行: `echook -e \c`
  - 输出到文件: `echo "Hello World!" > myfile`
  - 原样输出字符串: `echo '$name\"'`
  - 显示命令执行: 
    > echo `date`
  ```
        能否引用变量 能否引用转移符 能否引用文本格式符
  单引号     否          否            否
  双引号     能          能            能
  无引号     能          能            否
  ```
- 条件
  ```sh
  if [ $a == $b ]
    then
      echo 'a 等于 b'
    else
      echo 'a 不等于 b'
  fi
  ```
- 循环
  ```sh
  for i in "$@";
    do
      echo $i
    done

  while condition
    do
      echo ""
    done

  until condition
    do
      echo
    done

  # break continue
  case $val in
    $v1) echo ""
    ;;
    $v2) echo ""
    ;;
    *) echo ""
    ;;
    ```
  esac
- 命令行参数: 
  - 执行文件名: $0
  - 第一个参数: $1
  - 参数个数: $#
  - 参数字符串: $*
  - 进程ID: $$
  - $@ 与 $* 相同,但参都用引号括起来
- 函数
  ```sh
  add() {
    read a
    read b
    return $(($a+$b))
  }
  add()
  echo "sun is : $?"
  ```
- var1 = 'cd /home;echo "hello"'
- echo ${var1}|awk '{run=$0;system(run)}'

## window 自定义git-bash命令相关操作
> 添加
- 在~/bin/中: `vim xx.sh << echo 'test'`
- 执行: `alias custom='bash ~/bin/xx.sh'`
- 测试: `custom`
> 删除
- unalias custom