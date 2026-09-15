const _ = require('lodash');

export class ESQuery {
  constructor() {
    this.body = {
      size: 20,
      from: 0,
      min_score: 0,
      _source: ['_id', 'title', 'content', 'cover', 'type', 'types', 'tags', 'publishedAt'],
      sort: [{ "_score": { "order": "desc" } }],
      query: {
        bool: {
          filter: [],
        }
      }
    };
  }

  async build(qid) {
    const ids = qid.split(',').sort();
    const hash = crypto.createHash('md5').update(ids.join(',')).digest('hex');
    // const docs = await model.find({ _id: { $in: ids } }).lean(true)
    const docs = [
      { _id: '1', type: 'base', value: { size: 20 } },
      { _id: '1.5', type: 'sort', value: { "updatedAt": { "order": "desc" } } },
      { _id: '2', type: 'where', value: { type: 5 } },
      { _id: '3', type: 'where', value: { tags: ['校园', '校園'] } },
      { _id: '4', type: 'where', value: { tags: ['风景'] } },
      {
        _id: '5', type: 'where', value: {
          range: {
            updatedAt: {
              "gte": 2020,
              "lte": 2024
            }
          }
        }
      },
      {
        _id: '6', type: 'where', value: {
          range: {
            updatedAt: {
              "gte": 2000,
              "lte": 2004
            }
          }
        }
      },
    ]
    const groups = _.groupBy(docs, 'type');
    const filter = {};
    Object.keys(groups).forEach(type => {
      groups[type].forEach(d => {
        if (type === 'base') {
          _.assign(this.body, _.pick(d.value, ['size', '_source']))
        } else if (type === 'sort') {
          this.body.sort.unshift(d.value)
        } else if (type === 'where') {
          const field = Object.keys(d.value)[0];
          const value = d.value[field];
          const isArr = _.isArray(value)
          if (filter[field]) {
            isArr ? filter[field].push(...value) : filter[field].push(value)
          } else {
            filter[field] = isArr ? value : [value];
          }
        }
      })
    });
    Object.keys(filter).forEach(k => {
      this.body.query.bool.filter.push({ items: { [k]: filter[k] } })
    })
    return this;
  }
}

const query = await new ESQuery().build('')
console.log(JSON.stringify(query.body, null, 2))