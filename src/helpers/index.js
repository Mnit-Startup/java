const Error = require('./error');
const Logger = require('./logger');
const CryptoUtils = require('./crypto-utils');
const Utils = require('./utils');

module.exports = {
  Error,
  // legacy support
  Errors: Error,
  Logger,
  CryptoUtils,
  Utils,
};
