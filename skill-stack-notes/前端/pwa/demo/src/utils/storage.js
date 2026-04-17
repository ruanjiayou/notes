module.exports = {
  setValue(key, value) {
    let type = 'string';
    switch (typeof value) {
      case 'number': type = 'number'; break;
      case 'date': type = 'date'; value = value.getTime(); break;
      case 'object': type = 'json'; break;
      default: break;
    }
    window.localStorage.setItem(key, JSON.stringify({ type, value }));
  },
  getValue(key) {
    let str = window.localStorage.getItem(key);
    let value = null;
    if (str !== null && /^\{.*\}$/.test(str)) {
      try {
        const o = JSON.parse(str);
        if (o.type === 'date') {
          value = new Date(o.value);
        } else {
          value = o.value;
        }
      } catch (err) {
        this.removeKey(key);
      }
    } else {
      this.removeKey(key);
    }
    return value;
  },
  removeKey(key) {
    window.localStorage.removeItem(key);
  }
};