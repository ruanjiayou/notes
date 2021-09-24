const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

const mapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    fengshows: {
      properties: {
        title: {
          type: 'text',
          analyzer: 'ik_max_word',
          search_analyzer: 'ik_max_word',
        },
        available: {
          type: 'integer',
        },
        created_time: {
          type: 'date',
        },
        modified_time: {
          type: 'date',
        },
        resource_type: {
          type: 'keyword',
        },
        resource_id: {
          type: 'keyword',
        },
        display_type: {
          type: 'integer',
        },
        cover: {
          type: 'text',
        },
        source: {
          type: 'text',
        },
      },
    },
  },
}
// client.on('request', (err, meta) => {
//   console.log(err || meta)
// });

// 创建索引
// client.indices.create({ index: 'global_es', include_type_name: true, body: mapping })
// 查看插件
// client.cat.plugins().then(result => {
//   console.log(result.body);
// })

// 查看索引
// client.cat.indices({ index: 'test-index' }).then(result => {
//   console.log(result.meta.request.params)
//   console.log(result.body)
// })

// 同步一条数据
// client.index({
//   index: 'test-index', body: {
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
//   index: 'test-index', body: {
//     query: {
//       match: { title: '基地' }
//     }
//   }
// }).then(result => {
//   console.log(result.meta.request.params)
//   console.log(result.body.hits.hits)
// })

// 根据 id 查询记录.http://localhost:9200/test-index/fengshows/UmYnn3oBEVGA63Euqvt0?pretty