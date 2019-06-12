const Wallet = require('ethereumjs-wallet');
const Web3 = require('web3');
const config = require('config');
const WalletUtils = require('./utils');

const {Utils} = require('../../helpers');

const INFURA_PROJECT_ID = config.get('infura.projectId');
// build endpoint via protocol://endpoint/{projectId}
const INFURA_ENDPOINT = Utils.buildStringFromMappings(config.get('infura.endpoint'), {
  projectId: INFURA_PROJECT_ID,
});

const web3 = new Web3(WalletUtils.getProviderForWeb3(INFURA_ENDPOINT));

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

exports.getBalance = walletAddress => web3.eth.getBalance(walletAddress);
