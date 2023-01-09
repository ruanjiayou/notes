# ELK 
- mac 2018 macOS 10.13.6
- elk系列不允许使用root启动
- 建议在用户目录下创建elk文件夹,放elk系列
- 完整步骤:
  - elasticsearch: `./es-restart.sh` => `curl http://localhost:9200/?pretty`
  - logstash: `./bin/logstash -f config/conf.d/filebeat.test.conf --config.reload.automatic`
  - kibana: `./bin/kibana` => 访问: `http://localhost:5601/app/kibana`
  - filebeat: `filebeat -e -c filebeat.yml -d "publish"`
## java环境
1. 下载安装 https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html
2. 编辑环境变量 vim ~/.bash_profile
   > JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_191.jdk/Contents/Home
     PATH=$JAVA_HOME/bin:$PATH:.
     CLASSPATH=$JAVA_HOME/lib/tools.jar:$JAVA_HOME/lib/dt.jar:.
     export JAVA_HOME
     export PATH
     export CLASSPATH
 3. 使配置生效: source .bash_profile
 4. 查看结果: java -version

## elasticsearch安装
1. 下载tar.gz包解压
2. 进入安装目录
3. 写启动脚本: 还是alias比较方便。。。
```bash
#!/bin/bash
./bin/elasticsearch -d
echo '已启动ElasticSearch进程'
```
    给启动脚本加执行权限
    ```bash
    chmod +x es-start.sh
    ```
4. 写停止脚本: `vim es-stop.sh`
```bash
#!/bin/bash
es_ps=`jps|grep Elasticsearch`
OLD_IFS="$IFS"
IFS=" "
arr=($es_ps)
IFS="$OLD_IFS"
echo '正在停止ElasticSearch进程:' ${arr[0]}...
kill -9 ${arr[0]}
echo '已停止'
```
   给脚本启动权限和es用户权限
5. 写重启脚本: `vim es-restart.sh`
   ```bash
   #!/bin/bash
   ./es-stop.sh && ./es-start.sh
   echo "重启成功!"
   ```
5. 启动: `./bin/elasticsearch -d` 或者 `./es-start.sh`
6. 测试: `curl http://localhost:9200/?pretty`
7. 停止: `./es-stop.sh` 或者,查进程,根据pid执行kill

## kibana安装
1. 安装 https://www.elastic.co/downloads/past-releases
   > https://artifacts.elastic.co/downloads/kibana/kibana-6.5.1-linux-x86_64.tar.gz
2. (可以配置config中的.yml)
3. 启动(加&貌似没用,停止贼恶心): ./bin/kibana 
4. 访问: http://localhost:5601/app/kibana
5. discover查询: `source: "/tmp/test1.log"`, `offset: "20 to 40"`
   1. 添加filter
   2. 选择字段
   3. 选择操作类型
   3. 输入值
   4. 保存

## logstash
1. 下载: `wget https://artifacts.elastic.co/downloads/logstash/logstash-6.5.1.tar.gz` mac上用curl -o
2. 解压: `tar zxvf logstash-6.5.1.tar.gz` -C 可以指定目录
3. 6.5.1不能设置这个,与下面点-e冲突!进入目录.修改配置支持子配置: `config/logstash.yml` => path.config: /path-to-dir(config/conf.d)
4. config中: `mkdir conf.d`
5. 测试logstash:
   > 耐心等一下: `./logstash/bin/logstash -e 'input{ stdin {} } output { stdout {} }'` \
   > 输入 hello world 可以实时看到变化
6. > 解析配置文件并报告任何错误: `./bin/logstash -f config/conf.d/filebeat.test.conf --config.test_and_exit` \
   > `推荐`启用自动配置加载L `./bin/logstash -f config/conf.d/filebeat.test.conf --config.reload.automatic` \

## filebeat 可用于nginx等的日志收集
1. 安装filebeat: `https://www.elastic.co/downloads/past-releases/filebeat-6-5-1`
2. 测试: 
   > `echo "test - test2" >> /tmp/test1.log` \
   > `echo "test - test2" >> /tmp/test2.log` \
   > `vim filebeat.test.yml` \

   输入
   ```yml
   filebeat.prospectors:
    - type: log
    paths:
        - /tmp/test1.log
    tags: ["test1"]
    document_type: test1

    - type: log
    paths:
        - /tmp/test2.log
    tags: ["test2"]
    document_type: test2

    setup.template.name: "filebeat-%{[beat.version]}"
    setup.template.pattern: "filebeat-%{[beat.version]}-*"

    output.elasticsearch:
    hosts: ["127.0.0.1:9200"]
    index: "test-filebeat"
   ```
   > 修改权限: `chmod 600 filebeat.test.yml` \
   > 指定配置文件前台运行: `filebeat -c filebeat.test.yml` \
   > ./filebeat -e -c filebeat.yml -d "publish"
   > 查看ES里是否新增了内容: `curl http://127.0.0.1:9200/test-filebeat/_search?q=*`
3. 使用kibana查看:
   1. 打开kibana: http://127.0.0.1:5601
   2. 选择Management菜单,点击Index Patterns选择Create Index Pattern
   3. Index pattern输入: test-filebeat, Time Filter field name选择: @timestamp
   4. 点击create
   5. 然后Discover菜单中,选择test-filebeat就能看到日志数据

## logstash&filebeat: filebeat->logstash->elasticseach
1. 修改之前的filebeat.test.yml
   ```yml
   output.logstash:
     hosts: ["127.0.0.1:5046"]
     index: "test-filebeat"

   #output.elasticsearch:
   # hosts: ["127.0.0.1:9200"]
   # index: "test-filebeat"
   ```
2. 新增logstash配置: conf.d/filebeat.test.conf
   ```
   input {
       beats {
           port => 5046
       }
   }
   output {
       elasticsearch {
           hosts => ["127.0.0.1:9200]
           #index => "test-filebeat-%{type}"
           # test-filebeat-test都不行,必须在kibana中先创建index.fuck!
           index => "test-filebeat"
       }
       stdout { codec => rubydebug }
   }
   ```
   ~~~这里的`type`变量就是filebeat里面的`document_type`~~~ \
   Logstash: Detected a 6.x and above cluster: the `type` event field won't be used to determine the document_type
3. 启动logstash和filebeat
    > logstash目录: `./bin/logstash -f config/conf.d/filebeat.test.conf --config.reload.automatic`
    > filebeat目录: `filebeat -c filebeat.test.yml -d "publish"`
4. 往log中增加: `echo "logstash&filebeat" >> /tmp/test1.log`
5. 查看: `http://127.0.0.1:9200/test-filebeat/_search?q=*&sort=@timestamp:desc`

## IK分词器
1. 找对应版本zip下载到本地: https://github.com/medcl/elasticsearch-analysis-ik/releases
2. 到es目录安装: `./bin/elasticsearch-plugin install file://path-to-zip`.
  > 是 zip 文件,而且不能在 plugins 文件夾裡.Mac 里把 .DS_Store 文件要删掉.
3. 测试:
   > 原生: `curl -XGET "http://localhost:9200/_analyze" -H 'Content-Type: application/json;' -d '{"analyzer": "default","text": "今天天气真好"}'` \
   > IK: `curl -XGET "http://localhost:9200/_analyze" -H 'Content-Type: application/json' -d'{"analyzer": "ik_smart","text": "今天天气真好"}'`
4. es目录config/analysis-ik增加文件 test.dic
   > 原生: `curl -XGET "http://localhost:9200/_analyze" -H 'Content-Type: application/json;' -d '{"analyzer": "default","text": "去朝阳公园"}'` \
   > 朝阳公园
   > IK: `curl -XGET "http://localhost:9200/_analyze" -H 'Content-Type: application/json' -d'{"analyzer": "ik_smart","text": "去朝阳公园"}'`
5. 修改config/analysis-ik/IKAnalyzer.cfg.xml, 并重启 : `<entry key="ext_dict">test.dic</entry>`
6. 同义词: `儿童,婴儿`, `文胸=>内衣`
7. 高级搜索: `中文+拼音+首字母+简繁转换+补全+分词`

## 汉字拼音
- 下载: `https://github.com/medcl/elasticsearch-analysis-pinyin/archive/v6.5.1.tar.gz`
- 
- 

## plugins
- 安装繁简插件: `./bin/elasticsearch-plugin -install https://github.com/medcl/elasticsearch-analysis-stconvert/releases/download/v7.13.2/elasticsearch-analysis-stconvert-7.13.2.zip`
- 
## 参考
- IK 分词器: https://segmentfault.com/a/1190000017215854
- elasticsearch 内部机制: http://mednoter.com/all-about-analyzer-part-one.html
- elk实践入门: https://www.cnblogs.com/52fhy/p/10053076.html

## mapping
- 字段类型: text 全文索引, keyword 精确查询.(term时 ['ab', 'abc'] 查'ab'只有一个)
  - [区别](https://www.cnblogs.com/sanduzxcvbnm/p/12177377.html)

## kibana
- 修改文档(5.5.3)
```js
   PUT /fengshows/fengshows/45dc671d-4de7-407a-bd9a-2a04ad7648b3
   {
      "title": "美衛星2次“威脅”中國空間站，在地上搞不過開始在天上搞事了？",
      "available": 1,
      "created_time": "2021-12-29T02:33:03.000Z",
      "modified_time": "2021-12-29T02:33:40.000Z",
      "resource_type": "article",
      "resource_id": "45dc671d-4de7-407a-bd9a-2a04ad7648b3",
      "display_type": 1,
      "cover": "http://q1.fengshows.cn/mp/s/2021/12/29/d7b7a1c0-6849-11ec-b19a-d38d9bda8190.jpg",
      "source": "媒體號",
      "labels": [],
      "__last_actived_time": "2021-12-29T07:10:04.982Z",
      "marks": [
         2
      ],
      "subscription_id": "aba6eda0-4a34-11ea-92e7-81e6b74d5b40",
      "cover_list": [
         "http://q1.fengshows.cn/mp/s/2021/12/29/d7b7a1c0-6849-11ec-b19a-d38d9bda8190.jpg"
      ],
      "comment_enabled": 1,
      "flags": [],
      "authorized_countries": [],
      "platforms": [
         "hkv-ios",
         "hkv-android",
         "hkv-web",
         "hkv-wap"
      ],
   }
```
- 查询平台
```
GET /fengshows/_search
{
  "size": 15,
  "from": 0,
  "_source": [
    "_id",
    "title",
    "available",
    "created_time",
    "modified_time",
    "resource_type",
    "resource_id",
    "article_type",
    "display_type",
    "cover",
    "source",
    "url",
    "width",
    "height",
    "category_id",
    "display_type",
    "type",
    "program_id",
    "program_name",
    "episode",
    "material_id",
    "icon",
    "labels",
    "duration",
    "program_icon",
    "category_key",
    "marks",
    "subscription_id",
    "subscription_name",
    "subscription_icon",
    "cover_list",
    "subscription_type",
    "live_type",
    "app_url",
    "medals",
    "certification_type",
    "flags",
    "width",
    "height",
    "duanmu_enabled",
    "comment_enabled",
    "brief",
    "category",
    "certificate",
    "discard",
    "media_type",
    "images",
    "videos",
    "topic",
    "related_topic",
    "ref_resource",
    "location",
    "creator",
    "scheduled_time",
    "current_language",
    "translation_languages",
    "translations",
    "authorized_countries",
    "target_platforms",
    "platforms",
    "content",
    "icon",
    "tags",
    "p",
    "nickname",
    "memo",
    "nickname",
    "memo"
  ],
  "sort": [
    "_score",
    {
      "modified_time": "desc"
    }
  ],
  "query": {
    "bool": {
      "should": [
        {
          "bool": {
            "should": [
              {
                "match": {
                  "title": {
                    "query": "天上搞事",
                    "boost": 5
                  }
                }
              },
              {
                "match": {
                  "p": {
                    "query": "天上搞事"
                  }
                }
              }
            ],
            "filter": [
              {
                "term": {
                  "available": 1
                }
              },
              {
                "terms": {
                  "resource_type": [
                    "article",
                    "video"
                  ]
                }
              },
              {
                "range": {
                  "modified_time": {
                    "gte": 0,
                    "lte": 1640768453152,
                    "format": "epoch_millis"
                  }
                }
              }
            ]
          }
        }
      ],
      "must": [
        {
          "term": {
            "platforms": "hkv-ios"
          }
        }
      ]
    }
  },
  "highlight": {
    "pre_tags": [
      "<span style=\"color: #E3B56F\">"
    ],
    "post_tags": [
      "</span>"
    ],
    "fields": {
      "title": {
        "number_of_fragments": 0
      },
      "p": {
        "number_of_fragments": 2,
        "fragment_size": 25
      }
    }
  }
}
```
