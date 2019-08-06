const config = require('config');
const JWT = require('jsonwebtoken');

const {CryptoUtils} = require('../../helpers');

const PASS_ENC_PAYLOAD_ALG = CryptoUtils.ENC_ALGS.AES256CBC;

// load values from config
// key for signing
const ACC_JWT_KEY = config.get('accounts.jwt.key');
// expiry in seconds
const ACC_JWT_EXP = config.get('accounts.jwt.exp');
// key used to encrypt, decrypt wallet private key
const ACC_WALLET_ENCRYPTION_KEY = config.get('accounts.wallet.encryption_key');

exports.initPasswordHash = (pwd) => {
  const salt = CryptoUtils.generateUUID();
  const hash = CryptoUtils.generateSHA512Hash(`${pwd}:${salt}`);
  return {hash, salt};
};

exports.generatePasswordHash = (pwd, salt) => CryptoUtils.generateSHA512Hash(`${pwd}:${salt}`);

exports.encryptWalletPrivateKey = (value) => {
  const encrypted = CryptoUtils.ecrypt(value, ACC_WALLET_ENCRYPTION_KEY, {
    alg: PASS_ENC_PAYLOAD_ALG,
  });
  // conclude with value
  return encrypted.value;
};

exports.generateJWT = (params) => {
  // host from params
  const {id, role} = params;
  // generate
  return {
    token: JWT.sign(
      // payload
      {id, role},
      // key
      ACC_JWT_KEY,
      // options
      {expiresIn: ACC_JWT_EXP},
    ),
    expiry: ACC_JWT_EXP,
  };
};

exports.decodeJWT = (params) => {
  // host from params
  const {token} = params;
  // decode and conclude
  return JWT.verify(token, ACC_JWT_KEY);
};

exports.decryptWalletPrivateKey = payload => CryptoUtils.decrypt(payload, ACC_WALLET_ENCRYPTION_KEY, {
  alg: PASS_ENC_PAYLOAD_ALG,
});
