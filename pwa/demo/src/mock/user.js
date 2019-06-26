import Mock from 'mockjs';

export default {
  login: config => {
    return {
      code: 0,
      data: { token: 'test' }
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