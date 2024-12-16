const shttp = require('net-helper').shttp;

class MQHelper {
  constructor(baseUrl, option) {
    this.baseUrl = baseUrl;
    // Basic ZGV2OjBuUHEhUkczeCNtY3BAUnQw
    this.Authorization = `Basic ${Buffer.from(option.user + ':' + option.pass).toString('base64')}`;
    console.log(this.Authorization)
  }

  async getExchanges() {
    const url = `${this.baseUrl}/api/exchanges`;
    const resp = await shttp
      .get(url)
      .header({
        'Authorization': this.Authorization,
        'Content-Type': 'application/json'
      })
      .end();
    console.log(url)
    return resp.body;
  }
  async getExchange(name, vhost = '%2F') {
    const url = `${this.baseUrl}/api/exchanges/${vhost}/${name}`
    const resp = await shttp
      .get(url)
      .header({
        'Authorization': this.Authorization,
        'Content-Type': 'application/json'
      })
      .end();
    console.log(url)
    return resp.body;
  }
}

module.exports = MQHelper;