
文档(控制台测试) http://mockjs.com/examples.html

`注意`
- mock了url就会被拦截,baseUrl此时无效,想要部分拦截就把不想拦截的注释掉
- url规则全部用正则,不要问为什么

返回object和array
```js
var m = require('mockjs').mock;
var Random = require('mockjs').Random;

var result = {
  data: {
    username: m('@cname'),
    password: m('@string("lower",6,12)'),
    avatar: m('@url'),
    id: m('@increment'),
    _id: m('@uuid'),
    created: m('@datetime'),
    introduce: m('@csentence')
  },
  code: m('@number'),
  error: m('@sentile')
}

var results = {
  data: [],
  pager: {
    limit: m('@natural(5,10)'),
    page: m('@natural(5,10)'),
    count: m('@natural(5,10)'),
    total: m('@natural(5,10)')
  }
}
for (let i = 0; i < 10; i++) {
  results.data.push({
    title: m('@ctitle(5,10)'),
    id: m('@increment'),
    _id: m('@uuid'),
    content: m('@cparagraph')
  })
}

console.log(result)
console.log(results)

```