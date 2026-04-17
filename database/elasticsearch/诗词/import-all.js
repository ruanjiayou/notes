const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

// 统计字段名: 'author', 'paragraphs', 'rhythmic', 'tags', 'prologue'

const poetry_dir = '/Users/jiayou/projects/chinese-poetry';

async function importFile(filepath, type) {
  // 按文件批量导入
  const poetries = JSON.parse(fs.readFileSync(filepath));
  for (let i = 0; i < poetries.length; i++) {
    console.log(`${path.basename(filepath)} 导入进度: ${i}/${poetries.length}`);
    await syncOne(poetries[i], type);
  }
};

// 同步一条数据
async function syncOne(doc, type) {
  const title = type === 1 ? doc.title : (type === 2 ? doc.rhythmic : '');
  const section = type === 2 ? doc.prologue : '';
  return await client.index({
    index: 'shici', id: doc.id || uuid.v4(), body: {
      "created_time": new Date("2021-03-31T10:49:05.401Z"),
      "modified_time": new Date("2021-03-31T10:49:05.401Z"),
      "published_time": new Date("2021-03-31T10:49:05.401Z"),
      "available": 1,
      type,
      title,
      author: doc.author || '',
      section,
      paragraphs: doc.paragraphs,
      cover: '',
      tags: doc.tags || [],
      notes: doc.notes || [],
    }
  })
}
(async () => {
  // 扫描文件导入
  for (let i = 0; i < 57000; i += 1000) {
    console.log(`开始导入: ${i}`);
    await importFile(`${poetry_dir}/json/poet.tang.${i}.json`, 1);
  }
})();