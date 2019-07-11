export default {
  isDebug() {
    return process.env.NODE_ENV !== 'production';
  },
  config: {
    production: {
      host: 'http://localhost:3000/v1',
    },
    development: {
      host: 'http://password.jiayou.com',
    }
  },
  menus: [
    {
      name: 'home',
      title: '首页',
      icon: 'FaHome'
    },
    {
      name: 'hot',
      title: '热门',
      icon: 'FaFire'
    },
    {
      name: 'demo',
      title: 'demo',
      icon: 'FaPlus'
    },
    {
      name: 'found',
      title: '发现',
      icon: 'FaSearch'
    },
    {
      name: 'my',
      title: '我的',
      icon: 'FaUser'
    },
  ]
};