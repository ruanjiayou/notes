const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

// 统计字段名: 'author', 'paragraphs', 'rhythmic', 'tags', 'prologue'

const poetry_dir = '/Users/jiayou/projects/chinese-poetry';

async function importFile(filepath) {
  // 按文件批量导入
  const poetries = JSON.parse(fs.readFileSync(filepath));
  for (let i = 0; i < poetries.length; i++) {
    console.log(`${path.basename(filepath)} 导入进度: ${i}/${poetries.length}`);
    await syncOne(poetries[i]);
  }
};

// 同步一条数据
async function syncOne(doc) {
  return await client.index({
    index: 'shici', id: uuid.v4(), body: {
      "created_time": new Date("2021-03-31T10:49:05.401Z"),
      "modified_time": new Date("2021-03-31T10:49:05.401Z"),
      "published_time": new Date("2021-03-31T10:49:05.401Z"),
      "available": 1,
      "type": 2,
      title: doc.rhythmic || '',
      author: doc.author || '',
      section: doc.prologue || '',
      paragraphs: doc.paragraphs,
      cover: '',
      tags: doc.tags || [],
    }
  })
}
(async () => {
  // 扫描文件导入
  for (let i = 0; i < 21000; i += 1000) {
    console.log(`开始导入: ${i}`);
    await importFile(`${poetry_dir}/ci/ci.song.${i}.json`);
  }
})();