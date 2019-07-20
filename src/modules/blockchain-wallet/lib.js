const Wallet = require('ethereumjs-wallet');
const EthereumTx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
const config = require('config');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const WalletUtils = require('./utils');

const {
  Utils,
  Logger,
  CryptoUtils,
  Error,
} = require('../../helpers');

const INFURA_PROJECT_ID = config.get('infura.projectId');
const INFURA_CHAIN_ID = config.get('infura.chainId');

// build endpoint via protocol://endpoint/{projectId}
const INFURA_ENDPOINT = Utils.buildStringFromMappings(config.get('infura.endpoint'), {
  projectId: INFURA_PROJECT_ID,
});
const KADIMA_CONTRACT_ADDRESS = config.get('kadima.contractAddress');

const web3 = new Web3(WalletUtils.getProviderForWeb3(INFURA_ENDPOINT));

function getKadimaContractInstance() {
  const kadimaContractJSON = JSON.parse(fs.readFileSync(path.join('src', 'modules', 'blockchain-wallet', 'abi', 'Kadima.json')).toString().trim());
  return web3.eth.Contract(kadimaContractJSON.abi, KADIMA_CONTRACT_ADDRESS);
}

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
  const contract = getKadimaContractInstance();
  const decimals = await contract.methods.decimals().call();
  const balance = await contract.methods.balanceOf(walletAddress).call();
  const symbol = await contract.methods.symbol().call();
  return {
    balance: (balance / (10 ** decimals)),
    symbol,
  };
};

/**
 * @function - sends amount from source wallet to destination wallet
 * @param params
 * * @param {string} params.from - source wallet address
 * @param {string} params.to - destination wallet address
 * @param {number} params.amount - in Kadima coin
 * @see for unit - https://web3js.readthedocs.io/en/1.0/web3-utils.html#towei
 * @returns {Promise<Object>} - transaction object
 */
exports.transferKadimaCoin = async (params) => {
  // generate request id for tracking
  const requestId = CryptoUtils.generateUUID();
  // log
  Logger.info('Module.BlockChainWallet.transferKadimaCoin: %s - Attempting to start process - %j', requestId, _.omit(params, ['from_wallet_private_key']));

  const contract = getKadimaContractInstance();
  const decimals = await contract.methods.decimals().call();
  const amount = (10 ** decimals) * params.amount;

  const method = contract.methods.transfer(params.to, amount);
  const data = method.encodeABI();
  const nonce = await web3.eth.getTransactionCount(params.from);
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = await method.estimateGas({
    from: params.from,
    value: 0,
  });

  // Make sure user has enough Wei in his/her wallet for this transaction
  const balanceInWei = await web3.eth.getBalance(params.from);
  const weiRequired = (gasPrice * gasLimit);
  const ethRequired = (weiRequired / 1000000000000000000);
  if (balanceInWei < weiRequired) {
    throw Error.InvalidRequest(params.translate('PAYMENT.INSUFFICIENT_BALANCE_TO_EXECUTE_TRANSACTION', ethRequired, params.from));
  }

  const payload = {
    nonce,
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: web3.utils.toHex(gasLimit),
    to: KADIMA_CONTRACT_ADDRESS,
    value: '0x00',
    data,
  };

  // estimate the amount of gas that will be used
  Logger.info('Module.BlockChainWallet.transferKadimaCoin: %s - Transfer will cost gas - %d at price - %s', requestId, gasLimit, gasPrice);
  // init transaction
  const transaction = new EthereumTx(payload, {chain: INFURA_CHAIN_ID});
  // sign it
  transaction.sign(Buffer.from(params.from_wallet_private_key, 'hex'));
  // serialize it for transportation
  const serializedTransaction = transaction.serialize();
  // send it
  web3.eth.transactionConfirmationBlocks = 1;
  return web3.eth.sendSignedTransaction(`0x${serializedTransaction.toString('hex')}`);
};

/**
 * @function - estimates gas that will be used to transfer payload over the wire
 * @param {Object} payload
 * @returns {Promise<number>}
 */
exports.estimateGas = payload => web3.eth.estimateGas(payload);

/**
 * @function - gets gas price in wei
 * @returns {Promise<string>}
 */
exports.getGasPrice = () => web3.eth.getGasPrice();
