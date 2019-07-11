import storage from './utils/storage';
import appModel from './models/app';
import userInfoModel from './models/userInfo';
import ArticleLoader from './data-loader/articleLoader';

// 全局状态.
const app = appModel.create({ accessTokenName: 'access-token' });
const target = {};
const userInfo = userInfoModel.create({ accessToken: storage.getValue(app.accessTokenName) || '' });

// loader
const articleLoader = ArticleLoader.create();

export default {
  app,
  target,
  userInfo,
  articleLoader
};