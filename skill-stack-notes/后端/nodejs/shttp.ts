import fetch, { Headers } from "node-fetch";
import fs from "fs";
import FormData from 'form-data'
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util'
import _ from "lodash";
import path from "path";

const streamPipeline = promisify(pipeline);

interface request {
  option: any;
  cb?: Function;
  onProgress?: Function;
  on(event: string, fn: Function): this;
  off(event: string): this;
  events: { [key: string]: Function };
}
class request {
  constructor(url: string, method: string, filepath?: string) {
    this.option = {
      method,
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36'
      },
      // null或者 Readable stream
      body: null,
      // follow,manual,error
      redirect: 'follow',
      signal: null,
      // 跟随重定向的次数
      follow: 4,
      // 是否支持gzip/deflate
      compress: true,
      // 响应实体最大字节限制
      size: 0,
      // 代理设置.proxy => agent
      agent: null,
      highWaterMark: 16384,
      insecureHTTPParser: true,

      // 自定义字段
      proxy: '',
      // 发送json数据
      json: true,
      callback: null,
      events: {},
      query: {},
      files: null,
      // 下载的本地路径
      filepath,
    }
  }

  setOption(name: string, value: any) {
    this.option[name] = value;
    return this;
  }

  callback(cb: Function) {
    this.cb = cb;
    return this;
  }

  progress(fn: Function) {
    this.onProgress = fn;
    return this;
  }
  /**
   * 添加事件
   * @param {string} event 事件名称
   * @param {function} cb 触发函数
   * @returns 
   */
  on(event: string, cb: Function) {
    this.events[event] = cb;
    return this;
  }
  /**
   * 删除事件
   * @param {string} event 事件名称
   * @returns 
   */
  off(event: string) {
    delete this.events[event];
    return this;
  }

  setHeader(name: string, value: string) {
    this.option.headers[name] = value;
    return this;
  }
  /**
   * 设置get请求的search 不能直接传k1=v1&k2=v2
   * @param {string|object} v1 请求的search部分
   */
  query(v1: string | object, v2: object) {
    if (typeof v1 === 'string' && typeof v2 === 'string') {
      this.option.query[v1] = v2;
    } else {
      this.option.query = Object.assign(this.option.query, v1);
    }
    return this;
  }
  /**
   * 设置请求的body
   * @param {string|object} v1 
   */
  send(data: string | object) {
    this.option.body = data;
    return this;
  }

  attach(name: string, filepath: string) {
    let files: { [key: string]: string } = {};
    this.option.json = false;
    this.option.headers['Content-Type'] = undefined;
    if (typeof name === 'string') {
      files[name] = filepath;
    } else {
      files = name;
    }
    if (this.option.files === null) {
      this.option.files = {}
    }
    for (let k in files) {
      this.option.files[k] = files[k];
    }
    return this;
  }

  _generateParam() {
    const param = {
      method: this.option.method,
      agent: null as any,
      headers: new Headers(this.option.headers),
      body: this.option.body,
      redirect: this.option.redirect,
      follow: this.option.follow,
      signal: this.option.signal,
      compress: this.option.compress,
      size: this.option.size,
      highWaterMark: this.option.highWaterMark,
      insecureHTTPParser: this.option.insecureHTTPParser,
    }
    if (this.option.json && param.body) {
      param.body = JSON.stringify(param.body);
    } else if (this.option.files) {
      const form = new FormData({})
      Object.keys(this.option.files).forEach(key => {
        const filepath = this.option.files[key]
        if (typeof filepath === 'string') {
          // form.set(key, fileFromSync(filepath, 'image/jpeg', { highWaterMark: 2 * 1024 * 1024 }), 'test.jpeg');
          form.append(key, fs.readFileSync(filepath), { filename: path.basename(filepath) })
        } else if (filepath instanceof Array) {
          // TODO:
        }
      })
      param.body = form;
    }
    if (this.option.proxy) {
      // TODO: proxy
      // param.agent = this.option.url.startsWith('https') ? new HttpsProxyAgent(this.option.proxy) : new HttpProxyAgent(this.option.proxy);
    }
    return param;
  }
  async then(cb?: Function) {
    let href = this.option.url;
    if (_.isPlainObject(this.option.query) && this.option.query !== null) {
      const uri = new URL(this.option.url);
      for (let k in this.option.query) {
        uri.searchParams.set(k, this.option.query[k])
      }
      href = uri.toString()
    }
    const response = await fetch(href, this._generateParam());
    if (response.ok) {
      // 显示进度
      const total = parseInt(response.headers.get('content-length') || '0', 10);
      let count = 0;
      const print = _.throttle(() => {
        this.onProgress && this.onProgress(count, total);
      }, 500);

      if (response.headers.get('Content-Type').includes('application/json')) {
        const res = await response.json();
        cb && cb(res)
        return res;
      } else if (this.option.filepath) {
        return await new Promise((resolve, reject) => {
          response.body.on('data', chunk => {
            count += chunk.length;
            print();
          });
          response.body.on('error', err => {
            reject(err);
          });
          response.body.on('end', () => {
            cb && cb();
            resolve(true)
          })
          streamPipeline(response.body, createWriteStream(this.option.filepath));
        })
      } else {
        const res = await response.text();
        cb && cb(res)
        return res;
      }
    } else {
      Promise.reject(response);
    }
  }
}

const shttp = {
  head: (url: string) => new request(url, 'HEAD'),
  get: (url: string) => new request(url, 'GET'),
  post: (url: string) => new request(url, 'POST'),
  put: (url: string) => new request(url, 'PUT'),
  delete: (url: string) => new request(url, 'DELETE'),
  patch: (url: string) => new request(url, 'PATCH'),
  download: (url: string, filepath: string) => new request(url, 'GET', filepath),
}

export default shttp;