const path = require('path');
const i18n = require('i18n');
const config = require('config');

const {Logger} = require('../helpers');

// load from config
const APP_LOCALES = config.get('app.locales');
const APP_LOCALE = config.get('app.locale');

// static config
const LOCALES_DIR = path.join('src', 'locales');

// console.log(LOCALES_DIR);

/**
 * @function - initializes i18n module
 * @param {Boolean} [singleton=false]
 */
module.exports = (singleton) => {
  const sFlag = singleton === true;
  Logger.info('Localization - initializing, singleton requested? - %s', sFlag);
  // https://www.npmjs.com/package/i18n#i18nconfigure
  const opts = {
    locales: APP_LOCALES,
    defaultLocale: APP_LOCALE,
    directory: LOCALES_DIR,
    objectNotation: true,
    updateFiles: false,
    logWarnFn: (msg) => {
      Logger.warn('localization - warn - %s', msg);
    },
    logErrorFn: (msg) => {
      Logger.error('localization - error - %s', msg);
    },
  };
  if (!sFlag) {
    i18n.configure(opts);
    // return handler which can be used as a middleware by express
    return i18n.init;
  }
  // configure and return a singleton
  const obj = {};
  opts.register = obj;
  i18n.configure(opts);
  return obj;
};
