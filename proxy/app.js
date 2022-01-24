const express = require('express')
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware')
const argv = require('minimist')(process.argv.slice(2))

const app = express();

app.use(bodyParser.json({ limit: '3mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '3mb', extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/', (req, res, next) => {
    console.log(req.method, req.url);
    console.log('\t',req.body);
    next();
});

// 订阅号服务
app.use('/api/v3/mp', createProxyMiddleware({
    target: 'http://localhost:8981',
    changeOrigin: true,
    pathRewrite: {
        '^/api/v3/mp': ''
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
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:9527'
    }
}));

app.listen(80, function () {
    console.log('proxy started at: 80')
})
