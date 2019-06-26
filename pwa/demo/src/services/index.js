import _ from 'lodash';
import shttp from '../utils/shttp';

export default {
  login(params) {
    return shttp({
      url: '/auth/user/sign-in',
      method: 'post',
      data: _.pick(params, ['username', 'password']),
    });
  },
  async getArticles(params) {
    const result = await shttp({
      url: '/user/articles',
      method: 'get',
      params: { page: params.page }
    });
    return { items: result.data, ended: false };
  }
}; 