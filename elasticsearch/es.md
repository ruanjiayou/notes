# elasticsearch

## 8.6.0版本docker
- 挂载`elasticseawrch.yml`(关闭ssl,去掉证书文件)
- 环境变量: `discovery.type=single-node`
- 设置密码: `./bin/elasticsearch-setup-passwords interactive`(kibana_system的密码不能纯数字)
## mapping
- 字段类型: text 全文索引, keyword 精确查询.(term时 ['ab', 'abc'] 查'ab'只有一个)
  - [区别](https://www.cnblogs.com/sanduzxcvbnm/p/12177377.html)
  - `text`: 支持分词，全文检索,支持模糊、精确查询,不支持聚合,排序操作,最大支持的字符长度无限制,适合大字段存储.默认结合standard analyzer(标准解析器)对文本进行分词、倒排索引。默认结合标准分析器进行词命中、词频相关度打分  
  - `keyword`: 不进行分词，直接索引,支持模糊、支持精确匹配，支持聚合、排序操作.大支持的长度为——32766个UTF-8类型的字符,可以通过设置ignore_above指定自持字符长度，超过给定长度后的数据将不被索引，无法通过term精确匹配检索返回结果
  - 
## analysis
> 文本分享,把全文本转化为一系列单词(term/token)的过程
### analyzer由三部分组成
- character filters: 原始文本处理,如去除html
- tokenizer: 安装规则切分为单词
  - standard analyzer: 默认分词器,按词切分,小写处理
  - simple analyzer: 安装非字母切分(符号被过滤),小写处理
  - stop analyzer: 小写处理,停用词过滤(the,a,is)
  - whitespace analyzer: 按空格切分,不转小写
  - keyword analyzer: 不分词
  - patter analyzer: 正则表达式,默认\W+(分字符分割)
  - language: 提供30多种常见语言分词器
  - custom analyzer: 自定义分词器
  - ik analyzer: 支持自定义词库,热更新分词词典
  - THULAC: 清华中文分词
- token filter: 对切分的单词加工,小写/删除stopwords/增加同义词

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
### 全文搜索
#### match query
- match: 
- match_phrase: match_phrase的分词结果必须在被检索字段的分词中都包含，而且顺序必须相同,而且默认必须都是连续的
  >slop 参数-Token之间的位置距离容差值
  ```GET /test/_doc/_search
  {
      "query": {
          "match_phrase": {
              "content.ik_smart_analyzer": {
                "query": "关注我,系统学",
                "slop":1
              }
          }
      }
  }
  ```
- match_phrase_prefix: 会对最后一个Token在倒排序索引列表中进行通配符搜索
  > 模糊匹配数控制：max_expansions 默认值50，最小值为1
#### multi_match
> 多个fields之间是or的查询关系 \
> 字段^数字：表示增强该字段（权重影响相关性评分）
```
GET /test/_doc/_search
{
  "query": {
    "multi_match": {
      "query": "系统",
      "fields": [
        "content",
        "content.ik_smart_analyzer^3",
        "content.ik_max_analyzer"
      ]
    }
  }
}
```
#### query_string
> 允许我们在单个查询字符串中指定AND | OR | NOT条件，同时也和 multi_match query 一样，支持多字段搜索
```
# 1、检索同时包含Token【系统学、es】的文档，结果为空
GET /tehero_index/_doc/_search
{
    "query": {
        "query_string" : {
            "fields" : ["content.ik_smart_analyzer"],
            "query" : "系统学 AND es"
        }
    }
}
# 2、检索包含Token【系统学、es】二者之一的文档，能检索到文档1、2、4
GET /tehero_index/_doc/_search
{
    "query": {
        "query_string" : {
            "fields" : ["content.ik_smart_analyzer"],
            "query" : "系统学 OR es"
        }
    }
}
```
#### simple_query
> 类似于query_string ，但是会忽略错误的语法，永远不会引发异常，并且会丢弃查询的无效部分
```
+ 表示与运算，相当于query_string 的 AND
| 表示或运算，相当于query_string  的 OR
- 取反单个令牌,相当于query_string 的 NOT
"" 表示对检索词进行 match_phrase query
* 字词末尾表示前缀查询
```
```
GET /tehero_index/_doc/_search
{
    "query": {
        "simple_query_string" : {
            "fields" : ["content.ik_smart_analyzer"],
            "query" : "系统学 + 间隔"
        }
    }
}
```

### 模糊查询
- wildcard: 等价于mysql的like查询(止极慢的通配符查询，通配符术语不应以通配符*或?之一开头)
- prefix: 以指定确切前缀开头(等价于sql,where column like "标题%")
- fuzzy: 用于搜索的时候可能输入的文本会出现误拼写的情况
  ```GET /test/_search
  {
      "query": {
          "fuzzy" : {
              "author": {
                  "value": "标题",
                  "fuzziness": 1,
                  "prefix_length": 1,
                  "max_expansions": 100
              }
          }
      }
  }
  ```

### 停顿词common terms
> 主要用于英文,中文作用不大
```
GET /_search
{
  "query": {
    "common": {
      "body": {
        "query": "nelly the elephant as a cartoon",
        "cutoff_frequency": 0.001,
        "low_freq_operator": "and"
      }
    }
  }
}

等价于:

GET /_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "body": "nelly"}},
        { "term": { "body": "elephant"}},
        { "term": { "body": "cartoon"}}
      ],
      "should": [
        { "term": { "body": "the"}},
        { "term": { "body": "as"}},
        { "term": { "body": "a"}}
      ]
    }
  }
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

## 性能调优
- _explain: true
- settings和mappings设置similarity参数
- filter会使用缓存,不参与分数计算