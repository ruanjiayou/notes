const mongoose = require('mongoose');
const { google } = require('googleapis');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const logger = require('../logger.js')('app');
const config = require('../config.js');
const _ = require('lodash');
const moment = require('moment');

const schema = new mongoose.Schema({
  _id: { type: String }
}, { strict: false, collection: 'social_app_info' });

schema.statics.getTokens = async function (app) {
  logger.info(`prepare refresh token: ${app._id}`);
  if (app.platform === "tiktok") {
    if (_.isEmpty(app.tokens)) {
      throw new Error(`tiktok ${app._id} token 未配置`);
    }
    const date = moment();
    // 预留10分钟
    if (
      Date.now() - 1000 * 60 * 10 >
      new Date(app.tokens.expiredAt).getTime()
    ) {
      const resp = await superagent
        .post(
          "https://business-api.tiktok.com/open_api/v1.3/tt_user/oauth2/refresh_token/"
        )
        .send({
          client_id: config.social.tiktok.app_id,
          client_secret: config.social.tiktok.clientSecret,
          grant_type: "refresh_token",
          refresh_token: app.tokens.refresh_token,
        })
        .proxy(process.env.HTTPS_PROXY);
      if (resp.statusCode === 200 && resp.body.code === 0) {
        const data = resp.body.data;
        data.expiredAt = date.add(1, "day").toDate();
        data.refreshExpiredAt = date.add(360, "day").toDate();
        await AppInfo.updateOne(
          { _id: app._id },
          { $set: { tokens: data } }
        );
        return data;
      } else {
        throw new Error(`${app._id} 刷新token失败`);
      }
    }
    return app.tokens;
  } else if (app.platform === "youtube") {
    if (_.isEmpty(app.tokens)) {
      return null;
    }
    if (Date.now() - 600000 > app.tokens.expiry_date) {
      const oauth2Client = new google.auth.OAuth2(
        config.social.youtube.web_json.client_id,
        config.social.youtube.web_json.client_secret,
        config.social.youtube.web_json.redirect_uris[0]
      );
      oauth2Client.setCredentials(app.tokens);
      try {
        const resp = await oauth2Client.refreshAccessToken();
        if (resp && resp.credentials) {
          await AppInfo.updateOne(
            { _id: app._id },
            { $set: { tokens: resp.credentials } }
          );
          return resp.credentials;
        }
        return null;
      } catch (e) {
        logger.error(`刷新 token 失败: ${app._id}`);
        await AppInfo.updateOne(
          { _id: app._id },
          { $set: { "config.invalid": true } }
        );
        return null;
      }
    }
    return app.tokens;
  }
};

const AppInfo = mongoose.model('AppInfo', schema);

module.exports = AppInfo;