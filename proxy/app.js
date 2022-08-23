const express = require('express')
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware')
const argv = require('minimist')(process.argv.slice(2))

const app = express();
const router = express.Router();
// 发送验证码
router.post('/validation/create', async (req, res, next) => {
    res.json({ status: '0', statusInfo: {} })
});
// 验证短信
router.get('/validation/check', async (req, res, next) => {
    res.json({ status: "0" });
});

app.use(bodyParser.json({ limit: '3mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '3mb', extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/', (req, res, next) => {
    console.log(req.method, req.url);
    console.log('\t', req.body);
    next();
});

// 订阅号服务
app.use('/api/v3/mp', createProxyMiddleware({
    target: 'http://localhost:8981',
    changeOrigin: true,
    pathRewrite: {
        '^/api/v3/mp': ''
    },
    onProxyReq: function (proxyReq, req, res, options) {
        if (req.body) {
            let bodyData = JSON.stringify(req.body);
            // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // stream the content
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:9527'
    }
}));

// 内容服务
app.use('/api/v3', createProxyMiddleware({
    target: 'http://localhost:8989',
    changeOrigin: true,
    pathRewrite: {
        '^/api/v3': ''
    },
    onProxyReq: function (proxyReq, req, res, options) {
        if (req.body) {
            let bodyData = JSON.stringify(req.body);
            // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // stream the content
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:9527'
    }
}));

// 评论服务
app.use('/comment', createProxyMiddleware({
    target: 'http://localhost:8988',
    changeOrigin: true,
    pathRewrite: {
        '^/comment': '/comment'
    },
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:9527'
    }
}));

// 计数服务(属于内容服务里的)
app.use('/count', createProxyMiddleware({
    target: 'http://localhost:8989/counter',
    changeOrigin: true,
    pathRewrite: {
        '^/count': ''
    },
    onProxyReq: function (proxyReq, req, res, options) {
        if (req.body) {
            let bodyData = JSON.stringify(req.body);
            // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // stream the content
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:9527'
    }
}));

// 用户服务
app.use('/user', createProxyMiddleware({
    target: 'http://localhost:8990',
    changeOrigin: true,
    pathRewrite: {
        '^/user': '/user'
    },
    onProxyReq: function (proxyReq, req, res, options) {
        if (req.body) {
            let bodyData = JSON.stringify(req.body);
            // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // stream the content
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:9527'
    }
}));

app.use('/apis', createProxyMiddleware({
    target: 'http://localhost:9090',
    changeOrigin: true,
    pathRewrite: {
        '^/apis': '/apis'
    },
    onProxyRes: function (proxyRes, req, res) {
        if (req.url === '/apis/' || req.url === '/apis') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.write(`
            <html>
                <head>
                    <title>api文档</title>
                </head>
                <body>
                    <div><a href="/apis/contentservice/">内容服务:contentservice</a></div>
                    <div><a href="/apis/commentservice/">评论服务:commentservice</a></div>
                    <div><a href="/apis/userservice/">用户服务:userservice</a></div>
                </body>
            </html>
            `)
            res.end();
        } else {
            proxyRes.headers['access-control-allow-credentials'] = true
            proxyRes.headers['access-control-allow-origin'] = 'http://localhost:8080'
        }
    }
}));

app.use('/sms-v3', router)

app.listen(80, function () {
    console.log('proxy started at: 80')
})
