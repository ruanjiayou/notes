# 爬虫

## 任务系统
- 类型: spider(新闻/小说/图片/视频/)/拉取更新信息/
- 名称: xxx项目
- 计划: schedule
- 状态: stop ing end updating
- 条件判断qi

- 爬虫spider模块, url模块, http模块(下载/代理), 队列模块, 事件模块, 持久化模块(数据库), 
- 爬虫: spiders
  - 配置: attempt, cocurrent, interval, output-dir
  - 入口: entry
  - queue: new queue(entry)
  - 列表规则: listRule, 列表处理: (text) => detail.urls list.urls
  - 详情规则: detailRule, 详情处理: (text) => data (img/video/audio), 
- 队列列表: queues
- 面板 可视化