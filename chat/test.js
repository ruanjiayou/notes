var cwd = process.cwd();
var WebSocketClient = require('websocket').client;
var size = 1;
var authInterval = 10;
var index = 0;

setInterval(function () {
  if (index < size) {
    uid = index;
    cid = index;
    init(uid, cid);
    index++;
  }
}, authInterval); console.log('begin...');
init = function (uid, cid) {
  var client = new WebSocketClient();
  // client.onopen((e) => { console.log(e) });
  client.connect('http://localhost:3322/chat?EIO=4&transport=polling&t=O1VdiQQ&token=' + index, 'echo-protocol', 'echo-protocol',)
  client.on('connectFailed', function (error) {
    console.log(error);
    console.log('Connect Error: ' + error.toString());
  });

  client.on('connect', function (connection) {
    console.log(index + ' Connected');
    connection.on('error', function (error) {
      console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function (error) {
      console.log(error + ';  Connection Closed');
      //client.close();
      // reconnect();
    });
    connection.on('message', function (message) {
      if (index === 0) {
        console.log(message)
      }
    });
  });
};
function timeLogout() {
  return setTimeout(function () {
    logout(uid);
  }, StartTime);
}
