export default {
  isDebug() {
    return process.env.NODE_ENV !== 'production';
  },
  config: {
    production: {
      host: 'http://localhost:3000/v1',
    },
    dev: {
      host: 'http://pwa.jiayou.com',
    }
  }
};