const fs = require("fs");
const path = require('path');
const os = require('os');
const net = require('net');
const shell = require('shelljs').exec;
function getLocalIP() {
  return new Promise((resolve, reject) => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const interface of interfaces[name]) {
        if (interface.family === 'IPv4' && !interface.internal) {
          resolve(interface.address);
          return;
        }
      }
    }
    reject(new Error('No public IP found.'));
  });
}

getLocalIP().then(ip => {
  console.log(ip);
  const appName = 'Lantern';
  // const r1 = shell(`osascript -e 'quit app "${appName}"'`);
  // console.log(r1.code, r1.stderr);
  // const filepath = path.join(__dirname, "settings.yml");
  const filepath = "/Users/jiayou/Library/Application\ Support/Lantern/settings.yaml"
  const lines = fs.readFileSync(filepath).toString().split('\n');
  const news = lines.map(line => {
    if (line.startsWith('addr:')) {
      return line.split(':')[0] + ': ' + ip + ':8899';
    } else if (line.startsWith('socksAddr:')) {
      return line.split(':')[0] + ': ' + ip + ':9988';
    } else {
      return line;
    }
  });
  fs.writeFileSync(filepath, news.join('\n'));

  const gitfilepath = '/Users/jiayou/.gitconfig';
  const lines2 = fs.readFileSync(gitfilepath).toString().split('\n');
  const news2 = lines2.map(line => {
    if (line.trim().startsWith('proxy')) {
      return `        proxy = ${ip}:8899`
    } else {
      return line;
    }
  });
  fs.writeFileSync(gitfilepath, news2.join('\n'));
  const r2 = shell('open /Applications/Lantern.app');
  console.log(r2.code, r2.stderr);
  console.log('finished');
})

