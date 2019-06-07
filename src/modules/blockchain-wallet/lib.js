const Wallet = require('ethereumjs-wallet');
const WalletUtils = require('./utils');

/**
 * @function - creates a new wallet
 * @returns {{address: string, public_key: string, private_key: string}}
 */
exports.createNew = () => {
  const ret = {};
  const wallet = Wallet.generate();
  ret.address = wallet.getAddressString();
  // remove padding from the keys
  ret.public_key = WalletUtils.removeKeyPadding(wallet.getPublicKeyString());
  ret.private_key = WalletUtils.removeKeyPadding(wallet.getPrivateKeyString());
  // conclude
  return ret;
};
