const path = require('path');
const log4js = require("log4js");

log4js.configure({
  appenders: {
    access: { type: "dateFile", filename: path.join(__dirname, "logs/access.log"), keepFileExt: true, fileNameSep: '_', pattern: 'yyyy-MM-dd', alwaysIncludePattern: true },
    log: { type: "dateFile", filename: path.join(__dirname, "logs/info.log"), keepFileExt: true, fileNameSep: '_', pattern: 'yyyy-MM-dd', alwaysIncludePattern: true },
    print: { type: "console" }
  },
  categories: { default: { appenders: ["print", "log"], level: "info" }, access: { appenders: ["access"], level: "info" } }
});

const loggerCreator = function loggerCreator(name) {
  return log4js.getLogger(name);
};

log4js.getLogger().info('log4js is alive');

module.exports = loggerCreator;