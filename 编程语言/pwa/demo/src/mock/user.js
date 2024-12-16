import Mock from 'mockjs';

export default {
  login: config => {
    const data = JSON.parse(config.body);
    if (data.account === 'test' && data.password === '123456') {
      return {
        code: 0,
        data: { token: 'test' },
      }
    } else {
      return {
        code: -1,
        message: '账号或密码错误',
      }
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