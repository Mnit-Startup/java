const Error = require('./error');
const Logger = require('./logger');
const CryptoUtils = require('./crypto-utils');

module.exports = {
  Error,
  // legacy support
  Errors: Error,
  Logger,
  CryptoUtils,
};
