import Mock from 'mockjs'

import user from './user'

Mock.setup({
  timeout: '200-400'
});

Mock.mock(/\/auth\/user\/sign-in/, 'post', user.login);

export default Mock;