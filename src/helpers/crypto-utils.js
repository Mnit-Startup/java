const crypto = require('crypto');
const uuidv1 = require('uuid/v1');

const DEFAULT_ENC_ALG = 'aes-256-cbc';
const DEFAULT_ENC_IN_ENC = 'utf-8';
const DEFAULT_ENC_OUT_ENC = 'hex';

exports.ENC_ALGS = {
  AES256CBC: 'aes-256-cbc',
};

exports.generateSHA512Hash = string => crypto.createHash('sha512')
  .update(string)
  .digest('hex');

exports.generateUUID = () => uuidv1();

/**
 * @function - encrypts provided raw value with provided key
 * @param {string} raw
 * @param {string} key
 * @param {{[alg]: string, [encIn]: string, [encOut]: string}} [options]
 * @returns {{alg: string, enc: string, value: string}}
 */
exports.ecrypt = (raw, key, options) => {
  // pre-process options
  const opts = options || {};
  opts.alg = opts.alg || DEFAULT_ENC_ALG;
  opts.encIn = opts.encIn || DEFAULT_ENC_IN_ENC;
  opts.encOut = opts.encOut || DEFAULT_ENC_OUT_ENC;
  // create cipher
  const cipher = crypto.createCipher(opts.alg, key);
  // update cipher
  let value = cipher.update(raw, opts.encIn, opts.encOut);
  value += cipher.final(opts.encOut);
  // conclude
  return {
    alg: opts.alg,
    enc: opts.encOut,
    value,
  };
};

/**
 * @function - decrypts provided encrypted value via provided key
 * @param {string} encrypted
 * @param {string} key
 * @param {{[alg]: string, [encIn]: string, [encOut]: string}} [options]
 * @returns {string}
 */
exports.decrypt = (encrypted, key, options) => {
  // pre-process options
  const opts = options || {};
  opts.alg = opts.alg || DEFAULT_ENC_ALG;
  opts.encIn = opts.encIn || DEFAULT_ENC_OUT_ENC;
  opts.encOut = opts.encOut || DEFAULT_ENC_IN_ENC;
  // create decipher
  // TODO: Use createDecipheriv instead
  const decipher = crypto.createDecipher(opts.alg, key);
  // update decipher
  let ret = decipher.update(encrypted, opts.encIn, opts.encOut);
  ret += decipher.final(opts.encOut);
  // conclude
  return ret;
};
