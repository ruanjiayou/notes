- queue.process() 处理命名job会累加并发数.需要统一处理 `process('*', concurrent, cb)`, 在函数里判断 job.name 处理
- 重启会造成队列并发数暂时再多加一遍,稍后会恢复
- 