const pinyin = require('pinyin').default;

const s = pinyin(process.argv[2] || '测试', { style: pinyin.STYLE_NORMAL })
console.log('/images/avatar/' + s.join('_') + '.jpg')