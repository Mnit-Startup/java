/* eslint-disable camelcase */
const _ = require('lodash');
const Promise = require('bluebird');
const config = require('config');
const request = require('async-request');

const {UserAccessControl, InputValidator} = require('../interceptors');
const {Error} = require('../helpers');
const {
  ValidationSchemas, CollectionKeyMaps, Currency, PaymentStatus,
} = require('../models');
const {getAmountOfTransactionsInProcess, getKDMAmountOfTopuspInProcess} = require('./shared');
const {DbUtils} = require('../modules/mongoose');
const {Task} = require('../modules/worker');

const BLOCKADE_KADIMA_WALLET_ADDRESS = config.get('blockchain.blockadeKadimaWallet.address');
const BLOCKADE_KADIMA_WALLET_PRIVATE_KEY = config.get('blockchain.blockadeKadimaWallet.privateKey');

const INSUFFICIENT_KADIMA = 'insufficientKadimaInSystemWallet';
const MAIL_ACCOUNTS_SENDER = 'accounts';
const MAIL_RECEIVER = config.get('mail.admin.email');
const KADEPAY_BASE_URI = config.get('kadepay.uri');

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
      if (!speed) {
        speed = 1;
      }
      if (!Number(speed) || speed < 1) {
        reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.VALIDATION_ERROR')));
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
      if (!speed) {
        speed = 1;
      }
      if (!Number(speed) || speed < 1) {
        reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.VALIDATION_ERROR')));
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
        const amountTransactionsInProcess = await getAmountOfTransactionsInProcess(res.locals, acc.id);
        const kadimaBalance = await res.locals.blockchainWallet.getKadimaBalance(acc.blockchain.wallet.add);
        kadimaBalance.balance -= amountTransactionsInProcess;
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

exports.topupConsumerWallet = [
  // validation schema for request body
  ValidationSchemas.TopupConsumerWallet,
  // request body validation schema interception
  InputValidator(),
  (req, res, next) => {
    const {payment_id} = req.body;
    new Promise(async (resolve, reject) => {
      try {
        // verify payment id from kadepay server
        // and get details:
        // 1. consumer account id
        // 2. amount
        const response = await request(`${KADEPAY_BASE_URI}/transaction/${payment_id}`);
        // if error reject request
        if (response.statusCode !== 200) {
          return reject(response.body);
        }
        // parse response body
        const body = JSON.parse(response.body);
        // destructure resposne body, get
        // topup request consumer account id
        // amount
        // currency we have send in exchange of fiat on kadepay server
        const {account_id} = body;
        let {target_currency, amount} = body;
        // task queue will be assigned based on target currency
        let taskQueue;
        // reject the request if
        // 1. account id is not a valid mongodb ObjectId
        // 2. if amount in not a number greater than 0
        // 3. if targert currency is not supported
        if (!DbUtils.checkValidObjectId(account_id) || !_.isFinite(amount) || !_.gt(amount, 0)
        || _.isNil(Currency[target_currency.toUpperCase()])) {
          return reject(Error.InvalidRequest());
        }
        // query consumer account using account_id
        const acc = await res.locals.db.accounts.findOne({_id: account_id});
        // reject if not found
        if (!acc) {
          return reject(Error.NotFound());
        }
        // convert to lower case for string comparison
        target_currency = target_currency.toLowerCase();
        // round of amount upto 2 decimal precision
        amount = _.round(amount, 2);
        // if target_currency is Kadima
        if (target_currency === Currency.KDM) {
          // check if sufficient kadima is present in system wallet
          // if not notify admin through mail
          // and reject the request
          // get current kadima in system wallet
          const kadimaBalance = await res.locals.blockchainWallet.getKadimaBalance(BLOCKADE_KADIMA_WALLET_ADDRESS);
          let kadimaInSource = kadimaBalance.balance;
          // get pending kadima topups
          const kadimaTopupsInProcessAmount = await getKDMAmountOfTopuspInProcess(res.locals);
          // calculate available kadima
          kadimaInSource -= kadimaTopupsInProcessAmount;
          // if not sufficient kadima in system wallet
          if (kadimaInSource < amount) {
            // notify the admin
            const emailData = {
              kadimaInSource,
              consumerWalletAddress: acc.blockchain.wallet.add,
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
            // reject request
            return reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_KADIMA_IN_SYSTEM_WALLET')));
          }
          // else assign task queue
          taskQueue = 'transfer_kadima';
        }
        // create a topup entity
        // set status to processing
        const topup = await res.locals.db.topups.create({
          acc: acc.id,
          payment_id,
          amount,
          currency: target_currency,
          topup_status: PaymentStatus.PROCESSING,
        });
        // create a task
        const task = new Task(taskQueue, {
          topup,
          acc,
          locale: req.getLocale(),
        });

        // submit task to queue
        await res.locals.worker.submitTask(task);
        // resolve topup entity, which will be polled to track transfer status
        return resolve(_.pick(topup.toJSON(), CollectionKeyMaps.Topup));
      } catch (e) {
        return reject(e);
      }
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.send(response);
      }
    });
  },
];
