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
  StoreAccessControl,
  // validation schema
  ValidationSchemas.Transaction,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const {cart_items} = req.body;
    new Promise(async (resolve, reject) => {
      try {
        let total = 0;
        const cart_products = [];
        // get all the id of products in an array
        const productIds = _.map(cart_items, cart_item => cart_item.product);

        // query all the products from db using product ids array in single query
        const products = await res.locals.db.products.find({
          _id: {
            $in: productIds,
          },
        });

        // loop through and calculate total amount of transaction
        _.forEach(products, (product) => {
          if (!product.active) {
            reject(Error.InvalidRequest(res.__('PRODUCT.NOT_ACTIVE')));
          }
          const index = _.findIndex(cart_items, cart_item => cart_item.product === product.id);
          if (index !== -1) {
            let productWithQuantityPrice = cart_items[index].quantity * product.price;
            if (product.taxable) {
              productWithQuantityPrice += (cart_items[index].quantity * product.price * product.tax) / 100;
            }
            total += productWithQuantityPrice;
          }
          cart_products.push({
            id: product.id,
            name: product.name,
            price: product.price,
            taxable: product.taxable,
            tax: product.tax,
            quantity: cart_items[index].quantity,
          });
        });

        // create transaction
        const transaction = await res.locals.db.transactions.create({
          store: req.store.id,
          amount: Number((total).toFixed(2)),
          payment_status: PaymentStatus.PENDING_PAYMENT,
          cart: {
            products: cart_products,
          },
        });

        // resolve
        resolve(_.pick(transaction.toJSON(), CollectionKeyMaps.Transaction));
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
        }).populate('store');
        if (!transaction) {
          return reject(Error.NotFound());
        }
        if (transaction.payment_status === PaymentStatus.PAID) {
          return reject(Error.InvalidRequest(res.__('PAYMENT.TRANSACTION_PAID')));
        }
        if (transaction.payment_status === PaymentStatus.PROCESSING) {
          return reject(Error.InvalidRequest(res.__('PAYMENT.TRANSACTION_IN_PROCESS')));
        }
        // Check that the user has enough balance to pay
        const balance = await res.locals.blockchainWallet.getKadimaBalance(acc.blockchain.wallet.add);
        if (balance.balance < transaction.amount) {
          return reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_BALANCE')));
        }

        const merchantAccount = await res.locals.db.accounts.findOne({
          _id: transaction.store.account_id,
        });

        transaction.set({
          payment_status: PaymentStatus.PROCESSING,
        });
        await transaction.save();

        const speed = 1;
        const paymentTransaction = await res.locals.blockchainWallet.transferKadimaCoin({
          from: acc.blockchain.wallet.add,
          to: merchantAccount.blockchain.wallet.add,
          amount: transaction.amount,
          from_wallet_private_key: res.locals.accounts.decryptWalletPrivateKey(acc.blockchain.wallet.enc),
          speed,
          translate: res.__,
          locale: req.getLocale(),
        });

        const now = new Date();
        await res.locals.db.transactions.update({
          _id: req.params.transactionId,
        }, {
          $set: {
            payee: acc.id,
            payment_status: PaymentStatus.PAID,
            paid_on: now,
            updated_at: now,
            payment_info: paymentTransaction,
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
