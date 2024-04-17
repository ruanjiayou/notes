# kibana
> 8.6配置文件
```yml
monitoring.ui.container.elasticsearch.enabled: true
# 8的版本默认true，而且没有这个配置了
# xpack.security.enabled: true
elasticsearch.hosts: [ "http://192.168.0.124:9200" ]
elasticsearch.username: kibana_system
elasticsearch.password: k123456
server.name: kibana
server.host: "0.0.0.0"
#server.publicBaseUrl: "http://192.168.0.124:5601"

# MOUNT /usr/share/kibana/config/kibana.yml
```

## 操作语句
- 搜索查询
```json
GET /fengshows/_search
{
      "size": 8,
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
        "content",
        "icon",
        "tags",
        "p",
        "platforms"
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
                        "query": "中古建交60年",
                        "boost": 5
                      }
                    }
                  },
                  {
                    "match": {
                      "p": {
                        "query": "中古建交60年"
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
                              "awhile"
                            ]
                          }
                        },
                        {
                          "range": {
                            "modified_time": {
                              "gte": 0,
                              "lte": 1642741457581,
                              "format": "epoch_millis"
                            }
                          }
                        },
                        {
                          "bool": {
                            "should": [
                              {
                                "term": {
                                  "platforms": "fs-mobile"
                                }
                              },
                              {
                                "bool": {
                                  "must_not": {
                                    "exists": {
                                      "field": "platforms"
                                    }
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
            }
          ],
          "must": [],
          "must_not": []
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
- 查专题 labels
  ```js
  GET /fengshows/_search
  {
    "from": 0, 
    "size": 10,
    "_source": ["resource_type","title","labels", "resource_id", "subscription_id", "program_id"],
    "query": {
      "bool": {
        "filter": {
          "match_phrase": {
            "labels": "兩會2024"
          }
        }
      }
    }
  }

  ```
- 查节目
  ```js
  GET /fengshows/_search
  {
    "from": 0,
    "size": 500,
    "_source": ["resource_type","title","labels", "resource_id", "subscription_id", "program_id"],
    "query": {
      "bool": {
        "should": {
          "match_phrase": {
            "subscription_id": "8ae53640-82ab-11ee-8d16-77c5a7a22f75"
          }
        }
      }
    }
  }
  ```
- 查询详情
```
GET /fengshows/fengshows/284131f0-339f-11eb-aad2-7712ecbb555d
```
- 修改内容
```js
PUT /fengshows/fengshows/284131f0-339f-11eb-aad2-7712ecbb555d
{
    "title": "中缅建交70周年 开启全面经贸合作",
    "available": 1,
    "created_time": "2020-12-01T15:18:40.000Z",
    "modified_time": "2020-12-01T07:18:40.000Z",
    "resource_type": "awhile",
    "cover": "http://q1.fengshows.cn/mp/v/2020/12/01/218d3110-339f-11eb-9e16-a930eda4308a_cap.jpg",
    "source": "媒體號",
    "labels": [],
    "duration": 15,
    "__last_actived_time": "2020-12-08T18:28:58.420Z",
    "marks": [],
    "subscription_id": "57d3d510-e104-11e9-a731-f72af6941789",
    "cover_list": [],
    "comment_enabled": 1,
    "flags": [],
    "authorized_countries": [],
    "p": "超級鳳凰人中緬建交70週年 開啟全面經貿合作 媒體號 ",
    "tags": [
      {
        "_id": "54690349-ffff-433c-96b6-5105253c9164",
        "title": "超級鳳凰人"
      }
    ],
    "platforms": ["hkv-mobile"],
    "url": "http://q1.fengshows.cn/mp/v/2020/12/01/218d3110-339f-11eb-9e16-a930eda4308a_360.mp4",
    "width": 576,
    "height": 1024
  }
```