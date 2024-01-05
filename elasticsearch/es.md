# elasticsearch

## 8.6.0版本docker
- 挂载`elasticseawrch.yml`(关闭ssl,去掉证书文件)
- 环境变量: `discovery.type=single-node`
- 设置密码: `./bin/elasticsearch-setup-passwords interactive`(kibana_system的密码不能纯数字)
  ```
  elastic 123456
  apm_system apm123456
  kibana/kibana_system k123456
  logstash_system ls123456
  beats_system b123456
  remote_monitoring_user rm123456
  ```
- 安装plugins
  - ./bin/elasticsearch-plugin install file:/home/files/xxxx.zip
  - 查看安装的插件列表: http://192.168.0.124:9200/_cat/plugins
## setting

## mapping
- type: text 全文索引, keyword 精确查询.(term时 ['ab', 'abc'] 查'ab'只有一个)
  - [区别](https://www.cnblogs.com/sanduzxcvbnm/p/12177377.html)
  - `text`: 支持分词，全文检索,支持模糊、精确查询,不支持聚合,排序操作,最大支持的字符长度无限制,适合大字段存储.默认结合standard analyzer(标准解析器)对文本进行分词、倒排索引。默认结合标准分析器进行词命中、词频相关度打分  
  - `keyword`: 不进行分词，直接索引,支持模糊、支持精确匹配，支持聚合、排序操作.大支持的长度为——32766个UTF-8类型的字符,可以通过设置ignore_above指定自持字符长度，超过给定长度后的数据将不被索引，无法通过term精确匹配检索返回结果
  - 基础类型: byte,short,integer,long,double,half_float,float,scaled_float,bool
  - binary,默认store为false,也不可搜索(接受base64字符串)
  - nested,object类型默认转化为平整形式会丢失关联关系,nested应运而生
  - geo_point
  - geo_shape
  - ip
  - range
  - token_count,统计字符串分词的个数
    > 映射中指定 name 为 text 类型，增加 name.length 字段用于统计分词后词项的长度，类型为 token_count，分词器为标准分词器
    ```js
    {
      name: {
        type: "text",
        fields: {
          length: {
            type: "token_count",
            analyzer: "standard"
          }
        }
      }
    }
    GET my_index/_search
    {
      "query": {
        "term": {
          "name.length": 3
        }
      }
    }
    ```
- index: 索引设置
  - analyzed(默认值)
  - not_analyzed,整个字符串被当作单独的词条进行索引。当进行精准的匹配时，使用这个选项
  - no,没有索引无法搜索,节省了存储空间，也缩短了索引和搜索的时间(适用存储评论)
- store: 是否存储指定字段，可选值为 true|false，设置 true 意味着需要开辟单独的存储空间为这个字段做存储，而且这个存储是独立于 _source 的存储的
- norms: 是否使用归一化因子，可选值为 true|false，不需要对某字段进行打分排序时，可禁用它，节省空间；type 为 text 时，默认为 true；而 type 为 keyword 时，默认为 false
- index_options: 索引选项控制添加到倒排索引（Inverted Index）的信息，这些信息用于搜索（Search）和高亮显示
  - docs: 只索引文档编号
  - freqs: 索引文档编号和词频率
  - positions: 索引文档编号,词频率和词位置（序号）
  - offsets: 索引文档编号，词频率，词偏移量（开始和结束位置）和词位置（序号）
- term_vector(是 lucene 层面的索引设置): 索引选项控制词向量相关信息
  - no: 默认值，表示不存储词向量相关信息
  - yes: 只存储词向量信息
  - with_position: 存储词项和词项位置
  - with_positions_offsets: 存储词项、词项位置、字符偏移位置
- similarity: 指定文档相似度算法(评分模型),es5之后默认是BM25
- copy_to: 复制到自定义 _all 字段，值是数组形式，即表明可以指定多个自定义的字段
- analyzer: 指定索引和搜索时的分析器，如果同时指定 search_analyzer 则搜索时会优先使用 search_analyzer
- search_analyzer: 指定搜索时的分析器，搜索时的优先级最高
- fielddata: 默认是 false，因为 doc_values 不支持 text 类型，所以有了 fielddata，fielddata 是 text 版本的 doc_values，也是为了优化字段进行排序、聚合和脚本访问。和 doc_values 不同的是，fielddata 使用的是内存，而不是磁盘；因为 fielddata 会消耗大量的堆内存，fielddata 一旦加载到堆中，在 segment 的生命周期之内都将一致保持在堆中，所以谨慎使用

## analysis
> 文本分析,把全文本转化为一系列单词(term/token)的过程
### analyzer由三部分组成
> 不管是索引任务还是搜索工作，都需要经过 es 的 analyzer（分析器），至于分析器，它分为内置分析器和自定义的分析器。分析器进一步由字符过滤器（Character Filters）、分词器（Tokenizer）和词元过滤器（Token Filters）三部分组成
- character filters: 入是原始的文本 text，如果配置了多个，它会按照配置的顺序执行
  - HTML strip character filter
  ```js
  GET /_analyze
  {
    "tokenizer": "keyword",
    "char_filter": [
      "html_strip"
    ],
    "text": "<p>I&apos;m so <b>happy</b>!</p>"
  }
  输出: [ \nI'm so happy!\n ]
  ```
  - mapping character filter
  ```js
  GET /_analyze
  {
    "tokenizer": "keyword",
    "char_filter": [
      {
        "type": "mapping",
        "mappings": [
          "٠ => 0",
          "١ => 1",
          "٢ => 2",
          "٣ => 3",
          "٤ => 4",
          "٥ => 5",
          "٦ => 6",
          "٧ => 7",
          "٨ => 8",
          "٩ => 9"
        ]
      }
    ],
    "text": "My license plate is ٢٥٠١٥"
  }
  结果: [ My license plate is 25015 ]
  ```
  - pattern replace character filter
  ```js
  // 在 settings 时，配置
  "char_filter": {
    "multi_space_2_one": {
      "pattern": "[ ]+",
      "type": "pattern_replace",
      "replacement": " "
    }
  }
  ```
- tokenizer: 即分词器，也是 analyzer 最重要的组件，它对文本进行分词；一个 analyzer 必需且只可包含一个 tokenizer
  - standard analyzer: 默认分词器,按词切分,小写处理
  - simple analyzer: 安装非字母切分(符号被过滤),小写处理
  - stop analyzer: 小写处理,停用词过滤(the,a,is)
  - whitespace analyzer: 按空格切分,不转小写
  - keyword analyzer: 不分词
  - patter analyzer: 正则表达式,默认\W+(分字符分割)
  - language: 提供30多种常见语言分词器
  - custom analyzer: 自定义分词器
  - ik analyzer: 支持自定义词库,热更新分词词典,它对应的 tokenizer 分为 ik_smart 和 ik_max_word，一个是智能分词（针对搜索侧），一个是全切分词（针对索引侧）
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
- match: 用于搜索单个字段，首先会针对查询语句进行解析（经过 analyzer），主要是对查询语句进行分词，分词后查询语句的任何一个词项被匹配，文档就会被搜到，默认情况下相当于对分词后词项进行 or 匹配操作
  - 如果想匹配所有关键词
  ```js
  GET article/_search
  {
    "query": {
      "match": {
        "title": {
          "query": "Elasticsearch 查询优化",
          "operator": "and"
        }
      }
    }
  }
  ```
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
>  match 的升级，用于搜索多个字段,多个fields之间是or的查询关系, 字段^数字：表示增强该字段（权重影响相关性评分）
- 多字段查询
```js
GET books/_search
{
  "query": {
    "multi_match": {
      "query": "编程",
      "fields": ["title", "description"]
    }
  }
}
```
- 字段使用通配符
```js
GET books/_search
{
  "query": {
    "multi_match": {
      "query": "java 编程",
      "fields": ["title", "*_name"]
    }
  }
}
```
- 指定字段权重
```js
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

### 停顿词common terms
> 是一种在不牺牲性能的情况下替代停用词提高搜索准确率和召回率的方案.主要用于英文,中文作用不大.7.3.0版本后废弃
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

### 模糊查询
- wildcard: 等价于mysql的like查询(止极慢的通配符查询，通配符术语不应以通配符*或?之一开头)
  ```js
  GET books/_search
  {
    "query": {
      "wildcard": {
        "author": "编程*"
      }
    }
  }
  ```
- prefix: 以指定确切前缀开头(等价于sql,where column like "标题%")
  ```js
  GET books/_search
  {
    "query": {
      "prefix": {
        "description": "编程"
      }
    }
  }
  ```
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
- regexp
  ```js
  GET books/_search
  {
    "query": {
      "regexp": {
        "postcode": "编程[0-9].+"
      }
    }
  }
  ```

### 词项查询
### term
- 查询用来查找指定字段中包含给定单词的文档，term 查询不被解析，只有查询词和文档中的词精确匹配才会被搜索到，应用场景为查询人名、地名等需要精准匹配的需求
```
避免 term 查询对 text 字段使用查询。
默认情况下，Elasticsearch 针对 text 字段的值进行解析分词，这会使查找 text 字段值的精确匹配变得困难。
要搜索 text 字段值，需改用 match 查询
```

### terms
- 查询是 term 查询的升级，可以用来查询文档中包含多个词的文档

### range查询
用于匹配在某一范围内的数值型、日期类型或者字符串型字段的文档，比如搜索哪些书籍的价格在 50 到 100之间、哪些书籍的出版时间在 2015 年到 2019 年之间。使用 range 查询只能查询一个字段，不能作用在多个字段上
> gt,gte,lt,lte

### exists查询

### indices查询
多个索引间查询

### 地理位置查询
- geo_distance: 查找在一个中心点指定范围内的地理点文档
  - 查找距离天津 200km 以内的城市
  ```js
  GET geo/_search
  {
    "query": {
      "bool": {
        "must": {
          "match_all": {}
        },
        "filter": {
          "geo_distance": {
            "distance": "200km",
            "location": {
              "lat": 39.0851000000,
              "lon": 117.1993700000
            }
          }
        }
      }
    }
  }
  ```
  - 按各城市离北京的距离排序
  ```js
  GET geo/_search
  {
    "query": {
      "match_all": {}
    },
    "sort": [{
      "_geo_distance": {
        "location": "39.9088145109,116.3973999023",
        "unit": "km",
        "order": "asc",
        "distance_type": "plane"
      }
    }]
  }
  ```
- geo_bounding_box: 用于查找落入指定的矩形内的地理坐标(两点确定一个矩形)
  ```js
  GET geo/_search
  {
    "query": {
      "bool": {
        "must": {
          "match_all": {}
        },
        "filter": {
          "geo_bounding_box": {
            "location": {
              "top_left": {
                "lat": 38.4864400000,
                "lon": 106.2324800000
              },
              "bottom_right": {
                "lat": 28.6820200000,
                "lon": 115.8579400000
              }
            }
          }
        }
      }
    }
  }
  ```
- geo_polygon: 用于查找在指定多边形内的地理点
  > 呼和浩特、重庆、上海三地组成一个三角形，查询位置在该三角形区域内的城市
  ```js
  GET geo/_search
  {
    "query": {
      "bool": {
        "must": {
          "match_all": {}
        }
      },
      "filter": {
        "geo_polygon": {
          "location": {
            "points": [{
              "lat": 40.8414900000,
              "lon": 111.7519900000
            }, {
              "lat": 29.5647100000,
              "lon": 106.5507300000
            }, {
              "lat": 31.2303700000,
              "lon": 121.4737000000
            }]
          }
        }
      }
    }
  }
  ```
- geo_shape

### 嵌套查询
索引中指定child和parent关系
- has_child
- has_parent

### 复合查询
#### bool查询
bool 查询可以把任意多个简单查询组合在一起，使用 must、should、must_not、filter 选项来表示简单查询之间的逻辑，每个选项都可以出现 0 次到多次
- minimum_should_match: should在与must或者filter同级时，默认是不需要满足should中的任何条件的
#### boosting查询
查询用于需要对两个查询的评分进行调整的场景，boosting 查询会把两个查询封装在一起并降低其中一个查询的评分
- positive: 评分保持不变
- negative: 会降低文档评分
- negative_boost: 指明 negative 中降低的权值
  > 对 2015 年之前出版的书降低评分
  ```js
  GET books/_search
  {
    "query": {
      "boosting": {
        "positive": {
          "match": {
            "title": "python"
          }
        },
        "negative": {
          "range": {
            "publish_time": {
              "lte": "2015-01-01"
            }
          }
        },
        "negative_boost": 0.2
      }
    }
  }
  ```
#### constant_score查询
constant_score query 包装一个 filter query，并返回匹配过滤器查询条件的文档，且它们的相关性评分都`等于` boost 参数值
```js
GET books/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "title": "elasticsearch"
        }
      },
      "boost": 1.8
    }
  }
}
```
#### function_score查询
可以修改查询的文档得分，这个查询在有些情况下非常有用，比如通过评分函数计算文档得分代价较高，可以改用过滤器加自定义评分函数的方式来取代传统的评分方式
- 时间衰减
  ```js
  GET books/_search
  {
    query: {
      function_score: {
        boost_mode: "multiply",
        query: {},
        "boost": "5",
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
    }
  }
  ```
- 自定义评分公式
  ```js
  GET books/_search
  {
    "query": {
      "function_score": {
        "query": {
          "match": {
            "title": "java"
          }
        },
        "script_score": {
          "inline": "Math.sqrt(doc['price'].value/10)"
        }
      }
    }
  }
  ```
### 特殊查询
- more_like_this: 可以查询和提供文本类似的文档，通常用于近似文本的推荐等场景
  ```js
  GET books/_search
  {
    "query": {
      "more_like_ this": {
        "fields": ["title", "description"],
        "like": "java virtual machine",
        "min_term_freq": 1,
        "max_query_terms": 12
      }
    }
  }
  ```
- script: 使用脚本进行查询
  ```js
  GET books/_search
  {
    "query": {
      "script": {
        "script": {
          "inline": "doc['price'].value > 180",
          "lang": "painless"
        }
      }
    }
  }
  ```
- percolate: 先注册查询条件，根据文档来查询 query

## 高亮
### 参数
  - boundary_chars: 包含每个边界字符的字符串。默认为,! ?\ \ n
  - boundary_max_scan: 扫描边界字符的距离,默认为20
  - boundary_scanner: 指定如何分割突出显示的片段，支持chars、sentence、word三种方式
  - boundary_scanner_locale: 用来设置搜索和确定单词边界的本地化设置，此参数使用语言标记的形式（“en-US”, “fr-FR”, “ja-JP”）
  - encoder: 表示代码段应该是HTML编码的:默认(无编码)还是HTML (HTML-转义代码段文本，然后插入高亮标记)
  - fields: 指定检索高亮显示的字段
  - force_source: 根据源高亮显示。默认值为false
  - fragmenter: 指定文本应如何在突出显示片段中拆分:支持参数simple或者span
  - fragment_offset: 控制要开始突出显示的空白。仅在使用fvh highlighter时有效
  - fragment_size: 字符中突出显示的片段的大小。默认为100
  - highlight_query: 突出显示搜索查询之外的其他查询的匹配项。这在使用重打分查询时特别有用，因为默认情况下高亮显示不会考虑这些问题
  - matched_fields: 组合多个匹配结果以突出显示单个字段，对于使用不同方式分析同一字符串的多字段。所有的matched_fields必须将term_vector设置为with_positions_offsets，但是只有将匹配项组合到的字段才会被加载，因此只有将store设置为yes才能使该字段受益。只适用于fvh highlighter。
  - no_match_size: 如果没有要突出显示的匹配片段，则希望从字段开头返回的文本量。默认为0(不返回任何内容)
  - number_of_fragments: 返回的片段的最大数量。如果片段的数量设置为0，则不会返回任何片段。相反，突出显示并返回整个字段内容。当需要突出显示短文本(如标题或地址)，但不需要分段时，使用此配置非常方便。如果number_of_fragments为0，则忽略fragment_size。默认为5
  - order: 设置为score时，按分数对突出显示的片段进行排序。默认情况下，片段将按照它们在字段中出现的顺序输出(order:none)。将此选项设置为score将首先输出最相关的片段。每个高亮应用自己的逻辑来计算相关性得分
  - phrase_limit: 控制文档中所考虑的匹配短语的数量。防止fvh highlighter分析太多的短语和消耗太多的内存。提高限制会增加查询时间并消耗更多内存。默认为256
  - pre_tags
  - post_tags
  - require_field_match: 默认情况下，只突出显示包含查询匹配的字段。将require_field_match设置为false以突出显示所有字段。默认值为true
  - tags_schema: 设置为使用内置标记模式的样式
  - type: 使用的高亮模式，可选项为unified、plain或fvh。默认为unified
### 自定义高亮片段
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
### 多字段高亮
> 关于搜索高亮，还需要掌握如何设置多字段搜索高亮。比如，搜索 title 字段的时候，我们期望 description 字段中的关键字也可以高亮，这时候就需要把 require_field_match 属性的取值设置为 fasle。require_field_match 的默认值为 true，只会高亮匹配的字段
```js
GET /books/_search
{
  "query": {
    "match": { "title": "javascript" }
  },
  "highlight": {
    "require_field_match": false,
    "fields": {
      "title": {},
      "description": {}
    }
  }
}
```
### 高亮性能分析
高亮器
- 默认的 highlighter 高亮器: 对 _source 中保存的原始文档进行二次分析，其速度在三种高亮器里最慢，优点是不需要额外的存储空间
- postings-highlighter: 实现高亮功能不需要二次分析，但是需要在字段的映射中设置 index_options 参数的取值为 offsets，即保存关键词的偏移量，速度快于默认的 highlighter 高亮器
  ```js
  PUT /example
  {
    "mappings": {
      "doc": {
        "properties": {
          "comment": {
            "type": "text",
            "index_options": "offsets"
          }
        }
      }
    }
  }
  ```
- fast-vector-highlighter: 实现高亮功能速度最快，但是需要在字段的映射中设置 term_vector 参数的取值为 with_positions_offsets，即保存关键词的位置和偏移信息，占用的存储空间最大
  ```js
  PUT /example
  {
    "mappings": {
      "doc": {
        "properties": {
          "comment": {
            "type": "text",
            "term_vector": "with_positions_offsets"
          }
        }
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
- 相关性算法BM25参数调整

### 参考
- [](https://segmentfault.com/a/1190000023351535)
- [](https://zhuanlan.zhihu.com/p/104631505)
- [](https://cloud.tencent.com/developer/article/1876186)
- [](https://toutiao.io/posts/o4s9sc/preview)
- [](https://www.programminghunter.com/article/21741254698/)
- [](https://www.knowledgedict.com/tutorial/elasticsearch-intro.html)

## 性能调优
- _explain: true
- settings和mappings设置similarity参数
- filter会使用缓存,不参与分数计算

## 最佳实践

### 常用setting
- 繁体简体问题
  ```js
  {
    "tokenizer": "keyword",
    "filter": [
        "t2s_convert"
    ],
    "text": "學生"
  }
  // => 学生
  ```
- html实体: html_strip
- 大小写
- 口音: asciifolding
```js
{
  "settings" : {
    "analysis": {
      "char_filter": {
        "tsconvert": {
          "type": "stconvert",
          "convert_type": "t2s"
        }
      },
      "filter": {
        "synonym": {
          "type": "synonym",
          "synonyms_path": "analysis/synonyms.txt"
        }
      },
      "analyzer": {
        "normal_analyzer": {
          "char_filter": ["tsconvert", "html_strip"],
          "tokenizer": "ik_max_word",
          "filter": [
            "synonym"
          ]
        },
        "normal_search_analyzer": {
          "char_filter": ["tsconvert", "html_strip"],
          "tokenizer": "ik_smart",
          "filter": [
            "synonym"
          ]
        }
      }
    }
  }
}
```

### 常用mapping
