const TelegramBot = require('node-telegram-bot-api');
// const { SocksProxyAgent } = require('socks-proxy-agent');

// 在实例化的时候填入自己的socks地址
// const agent = new SocksProxyAgent('socks://192.168.0.125:8889')
const token = '';

const bot = new TelegramBot(token, {
  polling: true,
  testEnvironment: true,
  request: {
    // agent
  }
});

bot.onText(/\/cmd (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1];
  console.log(command, 'received')
  bot.sendMessage(chatId, command);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg, 'get')
  bot.sendMessage(chatId, 'Received your message');
});