const Wallet = require('ethereumjs-wallet');
const EthereumTx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
const config = require('config');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const WalletUtils = require('./utils');
const mail = require('../mail/lib');

const BLOCKADE_ETH_WALLET_ADDRESS = config.get('blockchain.blockadeEthWallet.address');
const BLOCKADE_ETH_WALLET_PRIVATE_KEY = config.get('blockchain.blockadeEthWallet.privateKey');

const INSUFFICIENT_ETHER = 'insufficientEtherInSystemWallet';
const MAIL_ACCOUNTS_SENDER = 'accounts';
const MAIL_RECEIVER = config.get('mail.admin.email');

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
 * @function - sends amount from configured wallet to provided wallet
 * @param params
 * @param {string} params.to - destination wallet address
 * @param {number | [<number>,<string>]} params.amount - either in wei or [amount, unit]
 * @see for unit - https://web3js.readthedocs.io/en/1.0/web3-utils.html#towei
 * @returns {Promise<Object>} - transaction object
 */
exports.transferGasFromBlockadeEthWallet = async (params) => {
  // generate request id for tracking
  const requestId = CryptoUtils.generateUUID();
  // log
  Logger.info('Module.BlockChainWallet.transferGasFromBlockadeEthWallet: %s - Attempting to start process - %j', requestId, params);
  // get current balance - string in wei
  const balance = await web3.eth.getBalance(BLOCKADE_ETH_WALLET_ADDRESS);
  Logger.info('Module.BlockChainWallet.transferGasFromBlockadeEthWallet: %s - Current wallet balance - %s wei', requestId, balance);
  // get gas price - string in wei
  const gasPrice = params.speed * (await web3.eth.getGasPrice());
  // init transaction payload - values can only be in hex
  // note - from, to, nonce are already in hex
  // note - only from, to and value are considered when estimating gas limit
  const payload = {
    from: BLOCKADE_ETH_WALLET_ADDRESS,
    to: params.to,
    // calculated via transaction count for configured wallet, which will be unique as it gets incremented each time
    nonce: await web3.eth.getTransactionCount(BLOCKADE_ETH_WALLET_ADDRESS),
    // calculate amount to send - in wei
    // either get the exact value or convert it to wei from provided unit
    value: web3.utils.toHex(params.amount),
    gasPrice: web3.utils.toHex(gasPrice),
  };
  // estimate the amount of gas that will be used
  const gasLimit = await web3.eth.estimateGas(payload);
  const weiRequired = (gasPrice * gasLimit);
  const balanceInEth = balance / 1000000000000000000;
  if (balance < weiRequired + params.amount) {
    // notify owner and abort the transaction
    const ethRequired = ((weiRequired + params.amount) - balance) / 1000000000000000000;
    const emailData = {
      etherPresent: balanceInEth,
      ethRequired,
    };
    await mail.sendEmail({
      sender: MAIL_ACCOUNTS_SENDER,
      template: INSUFFICIENT_ETHER,
      recipient: {
        email: MAIL_RECEIVER,
      },
      data: emailData,
      locale: params.locale,
    });
    throw Error.InvalidRequest(params.translate('PAYMENT.INSUFFICIENT_ETH_IN_SYSTEM_WALLET'));
  }
  Logger.info('Module.BlockChainWallet.transferGasFromBlockadeEthWallet: %s - Transfer will cost gas - %d at price - %s', requestId, gasLimit, gasPrice);
  // add obtained gas limit to the payload
  payload.gas = web3.utils.toHex(gasLimit);
  // init transaction
  const transaction = new EthereumTx(payload, {chain: INFURA_CHAIN_ID});
  // sign it
  transaction.sign(Buffer.from(BLOCKADE_ETH_WALLET_PRIVATE_KEY, 'hex'));
  // serialize it for transportation
  const serializedTransaction = transaction.serialize();
  // send it
  web3.eth.transactionConfirmationBlocks = 1;
  return web3.eth.sendSignedTransaction(`0x${serializedTransaction.toString('hex')}`);
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
  const gasPrice = params.speed * (await web3.eth.getGasPrice());
  const gasLimit = await method.estimateGas({
    from: params.from,
    value: 0,
  });
  // Make sure user has enough Wei in his/her wallet for this transaction
  const balanceInWei = await web3.eth.getBalance(params.from);
  const weiRequired = (gasPrice * gasLimit);

  if (balanceInWei < weiRequired) {
    const extraWeiRequired = weiRequired - balanceInWei;
    const args = {
      to: params.from,
      amount: extraWeiRequired,
      speed: params.speed,
      locale: params.locale,
      translate: params.translate,
    };
    await module.exports.transferGasFromBlockadeEthWallet(args);
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
