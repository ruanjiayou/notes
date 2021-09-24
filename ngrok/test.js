const ngrok = require('ngrok');

; (async () => {
  const url = await ngrok.connect(8991);
  console.log(url);
})();