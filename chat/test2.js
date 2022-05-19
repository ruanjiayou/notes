const { io } = require('socket.io-client');

var size = 5000;
var authInterval = 10;
var index = 0;
let all_connected = false;

let timer = setInterval(function () {
  if (index < size) {
    uid = index;
    cid = index;

    const socket = generator(index);
    setInterval(() => {
      if (all_connected) {
        const n = Math.random();
        if (n < 0.01) {
          socket.emit('message', {
            "to": "live_123456",
            "type": "message",
            "data": {
              "content": "测试" + Date.now()
            },
            "from": {
              "username": "u_" + index,
              "_id": index
            }
          }
          );
        }
      }
    }, 1000)

    index++;
  } else {
    console.log('all_connected');
    all_connected = true;
    clearInterval(timer);
  }
}, authInterval);

function generator(index) {

  const socket = new io('ws://localhost:3322/chat', {
    pingInterval: 25000,
    pingTimeout: 10000,
    reconnection: false,
    path: '/content',
    query: {
      room: 'live_123456',
      id: index
    },
  });

  socket.on('open', () => {
    socket.on('message', (data) => {
      console.log(data)
    });
    socket.on('close', () => { });
  });

  socket.on("error", (err) => {
    console.error(err)
    socket.close()
  })


  socket.on("connect", () => {
    // console.log(socket.connected);
  });

  socket.on("disconnect", () => {
    // console.log(socket.connected);
    // console.log('close')
    socket.close()
  });

  socket.on("connect_error", (err) => {
    console.log(err)
    socket.close()
  })

  return socket;
}
console.log('begin...');
