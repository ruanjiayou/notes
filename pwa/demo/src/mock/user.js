import Mock from 'mockjs';

export default {
  login: config => {
    const data = JSON.parse(config.body);
    if (data.username === 'test' && data.password === '123456') {
      return {
        code: 0,
        data: { token: 'test' }
      }
    } else {
      return {}
    }
  },
  getArticles: config => {
    return Mock.mock({
      code: 0,
      'data|10': [{
        title: '@ctitle',
        content: '@cparagraph'
      }]
    })
  },
}