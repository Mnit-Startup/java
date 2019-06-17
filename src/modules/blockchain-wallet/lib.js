const Wallet = require('ethereumjs-wallet');
const Web3 = require('web3');
const config = require('config');
const fs = require('fs');
const path = require('path');
const WalletUtils = require('./utils');

const {Utils} = require('../../helpers');

const INFURA_PROJECT_ID = config.get('infura.projectId');
// build endpoint via protocol://endpoint/{projectId}
const INFURA_ENDPOINT = Utils.buildStringFromMappings(config.get('infura.endpoint'), {
  projectId: INFURA_PROJECT_ID,
});
const KADIMA_CONTRACT_ADDRESS = config.get('kadima.contractAddress');

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

exports.getKadimaBalance = async (walletAddress) => {
  const kadimaContractJSON = JSON.parse(fs.readFileSync(path.join('src', 'modules', 'blockchain-wallet', 'abi', 'Kadima.json')).toString().trim());
  const contract = web3.eth.Contract(kadimaContractJSON.abi, KADIMA_CONTRACT_ADDRESS);
  const decimals = await contract.methods.decimals().call();
  const balance = await contract.methods.balanceOf(walletAddress).call();
  const symbol = await contract.methods.symbol().call();
  return {
    balance: (balance / (10 ** decimals)),
    symbol,
  };
};
