const ngrok = require('ngrok');

; (async () => {
  const url = await ngrok.connect(80);
  console.log(url);
})();