const express = require('express')
const PNGlib = require('node-pnglib');
const ngrok = require('ngrok');
const app = express()
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const bodyParser = require('body-parser');
const amqplib = require('amqplib');

let channel = null;
async function initMQ(client) {
  const queue = 'transcode', exchange = 'task';
  channel = await client.createConfirmChannel();
  channel.on('error', function (err) {
    channel = null;
    console.log(`mq channel err: ${err.message}`);
    setTimeout(() => {
      initMQ(client);
    }, 1000);
  });
  await channel.assertQueue(queue, { durable: true, autoDelete: false });
  await channel.assertExchange(exchange, 'topic', { durable: true, autoDelete: false });
  await channel.bindQueue(queue, exchange, 'task.#');
  channel.consume(queue, async (message) => {
    console.log(JSON.parse(message.content.toString()));
    channel.ack(message);
  }, { noAck: false });
}
amqplib.connect('amqp://admin:123456@192.168.0.124')
  .then(async (client) => {
    console.log('connected mq');
    app.mq = client;
    initMQ(client);
  })
  .catch(e => {
    console.log(e);
  });
const got = require('got').default;
const FormData = require('form-data');
const qs = require('qs');

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
});

app.get('/test/mq', async (req, res) => {
  if (!app.mq || !channel) {
    res.status(400).json({ code: -1, message: 'no connect' });
  } else {
    channel.sendToQueue('transcode', new Buffer(JSON.stringify({ id: 'test' })));
    // channel.publish('exchange', 'route', 'buff', 'opiton')
    res.json({ code: 0 })
  }
});


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
