import axios from 'axios';
import store from '../global-state';
import config from '../config';

const shttp = axios.create({
  baseURL: process.env.NODE_ENV == 'production' ? config.config.production.host : config.config.dev.host,
  withCredentials: false,
  timeout: 5000
});

shttp.interceptors.request.use(
  config => {
    config.headers['x-token'] = store.userInfo.accessToken;
    return config;
  },
  error => {
    if (config.isDebug()) {
      console.log(error, 'request error');
    }
    return Promise.reject(error);
  }
);

shttp.interceptors.response.use(
  response => {
    const res = response.data;
    // 干点什么
    return res;
  },
  error => {
    if (config.isDebug()) {
      console.log(error, 'response error');
    }
    return Promise.reject(error);
  }
);

export default shttp;