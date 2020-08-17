const mongoose = require('mongoose');
mongoose.connect('mongodb://root:123456@192.168.99.100:27017/novel?authSource=admin=readPreference=primaryPreferred');
const model = mongoose.model('resources', new mongoose.Schema({}, { strict: false }));

const msModels = require('./models/index');

(async () => {
  let len = 0, limit = 10, offset = 0, count = 0;
  do {
    console.log(`开始 ${len + offset}-${offset + len + limit}`);
    const buff = [];
    const result = await msModels['Article'].findAll({ limit, offset });
    len = result.length;
    offset += limit;
    count += len;
    for (let i = 0; i < result.length; i++) {
      // id/catalogId/status/origin/title/tags/poster/content/
      let data = result[i].toJSON();
      buff.push({
        updateOne: {
          filter: { source_type: 'article', source_id: data.id + '' },
          update: {
            title: data.title,
            status: '',
            origin: data.origin || '',
            country: 'China',
            source_type: 'article',
            source_id: data.id + '',
            type: 'article',
            poster: '',
            url: '',
            tags: data.tags.split(','),
            status: 'finished',
            open: false,
            createdAt: data.createdAt,
            words: data.content.length,
            content: data.content,
          },
          upsert: true,
        }
      });
    }
    if (buff.length) {
      await model.bulkWrite(buff);
    }
  } while (len === limit);
  console.log('共' + count);
  process.exit(0);
})();