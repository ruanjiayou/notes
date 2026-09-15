# mcp笔记

## 测试(@modelcontextprotocol/inspector)
- 1.x版本,对应`@modelcontextprotocol/sdk`,测试命令是: `npx @modelcontextprotocol/inspector@1.0.0 http://127.0.0.1:8981/mcp`
- 2.x版本,对应`@modelcontextprotocol/server`,测试命令是: `npx @modelcontextprotocol/inspector@latest --catalog ~/.mcp-inspector/subscription-api.json`

## api_key鉴权中间件
```js
  const logger = require('../common/log')('middleware/OpenApiVerify');
  const jwt = require('jsonwebtoken');
  const config = require('../config').get();
  const i18n = require('i18next');
  const Member = require('../models/member_info');
  const SubscriptionOfficial = require('../models/subscription_official_info');
  const AccessKey = require('../models/access_key_info');

  module.exports = async function (req, res, next) {
    const token = req.header('authorization') || '';
    const [app_id, secret] = Buffer.from(token, 'base64').toString('utf-8').split('|');
    try {
      if (!app_id || !secret) {
        return res.json({ code: -1, message: 'api_key错误' })
      }
      const doc = await AccessKey.findOne({ access_key_id: app_id, secret_access_key: secret }).lean(true);
      if (!doc) {
        return res.json({ code: -1, message: 'api_key错误' })
      }
      if (!doc.enabled) {
        return res.json({ code: -1, message: 'api_key已失效' })
      }
      const member = await Member.findOne({ 'user._id': doc.user_id, 'subscription._id': doc.subscription_id }).lean(true)
      if (!member) {
        return res.json({ code: -1, message: '没有该订阅号访问权限' });
      }
      res.locals.user = member.user;
      res.locals.subscription = member.subscription;
      return next();
    } catch (err) {
      res.json({ code: -1, message: err.message })
    }
    return next();
  };
```

## 创建mcpServer对象
```js
  'use strict';

  const logger = require('../../common/log')('mcp/service');
  const StreamableHTTPServerTransport = require('@modelcontextprotocol/sdk/server/streamableHttp.js').StreamableHTTPServerTransport;
  const createMcpServer = require('./service');

  /**
   * mcp中间件
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   */
  module.exports = async function (req, res) {
    const mcpServer = createMcpServer(res.locals.user, res.locals.subscription)
    const transport = new StreamableHTTPServerTransport();
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res, req.body);
  };
```


## 注册tools
```js
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const _ = require('lodash');
const { z } = require("zod");
const models = require('../models/index');
const redis = require('../utils/redis');
const runCode = require('../utils/runner');
const getBrowser = require('../utils/pptr');

/**
 * 构造 MCP 工具标准返回结构
 * @param {boolean} isError - 是否为错误响应
 * @param {any} json - 要返回的数据（对象、数组、字符串等）
 * @returns {object} MCP 工具返回结构
 */
function format(isError, json) {
  // 统一转为字符串
  const text = typeof json === 'string'
    ? json
    : JSON.stringify(json);

  const result = {
    isError: Boolean(isError),
    content: [
      {
        type: 'text',
        text: text
      }
    ]
  }
  return result;
}
async function handle(fn) {
  try {
    const result = await fn();
    return format(false, result);
  } catch (err) {
    return format(true, err.message)
  }
}

module.exports = function createMcpServer() {
  const server = new McpServer({ name: "my-app", version: "1.0.0" });

  server.registerTool('test', {
    description: '测试tool',
    inputSchema: z.object({

    }).default({})
  }, async (args) => handle(async () => {
    return 'hello,world!'
  }));

  return server;
}
```
