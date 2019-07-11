import axios from 'axios';
import store from '../global-state';
import config from '../config';

const shttp = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? config.config.production.host : config.config.development.host,
  withCredentials: false,
  timeout: 5000
});

shttp.interceptors.request.use(
  config => {
    config.headers['Authorization'] = store.userInfo.accessToken;
    config.params = { token: store.userInfo.accessToken }
    return config;
  },
  error => {
    if (config.isDebug()) {
      console.log(error, 'request error');
    }
    return Promise.resolve(error);
  }
);

shttp.interceptors.response.use(
  response => {
    const res = response.data;
    // 干点什么
    if (res.state === 'success') {
      res.code = 0;
    }
    if(res.code === undefined){
      res.code = 0;
    }
    if (res && res.rdata !== undefined) {
      res.data = res.rdata;
      delete res.ecode;
      delete res.rdata;
    }
    return res;
  },
  error => {
    if (config.isDebug()) {
      console.log(error, 'response error');
    }
    return Promise.resolve(error);
  }
);

export default shttp;