import _ from 'lodash';
import shttp from '../utils/shttp';

export default {
  login(params) {
    return shttp({
      url: '/auth/user/sign-in',
      method: 'post',
      data: _.pick(params, ['username', 'password']),
    });
  }
}; 