const amqp = require('amqplib');
const shttp = require('net-helper').shttp;
const MQHelper = require('../MQHelper');

(async () => {
  try {

    const mqHelper = new MQHelper('http://localhost:15672', { user: 'dev', pass: '123456' });

    const result = await mqHelper.getExchange('live', '%2F');
    console.log(result);
    const exchanges = await mqHelper.getExchanges();
    console.log(exchanges)
  } catch (e) {
    console.log(e);
  };
})();
