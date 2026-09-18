# 爬虫项目(crawler)

## spider表
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

### 表类方法
- 获取归一化资源id: `Spider.getResourceId(source_id) => sparkMD5(this._id + '|' + source_id);`
- 参数反构建 url: `getUrlByParams(params)`
- url 提纯: `getPureUrl(url)`
- url 获取 params 参数: `getParams(url)`

### 接口
- 增删改查
- 检测: `post /spider/detect => { code, message, data: { record, rule }, params }`, 判断当前 url 是否有爬虫规则,以及数据爬取状态
- 执行: `patch /spider/:id`,按规则爬取数据

## task表
| 字段      | 类型    | 说明     |
|-----------|---------|--------|
| _id       | string  | 唯一id   |
| name      | string  | 文件名   |
| type      | string  | 任务类型 |
| header    | object  | 请求头   |
| proxy     | boolean | 代理     |
| params    | object  | 参数     |
| url       | string  | 资源地址 |
| filepath  | string  | 文件路径 |
| retires   | number  | 重试次数 |
| status    | number  | 状态     |
| transcode | number  | 转码     |
| createdAt | date    | 创建时间 |

### 下载队列


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