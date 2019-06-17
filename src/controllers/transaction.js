/* eslint-disable camelcase */
const _ = require('lodash');
const Promise = require('bluebird');
const {CollectionKeyMaps, ValidationSchemas, PaymentStatus} = require('../models');
const {
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  ConsumerAccessControl,
  InputValidator,
} = require('../interceptors');
const {Error} = require('../helpers');

exports.createStoreTransaction = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  // validation schema
  ValidationSchemas.Transaction,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const params = req.body;
    new Promise(async (resolve, reject) => {
      try {
        const transaction = await res.locals.db.transactions.create({
          store: req.store.id,
          amount: params.amount,
          payment_status: PaymentStatus.PENDING_PAYMENT,
        });
        return resolve(_.pick(transaction.toJSON(), CollectionKeyMaps.Transaction));
      } catch (e) {
        return reject(e);
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

exports.getStoreTransactions = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const transactions = await res.locals.db.transactions.find({
          store: req.store.id,
          payment_status: PaymentStatus.PAID,
        }, null, {
          sort: {
            created_at: -1,
          },
        });
        return resolve(_.map(transactions, transaction => _.pick(transaction.toJSON(), CollectionKeyMaps.Transaction)));
      } catch (e) {
        return reject(e);
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

exports.getTransactionDetail = [
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const transaction = await res.locals.db.transactions.findOne({
          _id: req.params.transactionId,
        }).populate('store');
        if (!transaction) {
          return reject(Error.NotFound());
        }
        return resolve(_.pick(transaction.toJSON(), CollectionKeyMaps.Transaction));
      } catch (e) {
        return reject(e);
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

exports.getConsumerTransactions = [
  UserAccessControl,
  ConsumerAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const transactions = await res.locals.db.transactions.find({
          payee: req.user_acc.id,
          payment_status: PaymentStatus.PAID,
        }, null, {
          sort: {
            paid_on: -1,
          },
        }).populate('store');
        return resolve(_.map(transactions, transaction => _.pick(transaction.toJSON(), CollectionKeyMaps.Transaction)));
      } catch (e) {
        return reject(e);
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

exports.payTransaction = [
  ConsumerAccessControl,
  (req, res, next) => {
    const acc = req.user_acc;
    new Promise(async (resolve, reject) => {
      try {
        const transaction = await res.locals.db.transactions.findOne({
          _id: req.params.transactionId,
        });
        if (!transaction) {
          return reject(Error.NotFound());
        }
        if (transaction.payment_status === PaymentStatus.PAID) {
          return reject(Error.InvalidRequest(res.__('PAYMENT.TRANSACTION_PAID')));
        }
        // Check that the user has enough balance to pay
        const balance = await res.locals.blockchainWallet.getKadimaBalance(acc.blockchain.wallet.add);
        if (balance.balance < transaction.amount) {
          return reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_BALANCE')));
        }
        // TODO jjalan: Actually transfer the money from user wallet to merchant wallet
        const now = new Date();
        await res.locals.db.transactions.update({
          _id: req.params.transactionId,
        }, {
          $set: {
            payee: acc.id,
            payment_status: PaymentStatus.PAID,
            paid_on: now,
            updated_at: now,
          },
        });
        // Return updated transaction
        const updatedTransaction = await res.locals.db.transactions.findOne({
          _id: req.params.transactionId,
        }).populate('store');
        return resolve(_.pick(updatedTransaction.toJSON(), CollectionKeyMaps.Transaction));
      } catch (e) {
        return reject(e);
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
