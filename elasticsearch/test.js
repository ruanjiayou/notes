const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

const mapping = {
  "settings": {
    "index": {
      "analysis.analyzer.default.type": "ik_max_word"
    }
  },
  "mappings": {
    "fengshows": {
      "properties": {
        "__last_actived_time": {
          "type": "date",
          "index": false
        },
        "announcement": {
          "type": "text"
        },
        "area": {
          "type": "keyword"
        },
        "author": {
          "type": "keyword"
        },
        "available": {
          "type": "byte"
        },
        "brief": {
          "type": "text"
        },
        "category_name ": {
          "type": "keyword"
        },
        "content": {
          "type": "text"
        },
        "cover": {
          "type": "text",
          "index": false
        },
        "created_time ": {
          "type": "date"
        },
        "display_type": {
          "type": "byte"
        },
        "duration": {
          "type": "long"
        },
        "host": {
          "type": "keyword"
        },
        "keywords": {
          "type": "text"
        },
        "labels": {
          "type": "text"
        },
        "modified_time": {
          "type": "date"
        },
        "naming": {
          "type": "text"
        },
        "p": {
          "type": "text"
        },
        "program_name": {
          "type": "keyword"
        },
        "resource_id": {
          "type": "keyword",
          "index": false
        },
        "resource_type": {
          "type": "keyword"
        },
        "source": {
          "type": "keyword"
        },
        "tags": {
          "properties": {
            "_id": {
              "type": "text",
              "index": false
            },
            "title": {
              "type": "text"
            }
          }
        },
        "title": {
          "type": "text"
        },
        "category_id": {
          "type": "keyword"
        },
        "program_id": {
          "type": "keyword",
          "index": false
        },
        "program_icon": {
          "type": "text",
          "index": false
        },
        "type": {
          "type": "byte",
          "index": false
        },
        "url": {
          "type": "text",
          "index": false
        },
        "width": {
          "type": "integer",
          "index": false
        },
        "height": {
          "type": "integer",
          "index": false
        },
        "icon": {
          "type": "text",
          "index": false
        },
        "live_type": {
          "type": "keyword"
        },
        "live_status": {
          "type": "byte"
        },
        "start_time": {
          "type": "date"
        },
        "marks": {
          "type": "text"
        },
        "subscription_id": {
          "type": "keyword"
        },
        "author_name": {
          "type": "keyword"
        },
        "cover_list": {
          "type": "text"
        },
        "target_platforms": {
          "type": "text"
        },
        "platforms": {
          "type": "keyword"
        },
      }
    }
  }
}
// client.on('request', (err, meta) => {
//   console.log(err || meta)
// });

// 创建索引


// 删除索引
client.indices.delete({ index: 'fengshows' }).then(()=>{
  client.indices.create({ index: 'fengshows', include_type_name: true, body: mapping })
});

// 查看插件
// client.cat.plugins().then(result => {
//   console.log(result.body);
// })

// 查看索引
// client.cat.indices({ index: 'fengshows' }).then(result => {
//   console.log(result.meta.request.params)
//   console.log(result)
// })

// 同步一条数据
// client.index({
//   index: 'fengshows', body: {
//     "__last_actived_time": new Date("2021-03-31T10:49:05.401Z"),
//     "__v": 0,
//     "allow_comment": 1,
//     "authorized_countries": [],
//     "available": 1,
//     "brief": "根據“十四五”規劃綱要，“便利港澳青年到大灣區內地城市就學就業創業，打造粵港澳青少年交流精品品牌”被重點提及。基於此，廣東省積極推出各項政策支持港澳青年到內地創新創業。粵港澳大灣區創新創業孵化基地29日正式營業。目前，40家入駐團隊中包括6個港澳團隊、9個港澳初創企業。 ",
//     "category_id": "video_finance",
//     "comment_enabled": 1,
//     "config_score": 0,
//     "cover": "http://c1.fengshows-cdn.com/a/2021_14/a96e6cd832b8432.png",
//     "cover_list": [],
//     "created_time": new Date("2021-03-30T12:57:39.000Z"),
//     "duanmu_enabled": 0,
//     "duration": 219,
//     "episode": "2021-03-30",
//     "flags": [],
//     "labels": [
//       "粵港澳大灣區"
//     ],
//     "marks": [],
//     "material_id": "81aec930-9157-11eb-8107-195bb48668d9",
//     "modified_time": new Date("2021-03-30T11:55:00.000Z"),
//     "program_icon": "https://fengshows.oss-cn-hongkong.aliyuncs.com/app/u/2020/04/24/16ebf340-8602-11ea-88c0-8532c0f49738.png",
//     "program_id": "2752e260-990d-11eb-9bd0-d327100b92a5",
//     "program_name": "新聞朋友圈",
//     "resource_type": "video",
//     "scheduled_day": 30,
//     "scheduled_month": 3,
//     "scheduled_time": new Date("2016-08-02T09:48:48.525Z"),
//     "scheduled_year": 2021,
//     "send_subscription": 0,
//     "subscription_id": "298aa4b0-8602-11ea-8037-153953a345c8",
//     "title": "灣區創業基地開園 港澳項目或超70%",
//     "type": 1
//   }
// }).then(result => {
//   console.log(result)
// })

// 搜索
// client.search({
//   index: 'fengshows', body: {
//     query: {
//       match: { title: '之' }
//     }
//   }
// }).then(result => {
//   console.log(result.meta.request.params)
//   console.log(result.body.hits.hits)
// })

// 根据 id 查询记录.http://localhost:9200/fengshows/fengshows/UmYnn3oBEVGA63Euqvt0?pretty

/**
 GET /fengshows/fengshows/_search?explain=true
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
        "target_countries_and_regions",
        "target_platforms",
        "content",
        "icon",
        "tags",
        "p",
        "platforms",
        "authorized_countries"
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
                        "query": "美國人",
                        "boost": 5
                      }
                    }
                  },
                  {
                    "match": {
                      "p": {
                        "query": "美國人"
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
                              "live"
                            ]
                          }
                        },
                        {
                          "range": {
                            "modified_time": {
                              "gte": 0,
                              "lte": 1652861122099,
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
                  },
                  {
                    "term": {
                      "live_type": "business"
                    }
                  }
                ]
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "match": {
                      "title": {
                        "query": "美國人",
                        "boost": 5
                      }
                    }
                  },
                  {
                    "match": {
                      "p": {
                        "query": "美國人"
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
                              "ticker",
                              "article",
                              "video",
                              "program",
                              "awhile",
                              "special",
                              "subscription"
                            ]
                          }
                        },
                        {
                          "range": {
                            "modified_time": {
                              "gte": 0,
                              "lte": 1652861122100,
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
 */
// client.search({ "index": "fengshows", "body": { "size": 30, "from": 60, "_source": ["_id", "title", "available", "created_time", "modified_time", "resource_type", "resource_id", "article_type", "display_type", "cover", "source", "url", "width", "height", "category_id", "display_type", "type", "program_id", "program_name", "episode", "material_id", "icon", "labels", "duration", "program_icon", "category_key", "marks", "subscription_id", "subscription_name", "subscription_icon", "cover_list", "subscription_type", "live_type", "app_url", "medals", "certification_type", "flags", "width", "height", "duanmu_enabled", "comment_enabled", "brief", "category", "certificate", "discard", "media_type", "images", "videos", "topic", "related_topic", "ref_resource", "location", "creator", "scheduled_time", "current_language", "translation_languages", "translations", "authorized_countries", "content", "icon", "tags", "p", "nickname", "memo"], "sort": ["_score", { "modified_time": "desc" }], "query": { "bool": { "should": [{ "bool": { "should": [{ "match": { "p": { "query": "中国" } } }, { "match": { "title": { "query": "中国", "boost": 5 } } }], "filter": [{ "term": { "available": 1 } }, { "terms": { "resource_type": ["dynamic"] } }] } }, { "bool": { "should": [{ "match": { "p": { "query": "中国" } } }, { "match": { "title": { "query": "中国", "boost": 5 } } }], "filter": [{ "term": { "available": 1 } }, { "terms": { "resource_type": ["user", "subscription", "label"] } }] } }] } }, "highlight": { "pre_tags": ["<span style=\"color: #E3B56F\">"], "post_tags": ["</span>"], "fields": { "title": { "number_of_fragments": 0 }, "p": { "number_of_fragments": 2, "fragment_size": 25 } } } } })
