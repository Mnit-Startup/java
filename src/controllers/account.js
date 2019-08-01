/* eslint-disable camelcase */
const Promise = require('bluebird');
const config = require('config');

const {UserAccessControl, InputValidator} = require('../interceptors');
const {Error} = require('../helpers');
const {ValidationSchemas} = require('../models');

const BLOCKADE_KADIMA_WALLET_ADDRESS = config.get('blockchain.blockadeKadimaWallet.address');
const BLOCKADE_KADIMA_WALLET_PRIVATE_KEY = config.get('blockchain.blockadeKadimaWallet.privateKey');

const INSUFFICIENT_KADIMA = 'insufficientKadimaInSystemWallet';
const MAIL_ACCOUNTS_SENDER = 'accounts';
const MAIL_RECEIVER = config.get('mail.admin.email');

exports.get = [
  UserAccessControl,
  (req, res, next) => {
    const acc = req.user_acc;
    new Promise(async (resolve) => {
      resolve({
        id: acc.id,
        email: acc.email,
        role: acc.role,
        blockchain: {
          wallet: {
            add: acc.blockchain.wallet.add,
            pub: acc.blockchain.wallet.pub,
          },
        },
      });
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
      }
    });
  },
];

exports.loadKadimaInConsumerWallet = [
  // validation schema
  ValidationSchemas.LoadKadima,
  // validation interceptor
  InputValidator(),
  // controller
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      let {speed} = req.query;
      if (!Number(speed) || speed < 1) {
        reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.VALIDATION_ERROR')));
      }
      if (!speed) {
        speed = 1;
      }
      const {
        wallet,
        amount,
      } = req.body;
      try {
        const kadimaBalance = await res.locals.blockchainWallet.getKadimaBalance(BLOCKADE_KADIMA_WALLET_ADDRESS);
        const kadimaInTheSource = kadimaBalance.balance;
        if (kadimaInTheSource < amount) {
        // notify the admin
          const emailData = {
            kadimaInTheSource,
            consumerWalletAddress: wallet,
            kadimaRequested: amount,
          };
          await res.locals.mail.sendEmail({
            sender: MAIL_ACCOUNTS_SENDER,
            template: INSUFFICIENT_KADIMA,
            recipient: {
              email: MAIL_RECEIVER,
            },
            data: emailData,
            locale: req.getLocale(),
          });
          reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_KADIMA_IN_SYSTEM_WALLET')));
        }
        const params = {
          from: BLOCKADE_KADIMA_WALLET_ADDRESS,
          to: wallet,
          amount,
          speed,
          from_wallet_private_key: BLOCKADE_KADIMA_WALLET_PRIVATE_KEY,
          translate: res.__,
          locale: req.getLocale(),
        };
        const tx = await res.locals.blockchainWallet.transferKadimaCoin(params);
        resolve(tx);
      } catch (e) {
        reject(e);
      }
    }).asCallback((err, response) => {
      if (err) next(err);
      else res.json(response);
    });
  },
];

exports.transferKadimaConsumerToMerchant = [
  // validation schema
  ValidationSchemas.TransferKadimaConsumerToMerchant,
  // validation interceptor
  InputValidator(),
  // controller
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      let {speed} = req.query;
      if (!Number(speed) || speed < 1) {
        reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.VALIDATION_ERROR')));
      }
      if (!speed) {
        speed = 1;
      }
      const {
        consumer_wallet,
        consumer_wallet_pvt_key,
        merchant_wallet,
        amount,
      } = req.body;
      try {
        const kadimaBalance = await res.locals.blockchainWallet.getKadimaBalance(consumer_wallet);
        const kadimaInTheSource = kadimaBalance.balance;
        let privateKey;
        if (kadimaInTheSource < amount) {
          // the error message will have the details
          const extraKadimaRequired = amount - kadimaInTheSource;
          reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_KADIMA_IN_CONSUMER_WALLET', extraKadimaRequired, consumer_wallet)));
        }
        if (!consumer_wallet_pvt_key) {
          // fetch the private key
          const acc = await res.locals.db.accounts.findOne({
            'blockchain.wallet.add': consumer_wallet,
          });
          if (!acc) {
            reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
          }
          privateKey = res.locals.accounts.decryptWalletPrivateKey(acc.blockchain.wallet.enc);
        } else {
          privateKey = consumer_wallet_pvt_key;
        }
        const params = {
          from: consumer_wallet,
          to: merchant_wallet,
          amount,
          speed,
          from_wallet_private_key: privateKey,
          translate: res.__,
          locale: req.getLocale(),
        };
        const tx = await res.locals.blockchainWallet.transferKadimaCoin(params);
        resolve(tx);
      } catch (e) {
        reject(e);
      }
    }).asCallback((err, response) => {
      if (err) next(err);
      else res.json(response);
    });
  },
];

exports.getBalance = [
  UserAccessControl,
  (req, res, next) => {
    const acc = req.user_acc;
    new Promise(async (resolve, reject) => {
      const {address} = req.params;
      if (address !== acc.blockchain.wallet.add) {
        reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
        return;
      }
      try {
        const kadimaBalance = await res.locals.blockchainWallet.getKadimaBalance(acc.blockchain.wallet.add);
        resolve([{
          symbol: kadimaBalance.symbol,
          updated_at: new Date(),
          description: 'Kadmia Coin',
          balance: kadimaBalance.balance,
        }]);
      } catch (e) {
        reject(e);
      }
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
      }
    });
  },
];
