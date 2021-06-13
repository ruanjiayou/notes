# nodejs


## 模块机制与加载机制
- 每个文件都是一个模块,有id,exports,parent,filename,loaded,children属性
- 有缓存读缓存,没有就判断是否是内置,是就加载内置,不是就加载文件(异常判断),最后返回exports
- 

## __dirname,__filename属性
- module.load方法会传入

## require/import
- 后者是编译时的语法,无法在语句里import,只能开头
- import 相当于 require里 在exports的default属性引用自己
- 

## 循环依赖
- 文件开头 exports.loaded = false; 导出时 { loaded: true }

## 闭包
- 一个函数引用另一个函数里的变量

## 深拷贝
- 浅拷贝只会将对象的各个属性进行依次复制，并不会进行递归复制
- 深拷贝,递归复制值,没有浅拷贝地址引用的烦恼.遍历属性,如果是object就判断是数组还是对象进行递归.

## 优势
- 非阻塞IO模型,事件驱动,适合做接口开发
- 

## 事件循环的流程
- 宏任务:setInterval/setTimeout/setImmediate队列,微任务: Promise.then catch finally队列,process.nextTick队列 
- 是否有事件 -> 取出事件 -> 有回调就执行回调(微任务) -> 进行下一次事件循环.
- 从script(整体代码)开始第一次循环。之后全局上下文进入函数调用栈。直到调用栈清空(只剩全局)，然后执行所有的micro-task。当所有可执行的micro-task执行完毕之后。循环再次从macro-task开始，找到其中一个任务队列执行完毕，然后再执行所有的micro-task
- 嵌套的任务
- 一个线程中调用栈只有一个，但任务队列可以有多个

- process.memoryUsage()

## webSocket
- 只需一个TCP连接,可以推送,协议头更轻

## url到页面显示经历了什么
- 加载文件,生成DOM树和样式树,一起构成渲染树 重绘和回流

##prototype和__proto__的区别
- prototype是函数才有的属性, __proto__是每个对象都有的属性
- 函数的prototype是构造器,构造器的prototype是__proto__
- 访问一个对象的属性时，如果这个对象本身不存在这个属性，那么就会去它构造函数的’prototype’属性中去寻找

## express和koa模型
- 前者是按顺序执行,后者是中间件next前一次,完成后又调一次

## promise
- then catch finally try 提案
- all race 多个promise包装为一个
- fulfilled/rejected/pending
- polyfill 好多方法..

## Set和Map
- Set像数组,但每个值是唯一的
- Map像对象,但键可以不是字符串
## 创建子进程
- spawn()
- exec() 有回调
- execFile() 有回调有文件
- fork() 需要文件
- 

## 进程间通信
- 通过子进程的stdio
- spawn()/fork() 的write()和ondata
- sockets 可以跨进程跨机器 node-ipc模块

## 优化
- 数据库 集群/读写分离/分数据库表/索引
- 网络资源
- 缓存
- docker自动扩容

## pm2与cluster
- work和master进程
- 通过cluster.isMaster和isWork判断
- 内置负载均衡器调节负载
- pm2参数: -i 实例数 -n 实例名称 -o 日志路径 -e 错误日志路径 --watch 
- start/restart/ stop/stop all/list/monit/delete/logs
- 配置文件

## redis
- 键值对非关系型数据库
- 数据在内存也可持久化
- 数据类型: 字符串/hash/列表/set集合/zset有序集合
- keys pattern /select
- set key value/setnx/mset/get key/hset/hmset/lpush/rpush/llen/
- expire/ttl/getset/incr/incrby/decr/decrby/persist
- 集群模式/主从模式 哨兵模式
- list结构可以作为队列,lpop消费rpush生产消息
- 可能消息丢失
- 发布订阅模式 一次生产多次消费
- 缓存穿透: key失效后查询数据库
- 缓存雪崩: 大量缓存失效.做二级缓存或将key的过期时间错开

## TCP/IP
- 互联网相关的各类协议族的总称: TCP，UDP，IP，FTP，HTTP，ICMP，SMTP
## tcp三次握手和四次挥手
- 
  - 客服端发送syn包和序号,服务器返回ack包序号和自己的syn包序号,客户端收到syn包和ack包,发送ack包.
  - 建立 TCP 连接，并同步连接双方的序列号和确认号并交换 TCP 窗口大小信息
  - 在 SOCKET 编程中，客户端执行 connect()将会触发三次握手
- 任何一方执行close()来关闭连接
  - 请求方发送将要关闭连接的信息 FIN,应答方接收到后发送可以关闭的信息ACK然后发送已关闭的信息FIN,请求方发送知道了ACK
- 可靠性: 连接管理(握手挥手),序列号,超时重传,
## HTTPS 工作原理
>HTTP + SSL / TLS,TCP前加了SSL
- 客户端发起HTTPS请求 -> 返回传送证书信息 -> 客户端生成随机密匙,并通过证书的公匙加密,传给服务器 -> 服务器解密得到随机密匙后,将请求的内容通过随机密匙加密返回给客户端
- 

## http 1.1
- 增加持久性连接, Connection: keep-alive.多个请求和响应可以利用同一个 TCP 连接
- 增加管道机制.请求可以同时发出，但是响应必须按照请求发出的顺序依次返回
- 分块传输.
- Host头
- 缺点: 队头阻塞,携带大量冗余的头信息

## http 2.0
- 应用层和传输层间加了二进制分帧层
- 多路复用.一个TCP连接可以承载任意数量的双向数据流.每个数据流以消息的形式发送，而消息由一或多个帧组成,帧头部的流标识符
- 首部压缩.header
- 服务器推送

## 跨域
- 同源策略: "协议+域名+端口"三者相同
- jsonp,iframe,跨域头,代理,postMessage
- 

## 类型判断
- 底层变量表示.除了bool/字符串/数字都是object
- toString()/instanceOf/

