const {CryptoUtils} = require('../../helpers');

const PASS_ENC_PAYLOAD_ALG = CryptoUtils.ENC_ALGS.AES256CBC;

exports.initPasswordHash = (pwd) => {
  const salt = CryptoUtils.generateUUID();
  const hash = CryptoUtils.generateSHA512Hash(`${pwd}:${salt}`);
  return {hash, salt};
};

exports.encryptFromPassword = (value, password) => {
  const encrypted = CryptoUtils.ecrypt(value, password, {
    alg: PASS_ENC_PAYLOAD_ALG,
  });
  // conclude with value
  return encrypted.value;
};
