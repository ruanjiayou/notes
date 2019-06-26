import Mock from 'mockjs'

import user from './user'

Mock.setup({
  timeout: '500'
});

Mock.mock(/\/auth\/user\/sign-in/, 'post', user.login);
Mock.mock(/\/user\/articles/, user.getArticles);

export default Mock;