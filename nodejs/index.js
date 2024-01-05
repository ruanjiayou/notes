const express = require('express')
const PNGlib = require('node-pnglib');
const ngrok = require('ngrok');
const app = express()
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const bodyParser = require('body-parser');
const got = require('got').default;
const FormData = require('form-data');
const qs = require('qs');

const filepath = path.normalize(__dirname + '/../../subscription-api/');
app.use(bodyParser.json({ limit: '3mb' }));
app.use(bodyParser.urlencoded({ limit: '3mb', extended: false }))
app.use(express.static('./static'));

app.get('/test/png', async (req, res, next) => {
  let png = new PNGlib(150, 150);
  for (let i = 20; i < 100; i++) {
    for (let j = 20; j < 100; j++) {
      png.setPixel(i + 10, j + 25, '#cc0044');
      png.setPixel(i + 20, j + 10, '#0044cc');
      png.setPixel(i + 30, j, '#00cc44');
    }
  }
  res.setHeader('Content-Type', 'image/png');
  res.end(png.getBuffer());
})

app.post('/test/return/json', async (req, res) => {
  console.log(req.body, 'body')
  res.json(req.body);
})

app.get('/test/got-form', async (req, res) => {
  const form = new FormData();
  form.append('a', 3);
  form.append('b', 'fuck');
  // const data = await got.post('http://localhost:7003/test/return/json', {
  //   body: JSON.stringify({ a: 3, b: 'fuck' }),//'a=3&b=fuck',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   }
  // }).json();

  console.log(form.getHeaders());
  console.log(qs.stringify({ a: 3, b: 'fuck' }));
  const data = await got.post('http://localhost:7003/test/return/json', {
    body: qs.stringify({ a: 3, b: 'fuck' }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
  }).json();
  res.json(data);
})

app.listen(7003, function () {
  console.log('express started at: 7003')
})
