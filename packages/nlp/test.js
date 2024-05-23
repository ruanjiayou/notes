const AipSpeechClient = require("baidu-aip-sdk").speech;

const APP_ID = "11771500";
const API_KEY = "z8wSGkjhSooxGUGGUikLAaVp";
const SECRET_KEY = "gEzOhx7remlXcY2x5Zjdut9WvctMH7ax";

const client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);

/**
 * 参数	类型	描述	是否必须
 * tex	String	合成的文本，使用UTF-8编码，请注意文本长度必须小于1024字节	是
 * cuid	String	用户唯一标识，用来区分用户，填写机器 MAC 地址或 IMEI 码，长度为60以内	否
 * spd	String	语速，取值0-9，默认为5中语速	否
 * pit	String	音调，取值0-9，默认为5中语调	否
 * vol	String	音量，取值0-15，默认为5中音量	否
 * per	String	发音人选择, 0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女	否
 */
// 语音合成, 附带可选参数
client.text2audio('百度语音合成测试', { spd: 0, per: 4 }).then(function (result) {
  if (result.data) {
    fs.writeFileSync('tts.mpVoice.mp3', result.data);
  } else {
    // 服务发生错误
    console.log(result)
  }
}, function (e) {
  // 发生网络错误
  console.log(e)
});

// 默认语言管理.
// 用户名称 => IP => ua => 兜底语言
// 

// 1g65CDIEleS9NNFi