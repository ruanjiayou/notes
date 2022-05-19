const fs = require('fs');
const path = require('path');
const { authorize } = require('./lib/auth');
const { uploadVideo } = require('./lib/upload')

const filepath = __dirname + path.sep + 'data/test.mp4'
function cb(err, auth) {
  if (err) {
    return console.log(err);
  }
  uploadVideo({
    auth,
    filepath,
    title: 'test',
    desc: 'desc'
  }, () => {
    console.log('ended')
  })
}

fs.readFile(__dirname + path.sep + 'store/client_secret.json', (error, content) => {
  if (error) {
    console.log('Error loading client secret file: ' + error);
    return cb(error);
  }
  // Authorize a client with the loaded credentials
  authorize(JSON.parse(content), cb);
});