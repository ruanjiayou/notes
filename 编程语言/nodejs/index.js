const express = require('express')
const PNGlib = require('node-pnglib');
const ngrok = require('ngrok');
const app = express()
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const multer = require('multer');
const _ = require('lodash');
// const amqplib = require('amqplib');
const diffsrt = require('./diff-utils.js');

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
// amqplib.connect('amqp://admin:123456@192.168.0.124')
//   .then(async (client) => {
//     console.log('connected mq');
//     app.mq = client;
//     initMQ(client);
//   })
//   .catch(e => {
//     console.log(e);
//   });
const got = require('got').default;
const FormData = require('form-data');
const qs = require('qs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, './.tmp'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const uploader = multer({ storage: storage });
const multi = uploader.fields([
  { name: 'libretto', maxCount: 1 },
  { name: 'transcription', maxCount: 1 },
]);

app.use(bodyParser.json({ limit: '3mb' }));
//app.use(bodyParser.urlencoded({ limit: '3mb', extended: false }))
app.use(express.static('./static'));
app.use((req, res, next) => {
  console.log(req.url);
  next();
})
app.get('/Cmpp/runtime/interface_270002.jhtml', async (req, res) => {
  console.log(req.query);
  res.end()
})

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


app.get('/test/return/text', async (req, res) => {
  console.log('test get');
  res.end('hello');
})
app.post('/test/return/json', async (req, res) => {
  console.log(req.body, 'body')
  res.json(req.body);
})

const SECRET = 'CDB5BBE5-3016-41CC-B69A-2B23E0FCB9B6';
function getSign(d) {
  const keys = Object.keys(d).sort((a, b) => a.localeCompare(b));
  let str = keys.map(key => key + '=' + d[key]).join('&') + '&' + SECRET;
  return crypto.createHash('md5').update(str).digest('hex').toString().toUpperCase();
}
app.post('/api/AdvertisingManagement/AdvertisingPush', async (req, res) => {
  console.log(req.query)
  console.log(req.body, 'publish');
  console.log(req.get('Content-Type'));
  const { Sign, ...data } = req.body;
  const sign = getSign(data);
  const result = sign === Sign ? { Code: 1001, Message: '成功', Data: { BusinessKey: 'C13B2737-76EE-4BC2-A6CE-BFCD9E3210D3' } } : { Code: 1002, Message: 'fail' };
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(JSON.stringify(result)));
})

app.post('/api/AdvertisingManagement/AdvertisingOffline', async (req, res) => {
  console.log(req.body, 'offline');
  const { Sign, ...data } = req.body;
  const sign = getSign(data);
  const result = sign === Sign ? { Code: 1001, Message: '成功', Data: { ResultType: 1 } } : { Code: 1020, Message: '失败' }
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(JSON.stringify(result)));
})

app.post('/social-examine/posts/core-detail', async (req, res) => {
  res.json({
    code: 0,
    data: {
      title: 'test'
    }
  })
});

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

app.post('/diff-srt/json', async (req, res) => {
  const srt = diffsrt(req.body.document, req.body.segments);
  res.end(srt);
});

app.post('/diff-srt/2srt', uploader.single('transcription'), async (req, res) => {
  let transcription = null;
  if (!_.isEmpty(req.body)) {
    transcription = req.body;
  }
  if (req.file) {
    console.log(req.file)
    transcription = JSON.parse(fs.readFileSync(req.file.path, { encoding: 'utf-8' }).toString());
  }
  if (!transcription || !transcription.segments) {
    return res.status(400).end('');
  }
  function n2t(seconds) {
    const millis = Math.round((seconds % 1) * 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    seconds = Math.floor((seconds % 60));

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0").substring(0, 3)}`;
  }
  res.header({ 'content-type': 'text/plain; charset=utf-8' });
  res.header({ 'Content-Disposition': 'inline; filename="subtitle.srt"' });
  res.end(transcription.segments.map((s, n) => `${n + 1}\n${n2t(s.start)} --> ${n2t(s.end)}\n${s.text}\n\n`).join('\n'));
});

// ffmpeg -i input.mp4 -map-metadata -1 -c:a aac output.aac
app.post('/diff-srt/file', multi, async (req, res) => {
  const transcription = (req.files.transcription || []).find(a => a.fieldname === 'transcription');
  const libretto = (req.files.libretto || []).find(a => a.fieldname === 'libretto');
  if (!transcription || !libretto) {
    return res.end('MissFile');
  }

  try {
    const o = JSON.parse(fs.readFileSync(transcription.path, { encoding: 'utf-8' }).toString());
    const srt = diffsrt(
      // 唱词
      fs.readFileSync(libretto.path, { encoding: 'utf-8' }).toString(),
      // 分节
      o.segments.map(t => ({ text: t.text, start: t.start, end: t.end })),
    )
    res.end(srt);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.end(e.message);
  } finally {
    fs.unlinkSync(libretto.path);
    fs.unlinkSync(transcription.path);
  }

});

app.get('/ai-poster-article', async (req, res) => {
  res.sendFile(path.join(__dirname, './.tmp/article-poster.html'))
});

app.listen(7003, function () {
  console.log('express started at: 7003')
})
