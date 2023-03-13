# elasticsearch

## 8.6.0版本docker
- 挂载`elasticseawrch.yml`(关闭ssl,去掉证书文件)
- 环境变量: `discovery.type=single-node`
- 设置密码: `./bin/elasticsearch-setup-passwords interactive`

## 查询
```
GET /:doc/:type/_search
{
  size: 10,
  from: 0,
  min_score: 10,
  _source: fields_list,
  sort: ["_score"],
  query,
  highlight,
}
```
## 高亮
```js
highlight: {
  pre_tags: ["<span style>"],
  post_tags: ["</span>"],
  fields: {
    title: {
      number_of_fragments: 0
    },
    desc: {
      number_of_fragments: 2,
      fragment_size: 20
    }
  }
}
```

## 时间衰减(linear，exp，gauss)
- 根据发布时间(Date类型)计算额外得分(0-20)
```json
"query": {
    "function_score": {
      "boost_mode": "sum",
      "query": {
        "bool": {
          "should": [
            {
              "bool": {
                "should": [
                  {
                    "match": {
                      "title": {
                        "query": "test",
                        "analyzer": "ik_smart",
                        "boost": 5
                      }
                    }
                  },
                  {
                    "match": {
                      "p": {
                        "query": "test",
                        "analyzer": "ik_smart"
                      }
                    }
                  }
                ],
                "filter": [
                  {
                    "bool": {
                      "must": [
                        {
                          "term": {
                            "available": 1
                          }
                        },
                        {
                          "terms": {
                            "resource_type": [
                              "program"
                            ]
                          }
                        },
                        {
                          "range": {
                            "modified_time": {
                              "gte": 0,
                              "lte": 1653379883783,
                              "format": "epoch_millis"
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      "functions": [
        {
          "gauss": {
            "modified_time": {
              "origin": "now/d",
              "scale": "1000d",
              "offset": "50d",
              "decay": 0.5
            }
          },
          "weight": 20
        }
      ]
    }
  }
```
- 根据地理位置(geo_location类型)越近得分越高
```
```
- 根据人气(整数类型)

## 搜索精确度
> 问题: 分词太细,相关度不高,时间排序效果不好
- boost
  ```
  match: {
    title: {
      query: q,
      boost: 5
    }
  }
  ```
- term/docFreq/docCount频率
- filter
- min_score
- analyzer: ik_smart
  ```
  match: {
    title: {
      query: q,
      analyzer: "ik_smart"
    }
  }
  ```
- 自定义词库
- Decay Function: 针对数值,时间,地理等类型
  ```
  function_score: {
    boost_mode: "multiply",
    query: {},
    functions: [
      {
        gauss: {
          modifiedAt: {
            origin: "now/d",
            scale: "365d",
            decay: 0.5
          }
        }
      }
    ]
  }
  ```
- 相关性算法BM25参数调整


### 参考
- [](https://segmentfault.com/a/1190000023351535)
- [](https://zhuanlan.zhihu.com/p/104631505)
- [](https://cloud.tencent.com/developer/article/1876186)
- [](https://toutiao.io/posts/o4s9sc/preview)
- [](https://www.programminghunter.com/article/21741254698/)
- 