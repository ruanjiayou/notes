import store from './utils/storage';
import appModel from './models/app';
import userInfoModel from './models/userInfo';
import ArticleLoader from './data-loader/articleLoader';

// 全局状态.
const app = appModel.create({});
const target = {};
const userInfo = userInfoModel.create({ accessToken: store.getValue('access-token') });

// loader
const articleLoader = ArticleLoader.create();

export default {
  app,
  target,
  userInfo,
  articleLoader
};