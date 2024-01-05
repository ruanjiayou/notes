# 推广数据分析

## 表设计
`记录表`

| 字段         | 含义                                             |
| ------------ | ------------------------------------------------ |
| _id          |                                                  |
| source_id    | 来源唯一id                                       |
| platform     | 平台，twitter，facebook，youtube，ingram，tiktok |
| title        | 资源标题                                         |
| channel      | 频道或分类                                       |
| publish_time | 发布时间                                         |
| config       | 设置。是否能comment，rating                      |
| status       | 资源状态。1 正常，2 被删除，3 冻结               |
| url          | 资源地址                                         |
| type         | 资源类型。 short，video，article                 |
| user_id      | ump用户id                                        |

`数据表`

| record_id    | 记录表_id                                                                  |
| ------------ | -------------------------------------------------------------------------- |
| date         | 发布日期.2023-07-09                                                        |
| counter      | 统计维度数据。<br/>likes，views，shares，subscribes，comments，collections |
| created_time | 创建日期（可能是手动触发生成）                                             |

### 说明
不同平台考核维度不一样。youtube没有分享数

## 分析字段参考
### youtube
![维度](youtube-analysis.png)