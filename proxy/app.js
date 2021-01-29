const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const argv = require('minimist')(process.argv.slice(2))

const app = express()
app.use('/path-to-api', createProxyMiddleware({
    target: argv.host,
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['access-control-allow-credentials'] = true
        proxyRes.headers['access-control-allow-origin'] = 'http://localhost:8001'
    }
}));

app.listen(7001, function () {
    console.log('proxy started at: 7000')
})
