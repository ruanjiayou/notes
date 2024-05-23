const express = require('express');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const router = express.Router();
const moment = require('moment');
const config = require('../../config.js');
const _ = require('lodash');


router.get(`/login`, async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>tiktok授权</title>
      </head>
      <body>
        <p>
          <a href="/social-examine/oauth/tiktok/authorize">点击登录开始授权</a>(请在浏览器中打开)
        </p>
      </body>
    </html>
  `);
});

router.get('/authorize', async (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  res.cookie('csrfState', csrfState, { maxAge: 60000 });

  return res.redirect(`https://www.tiktok.com/v2/auth/authorize?client_key=${config.social.tiktok.app_id}&scope=user.info.basic%2Cuser.info.username%2Cuser.info.stats%2Cuser.account.type%2Cuser.insights%2Cvideo.list%2Cvideo.insights%2Ccomment.list&response_type=code&redirect_uri=${config.social.tiktok.redirect_uri}&state=${csrfState}`);
});

// 未记录的账号
// {"access_token":"act.2uxXJCFMF3lqk9Lo9Uxfr8OemNm8tX2VCL8y9HgJoBqw0YvSphC2rNM3dX9B!5308.va","expires_in":86400,"open_id":"-000qZS7Os6fiHsoD1JJbH8Z53m2KedrbyF2","refresh_token":"rft.MOEW5WVWbwd14NK8KYQ6BqjQY71Aa3oOagWsZZgTZYXV2eRESsGrT68H90g7!5339.va","refresh_token_expires_in":31536000,"scope":"comment.list,user.info.basic,user.info.username,user.info.stats,user.account.type,user.insights,video.list,video.insights","token_type":"Bearer"}
// { display_name: '哇嘎哩貢', username: 'wagaligong' }

router.get('/callback', async (req, res) => {
  if (req.query.error) {
    return res.redirect('/social-examine/oauth/tiktok/fail?message=授权请求被你拒绝');
  }
  if (!req.query.code) {
    return res.end('no code!')
  }
  const apps = await req.app.get('getApps')();
  // user 授权获取的 code 请求 business
  const date = moment();
  const resp = await superagent.post('https://business-api.tiktok.com/open_api/v1.3/tt_user/oauth2/token/')
    .proxy(process.env.HTTPS_PROXY)
    .send({
      client_id: config.social.tiktok.app_id,
      client_key: config.social.tiktok.app_id,
      client_secret: config.social.tiktok.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.social.tiktok.redirect_uri,
      auth_code: req.query.code,
    });
  console.info(`tiktok auth: ${JSON.stringify(resp.body)}`, resp.status);

  if (resp.status !== 200 || resp.body.code !== 0) {
    res.redirect('/social-examine/oauth/tiktok/fail?message=' + (resp.status === 200 ? resp.body.message : '请求失败'));
  } else {
    resp.body.data.expiredAt = moment().add(1, 'd').toDate();
    console.log(resp.body.data.expiredAt)
    // 权限验证
    const scopesResp = await superagent.post('https://business-api.tiktok.com/open_api/v1.3/tt_user/token_info/get/')
      .proxy(process.env.HTTPS_PROXY)
      .send({
        "app_id": config.social.tiktok.app_id,
        "access_token": resp.body.data.access_token,
      });
    if (scopesResp.status !== 200) {
      res.redirect('/social-examine/oauth/tiktok/fail?message=权限验证失败');
    } else {
      const set = new Set(_.get(scopesResp, 'body.data.scope', '').split(',').map(s => s.trim()));
      let scopeLoss = [];
      'user.info.basic,user.info.stats,video.list,comment.list,user.account.type,user.insights,user.info.username,video.insights'.split(',').forEach(s => {
        if (!set.has(s)) {
          scopeLoss.push(s);
        }
      });
      if (scopeLoss.length) {
        res.redirect(`/social-examine/oauth/tiktok/fail?message=缺少权限:${scopeLoss.join(',')}`);
      } else {
        res.redirect('/social-examine/oauth/tiktok/success');
        const account_resp = await superagent.get(`https://business-api.tiktok.com/open_api/v1.3/business/get/?business_id=${resp.body.data.open_id}&fields=["username","display_name"]`)
          .set({
            'Content-Type': 'application/json',
            'Access-Token': resp.body.data.access_token,
          })
          .proxy(process.env.HTTPS_PROXY)
        console.log(account_resp.body, account_resp.status);
        const app = apps.find(app => (app.account_id === account_resp.body.data.username && app.platform === 'tiktok'));
        if (account_resp.statusCode === 200 && app) {
          const headers = await req.app.get('getHeaderUMP')();
          superagent.put(`${req.app.get('api') === 'dev' ? 'http://127.0.0.1:8080' : 'http://ump-api.phoenixtv.com'}/social-examine/products/apps/${app._id}`)
            .set(headers || {})
            .send({
              tokens: resp.body.data,
              config: { creator_id: resp.body.data.open_id }
            }).then((resp) => {
              console.log(`同步 app 成功: ${app._id}`, resp.status, resp.body)
            }).catch(e => {
              console.log(`同步 app  失败: ${app._id}`, e.message)
            })
        } else {
          console.log(`未找到APP: ${resp.body.data.open_id}`);
        }
      }
    }
  }
});

router.get('/success', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>tiktok授权</title>
      </head>
      <body>
        <p>
          授权成功, 回到<a href="http://ump.phoenixtv.com">ump</a>
        </p>
      </body>
    </html>
  `);
});

router.get('/fail', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>tiktok授权</title>
      </head>
      <body>
        <p>
          授权失败,请联系开发人员.<a href="/social-examine/oauth/tiktok/login">重新授权</a>
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

router.get('/abort', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>tiktok授权</title>
      </head>
      <body>
        <p>
          授权已中止,<a href="/social-examine/oauth/tiktok/login">点击重试授权</a>
        </p>
      </body>
    </html>
  `);
});

module.exports = router;