const express = require('express');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const router = express.Router();

router.get('/services-items', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
  <html>
      <head>
        <title>just for test api</title>
      </head>
      <body>
        <p>
        just for test api
        </p>
      </body>
    </html>`)
});
router.get('/policy', async (req, res) => {
  res.header('Content-Type', 'text/html');
  res.end(`
  <html>
      <head>
        <title>just for test api</title>
      </head>
      <body>
        <p>
        just for test api
        </p>
      </body>
    </html>`)
});

module.exports = router;