const express = require('express');
const { google } = require('googleapis');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const router = express.Router();
const config = require('../../config.js');
const fs = require('fs');
const path = require('path')
const _ = require('lodash');
const logger = require('../../logger.js')('oauth-youtube');
const AppInfo = require('../../models/app_info.js');

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];


router.get(`/login`, async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>google授权</title>
      </head>
      <body>
        <div style="width: 80%; margin: 0 auto;">
          <h2 style="font-size: 24px;color:#444;"> 社交考核谷歌授權</h2>
          <pre style="color:grey;font-size: 17px;">獲取數據需要基本的查看權限,以下需要全部勾選</pre>
          <p>
            <a href="/social-examine/oauth/google/authorize">点击登录开始授权</a>(请在浏览器中打开)
          </p>
        </div>
      </body>
    </html>
  `);
});

router.get('/authorize', async (req, res) => {
  logger.info('authorize youtube')
  // 创建 OAuth2 客户端
  const oauth2Client = new google.auth.OAuth2(config.social.google.client_id, config.social.google.client_secret, config.social.google.redirect_uris[0]);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    // scope: [
    //   // 'https://www.googleapis.com/auth/youtube',
    //   'https://www.googleapis.com/auth/youtube.readonly',
    //   'https://www.googleapis.com/auth/youtubepartner',
    //   'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
    //   'https://www.googleapis.com/auth/yt-analytics.readonly',
    // ],
    include_granted_scopes: true
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  logger.info(`callback code:${req.query.code} error:${req.query.error}`);
  if (req.query.error) {
    return res.redirect('/social-examine/oauth/google/fail?message=' + req.query.error);
  }
  const code = req.query.code;
  const apps = await req.app.get('getApps')();
  const headers = await req.app.get('getHeaderUMP')();
  // 创建 OAuth2 客户端
  const oauth2Client = new google.auth.OAuth2(config.social.google.client_id, config.social.google.client_secret, config.social.google.redirect_uris[0]);
  try {
    let { tokens } = await oauth2Client.getToken(code);
    logger.info('youtube 授权', JSON.stringify(tokens))
    oauth2Client.setCredentials(tokens);
    const info = await oauth2Client.getTokenInfo(tokens.access_token);
    if (info.scopes.length !== scopes.length) {
      return res.redirect('/social-examine/oauth/google/fail?message=缺少權限,請授予彈框的全部權限');
    }
    // 先判斷 channel 是否添加到了 app 表
    const channelResp = await google.youtube({ auth: oauth2Client, version: 'v3' }).channels.list({ part: 'id,snippet,status', mine: true });
    logger.info('channels', JSON.stringify(channelResp.data.items));
    const channel = _.get(channelResp, 'data.items.0');
    if (channel) {
      const query = { platform: 'youtube', account_id: channel.snippet.customUrl.substr(1) };
      const app = apps.find(it => (it.account_id === query.account_id && it.platform === 'youtube'));
      if (!app) {
        return res.redirect('/social-examine/oauth/google/fail?message=當前賬號的 youtube 頻道未加入考核,請先聯繫開發人員添加');
      }
      const send_data = {
        tokens,
        config: {
          invalid: false,
          channel_id: channel.id,
          opend_revenue: _.get(channel, 'status.isChannelMonetizationEnabled', false)
        }
      };
      if (!tokens.refresh_token) {
        const refresh_token = _.get(app, 'tokens.refresh_token')
        if (!refresh_token) {
          console.log('没有 refresh_token')
          await oauth2Client.revokeToken(tokens.access_token)
          return res.redirect('/social-examine/oauth/google/fail?message=授权成功,但缺少refresh_token,需要再授权一次');
        } else {
          console.log('验证 refresh_token')
          tokens.refresh_token = refresh_token
          try {
            oauth2Client.setCredentials(tokens);
            const resp = await oauth2Client.refreshAccessToken()
            send_data.tokens = resp.credentials;
          } catch (e) {
            logger.error('refresh_token youtube', e.message)
            await AppInfo.updateOne({ _id: app._id }, { $set: { 'tokens.refresh_token': '' } })
            superagent.put(`http://ump-api.phoenixtv.com/social-examine/products/apps/${app._id}`)
              .set(headers || {})
              .send({ 'tokens.refresh_token': '' }).then(() => {
                console.log('清空 refresh_token')
              })
            await oauth2Client.revokeToken(tokens.access_token)
            return res.redirect('/social-examine/oauth/google/fail?message=授权成功,但缺少refresh_token,需要再授权一次');
          }
        }
      }
      await AppInfo.updateOne({ _id: app._id }, { $set: send_data });
      superagent.put(`http://ump-api.phoenixtv.com/social-examine/products/apps/${app._id}`)
        .set(headers || {})
        .send(send_data).then((resp) => {
          logger.info(`同步 app 成功: ${app._id}`, resp.status, resp.body)
        }).catch(e => {
          logger.error(`同步 app  失败: ${app._id}`, e.message)
        })
    } else {
      return res.redirect('/social-examine/oauth/google/fail?message=當前賬號的 youtube 頻道未加入考核,請先聯繫開發人員添加');
    }
    res.send(`
    <html>
      <head>
        <title>google授权成功</title>
      </head>
      <body>
        <p>
          授權成功, <a href="http://ump.phoenixtv.com/sight/posts_manage">回到ump</a>
        </p>
        <script>
          document.getElementById('error').innerHTML = new URL(window.location.href).searchParams.get('message');
        </script>
      </body>
    </html>
  `);

  } catch (e) {
    console.log(e.message)
    res.redirect('/social-examine/oauth/google/fail?message=' + e.message);
  }
});

router.post('/refresh_token', async (req, res) => {
  try {
    // 创建 OAuth2 客户端
    const oauth2Client = new google.auth.OAuth2(config.social.google.client_id, config.social.google.client_secret, config.social.google.redirect_uris[0]);
    oauth2Client.setCredentials(req.body);
    const resp = await oauth2Client.refreshAccessToken()
    console.log(resp.credentials)
    res.json(resp.credentials)
  } catch (e) {
    console.log(e.message);
    res.end('出现错误')
  }
});

router.get('/fail', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>google授权</title>
      </head>
      <body>
        <p>
          授权失败  <a href="/social-examine/oauth/google/login">重新授權</a>,请联系开发人员
          <br/>
          <span id="error" style="color:red;"></span>
        </p>
        <script>
          document.getElementById('error').innerHTML = new URL(window.location.href).searchParams.get('message');
        </script>
      </body>
    </html>
  `);
});

module.exports = router;