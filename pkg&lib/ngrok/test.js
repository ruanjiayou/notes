const ngrok = require('ngrok');

; (async () => {
  const url = await ngrok.connect(7003);
  console.log(url);
})();