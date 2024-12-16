const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

// title/rhythmic author prologue paragraphs tags  chapter/section type id notes
// 1 唐诗 author paragraphs notes id tags title
// 2 宋词 'author', 'paragraphs', 'rhythmic'(title), 'tags', 'prologue'(section)
// 3 楚辞 title section author content(paragraphs)
// 4 论语 chapter(section) paragraphs
const mapping = {
  "settings": {
    "index": {
      "analysis.analyzer.default.type": "ik_max_word"
    }
  },
  "mappings": {
    "fengshows": {
      "properties": {
        // 1 诗 2 词 3 楚辞 4 论语
        "type": {
          "type": "byte"
        },
        "title": {
          "type": "text"
        },
        "section": {
          "type": "text"
        },
        "author": {
          "type": "keyword"
        },
        "created_time ": {
          "type": "date"
        },
        "modified_time": {
          "type": "date"
        },
        "published_time": {
          "type": "date"
        },
        "available": {
          "type": "byte"
        },
        // 句数组
        "paragraphs": {
          "type": "text"
        },
        "cover": {
          "type": "text",
          "index": false
        },
        // 标签数组
        "tags": {
          "type": "keyword"
        },
        "notes": {
          "type": "text",
          "index": false
        },
      }
    }
  }
}

// 创建索引
client.indices.delete({ index: 'shici' }).then(() => {
  client.indices.create({ index: 'shici', include_type_name: true, body: mapping })
});
