const _ = require('lodash');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

async function search(options) {
  // 搜索
  const response = await client.search({
    index: 'shici', body: {
      size: options.limit,
      from: options.skip,
      min_score: 0,
      _source: ['title', 'author', 'paragraphs', 'section', 'type', 'tags', 'notes'],
      // sort: ['_score'],
      query: {
        bool: {
          must: [
            { term: { available: 1 } },
            { term: { type: 2 } },
            { term: { author: '苏轼' } },
          ],
          // filter: [
          //   {
          //     bool: {
          //       should: [
          //         {
          //           match: {
          //             paragraphs: {
          //               query: options.q,
          //               analyzer: 'ik_smart'
          //             }
          //           },
          //         },
          //         {
          //           term: { title: options.q }
          //         }
          //       ]
          //     }
          //   }
          // ]
        }
      },
      highlight: {
        pre_tags: ['<span style="color: red">'],
        post_tags: ['</span>'],
        fields: {
          title: { number_of_fragments: 1 },
          // p: { number_of_fragments: 2, fragment_size: 25 }
        }
      }
    }
  })
  return response.body.hits.hits.map(doc => { doc._source._id = doc._id; return doc._source });
}

(async () => {
  const results = await search({
    limit: 15,
    skip: 50,
    q: '水调歌头'
  });
  console.log(results);
})();