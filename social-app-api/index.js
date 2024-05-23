'use strict';

const _ = require('lodash');
const express = require('express');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const config = require('./config.js');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const logger = require('./logger.js')("social-api");
const moment = require('moment');

const AppInfo = require('./models/app_info.js')

app.set('api', 'prod')

app.set('getHeaderUMP', async () => {
  const txt = fs.readFileSync(path.join(__dirname, './.data.json'));
  const headers = JSON.parse(txt);
  const resp = await superagent.get(`http://ump-api.phoenixtv.com/user/detail?t=${Date.now()}`).set(headers);
  logger.info('fetch ump detail:', resp.status, resp.body.status)
  if (resp.body.status === '0') {
    logger.info(headers);
    return headers;
  } else if (resp.body.status === '-3002' || resp.body.status === '-3005' || resp.body.status === '-3003') {
    logger.debug('need login ump')
    const response = await superagent.post(`http://ump-api.phoenixtv.com/user/login`).send({
      "username": "ruanjiayou",
      "autoLogin": false,
    });
    if (response.statusCode === 200 && response.body.status === '0') {
      headers.token = response.body.data.jwtToken;
      headers['ump-ticket'] = response.body.data.token;
      fs.writeFileSync(path.join(__dirname, './.data.json'), JSON.stringify(headers));
      logger.info('ump header', headers);
      return headers;
    }
    logger.info('login result:', response.status, response.body.status);
    return null;
  }
  return null;
});
app.set('getApps', async () => {
  const headers = await app.get('getHeaderUMP')();
  const resp = await superagent.get('http://ump-api.phoenixtv.com/social-examine/products/apps?page=&page_size=50')
    .set(headers)
  return resp.statusCode === 200 && resp.body.status == '0' ? resp.body.data.docs : [];
})

app.use('/*', (req, res, next) => {
  req.app = app;
  next();
})
app.use(bodyParser.json({ limit: '3mb' }));

app.get('/', async (req, res) => {
  res.redirect('/social-examine')
})

app.get('/social-examine', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
  <html>
      <head>
        <title>ump获取授权</title>
        <style>
        .main {
          display: flex;
          flex-direction: row;
          height: 80vh;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .tip {
          position: absolute;
          top: 50vh;
          color: green;
        }
         a {
          color: white;
          padding: 10px;
          border-radius: 50px;
          text-decoration: none;
         }
         a:hover {
          opacity: 0.7;
         }
        </style>
      </head>
      <body>
        <div class="main">
          <a href="/social-examine/oauth/google/authorize" style="background-color: #e34f08;margin-right: 50px;">youtube授权</a>
          <a href="/social-examine/oauth/tiktok/authorize" style="background-color: #333;">tiktok授权</a>
          <div class="tip">
            
          </div>
        </div>
      </body>
    </html>`)
})

app.get('/social-examine/products/apps', async (req, res) => {
  const apps = await app.get('getApps')();
  res.json(apps)
})

app.get('/social-examine/ump-header', async (req, res) => {
  const headers = await app.get('getHeaderUMP')();
  res.json(headers);
});

app.get('/social-examine/refresh', async (req, res) => {
  logger.info('test refresh');
  // const apps = await AppInfo.find({ platform: { $in: ['youtube', 'tiktok'] } }).lean();
  try {
    const apps = await app.get('getApps')();
    res.header('Content-Type', 'text/html; charset=utf-8')
    const batch = apps.map(app => ({
      updateOne: {
        filter: { _id: app._id },
        update: {
          $set: _.omit(app, ['_id']),
        },
        upsert: true,
      }
    }));
    if (batch.length) {
      const result = await AppInfo.bulkWrite(batch);
      console.log(result)
    }
  } catch (e) {
    console.log(e);
  }
  res.end('全部结束');
})

app.use('/social-examine/oauth/tiktok', require('./routes/oauth/tiktok.js'));
app.use('/social-examine/oauth/google', require('./routes/oauth/google.js'));
app.use('/social-examine/tiktok', require('./routes/tiktok.js'));
app.use('/social-examine/google', require('./routes/google.js'));
app.use('/social-examine/stat', require('./routes/stat.js'));

mongoose.connect('mongodb://root:fengshows@10.0.15.240:27016,10.0.15.240:27017/ump_v1?authSource=admin&replicaSet=rs0').then(() => {
  app.listen(7000, function () {
    logger.info('express started at: 7000')
  })
}).catch(e => {
  console.log('connect db fail', e.message)
})