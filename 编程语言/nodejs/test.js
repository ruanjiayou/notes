const crypto = require('crypto');

const utils = require('./diff-utils.js');

const Key = 'secret';

function cipher(str, password) {
  const cipher = crypto.createCipher('aes-256-cbc', password);
  let crypted = cipher.update(str, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

function decipher(str, key) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let dec = decipher.update(Buffer.from(str, 'hex'), 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

const ticket = {
  user: { _id: '123', name: '阮家友' },
  expires: new Date(),
  type: '2',
  message: `${'PATH_WEBDATA'},${''},${'環球人物－172期－連勝文－播出版.mp4'}`
};
// const encoded = cipher(`${ticket.user._id},${ticket.user.name}\\n${ticket.expires}\\n${ticket.type}\\n${ticket.message}`, Key);

// console.log(encoded);

// const decoded = decipher(encoded, Key);
// console.log(decoded);

// console.log(cipher('fhd9SLkwknS98GU', Key))

