'use strict';

const pagination = require('./list-pagination');
const config = require('../config.js');

module.exports = Object.assign({}, pagination, { config, setConfig: config.setConfig });
