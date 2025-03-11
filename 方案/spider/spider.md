# spider

## 表
| 字段      | 类型                                             | 说明     |
|-----------|--------------------------------------------------|--------|
| _id       | string                                           | 唯一id   |
| name      | string                                           | 名称     |
| desc      | string                                           | 描述     |
| urls      | [{<br/>  url:string,<br/> enabled:boolean<br/>}] | 域名列表 |
| pattern   | string                                           | 匹配规则 |
| config    | {proxy,from}                                     | 配置     |
| header    | object                                           | 请求头   |
| script    | string                                           | 脚本     |
| status    | number                                           | 状态     |
| createdAt | date                                             | 创建时间 |

- model
- task
  - ffmpeg
  - request
  - torrent
  - youtube_dl
  - mtd
- utils
  - url.js resolve
  - author
  - filter
  - folder count
  - timeFormat
- spiders
  - site-xxx
    - detail
    - list
    - config

## 需求
- 重复启动 测试库迁移字段,sub完成字段,不完整count判断断点-不fetchList
- 持续更新
- 域名更换 resource_id的选取
- 反反爬虫
- 数据转移 加索引..迁移脚本/完整性校验脚本/
- 界面管理
- 单元测试
- origin source-id uuid
- 同网站多入口
- 任务与子任务.参数-任务类型 null或name



- 资源管理
- 媒体管理
  - 视频
  - 图片
  - 画册
  - 章节
  - pixiv
  - 音乐
  - 文件
- 下载管理
- 爬虫管理
- 定时任务
- 数据备份
- 链接管理
- 线路管理