/* eslint-disable camelcase */
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const request = require('async-request');
const config = require('config');

const {
  CollectionKeyMaps, ValidationSchemas, PaymentStatus, PaymentMode, Currency,
} = require('../models');
const {
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  ConsumerAccessControl,
  InputValidator,
} = require('../interceptors');
const {Error} = require('../helpers');
const Mail = require('../modules/mail/lib');
const {Task} = require('../modules/worker');
const {getAmountOfTransactionsInProcess, getKDMAmountOfTopuspInProcess} = require('./shared');
const {DbUtils} = require('../modules/mongoose');

const BLOCKADE_KADIMA_WALLET_ADDRESS = config.get('blockchain.blockadeKadimaWallet.address');
const MAIL_RECEIVER = config.get('mail.admin.email');

const INSUFFICIENT_KADIMA = 'insufficientKadimaInSystemWallet';
const TRANSACTION_EMAIL_RECEIPT = 'transactionEmailReceipt';
const MAIL_ACCOUNTS_SENDER = 'accounts';

exports.createStoreTransaction = [
  UserAccessControl,
  StoreAccessControl,
  // validation schema
  ValidationSchemas.Transaction,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const {cart_items, amount} = req.body;
    new Promise(async (resolve, reject) => {
      try {
        if (_.isNil(amount)) {
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
        } else {
          // create transaction
          const transaction = await res.locals.db.transactions.create({
            store: req.store.id,
            amount,
            payment_status: PaymentStatus.PENDING_PAYMENT,
            cart: {
              products: [],
            },
          });
          // resolve
          resolve(_.pick(transaction.toJSON(), CollectionKeyMaps.Transaction));
        }
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

/* Function to send email using receipt of a paid transaction */
async function sendEmail(transactionId, receipt, receiverEmail, locale) {
  /* Email Data:
          1. Date
          2. Merchant Name
          3. Location Identifier
          4. Cart items
          5. Subtotal, tax, total
          6. Payment mode
          7. Transaction id
           */
  const receiptDetails = receipt.toJSON();
  receiptDetails.transaction = transactionId;
  // calcaute amount each item adds in cart
  _.forEach(receiptDetails.cart.products, (item) => {
    item.cost = item.price * item.quantity;
  });
  const emailData = {
    date: moment(receipt.created_at).format('DD/MM/YYYY'),
    receiptDetails,
  };
  // send email
  await Mail.sendEmail({
    sender: MAIL_ACCOUNTS_SENDER,
    template: TRANSACTION_EMAIL_RECEIPT,
    recipient: {
      email: receiverEmail,
    },
    data: emailData,
    locale,
  });
} /* End function */

exports.payTransaction = [
  // validation schema
  ValidationSchemas.PayTransaction,
  // validation interceptor
  InputValidator(),
  (req, res, next) => {
    const acc = req.user_acc;
    const {mode_of_payment} = req.body;
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
        let paymentTransaction;
        let payee;
        // if mode of payment is kadima
        // transfer ERC-20 token kadima
        if (mode_of_payment.toLowerCase() === PaymentMode.KADIMA) {
          /* Check that the user has enough balance to pay
          For this:
          1. Get the balance of user using blockchain module
          2. Get all the transaction of the user which are in process
          Calculate available based on these */

          // balance from blockchain module
          const balance = await res.locals.blockchainWallet.getKadimaBalance(acc.blockchain.wallet.add);
          // if any transactions in process, calculate available balance
          const amountTransactionsInProcess = await getAmountOfTransactionsInProcess(res.locals, acc.id);
          balance.balance -= amountTransactionsInProcess;
          // check if sufficient available balance is present in user account
          if (balance.balance < transaction.amount) {
            // if not reject request
            return reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_BALANCE')));
          }
          const merchantAccount = await res.locals.db.accounts.findOne({
            _id: transaction.store.account_id,
          });
          payee = acc.id;
          transaction.set({
            payment_status: PaymentStatus.PROCESSING,
            payee,
          });
          await transaction.save();
          const txn = transaction.toJSON();
          txn.subTotal = transaction.getSubtotal();

          // create a task for queue dedicated to transfer kadima
          const task = new Task('transfer_kadima', {
            transaction: txn,
            acc,
            merchantAccount,
            locale: req.getLocale(),
          });

          // submit task to queue
          await res.locals.worker.submitTask(task);
        } else if (mode_of_payment.toLowerCase() === PaymentMode.CASH) { // if mode of payment is cash
          paymentTransaction = PaymentMode.CASH;
          const now = new Date();
          // get the subtotal of a transaction
          const subTotal = transaction.getSubtotal();
          // calculate tax for the transaction
          const tax = _.round(transaction.amount - subTotal, 2);
          // create a receipt for this transaction
          const receipt = await res.locals.db.receipts.create({
            store: {
              id: transaction.store.id,
              name: transaction.store.name,
              address: transaction.store.address.street_address,
              city: transaction.store.address.city,
              state: transaction.store.address.state,
              zipcode: transaction.store.address.zipcode,
              logo: transaction.store.image,
            },
            cart: transaction.cart,
            total: transaction.amount,
            sub_total: subTotal,
            tax,
            payment_mode: mode_of_payment,
          });
          await res.locals.db.transactions.update({
            _id: req.params.transactionId,
          }, {
            $set: {
              payee,
              payment_status: PaymentStatus.PAID,
              paid_on: now,
              updated_at: now,
              payment_info: paymentTransaction,
              payment_mode: mode_of_payment,
              receipt: receipt.id,
            },
          });
        }
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

/* Controller to send email reciept for a paid cash transaction */
exports.emailReceipt = [
  // validation schema
  ValidationSchemas.EmailTransactionReceipt,
  // validation interceptor
  InputValidator(),
  (req, res, next) => {
    const {email} = req.body;
    const {transactionId} = req.params;
    new Promise(async (resolve, reject) => {
      try {
        // locate the transaction in db
        const receipt = await res.locals.db.receipts.findOne({
          _id: req.params.receiptId,
        });
        // if no such transaction exists reject and return
        if (!receipt) {
          return reject(Error.NotFound());
        }
        await sendEmail(transactionId, receipt, email, req.getLocale());
        return resolve(_.pick(receipt.toJSON(), CollectionKeyMaps.Receipt));
      } catch (e) {
        // if error reject promise and return
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

exports.topupConsumerWallet = [
  // validation schema for request body
  ValidationSchemas.TopupConsumerWallet,
  // request body validation schema interception
  InputValidator(),
  (req, res, next) => {
    const {payment_id} = req.body;
    new Promise(async (resolve, reject) => {
      try {
        // verify payment id and get toput details:
      // 1. consumer account id
      // 2. amount
        const response = await request('http://localhost:8080/transaction/hello');
        if (response.statusCode !== 200) {
          return reject(response.body);
        }
        const body = JSON.parse(response.body);
        const {account_id} = body;
        let {currency, amount} = body;
        let taskQueue;

        if (!DbUtils.checkValidObjectId(account_id) || !_.isFinite(amount) || !_.gt(amount, 0)
        || _.isNil(Currency[currency.toUpperCase()])) {
          return reject(Error.InvalidRequest());
        }
        // checks on account id, amount, and currency
        // queue up topup request
        const acc = await res.locals.db.accounts.findOne({_id: account_id});
        if (!acc) {
          return reject(Error.NotFound());
        }
        currency = currency.toLowerCase();
        amount = _.round(amount, 2);
        if (currency === Currency.KDM) {
          const kadimaBalance = await res.locals.blockchainWallet.getKadimaBalance(BLOCKADE_KADIMA_WALLET_ADDRESS);
          let kadimaInSource = kadimaBalance.balance;
          // get pending kadima topups
          const kadimaTopupsInProcessAmount = await getKDMAmountOfTopuspInProcess(res.locals);
          kadimaInSource -= kadimaTopupsInProcessAmount;
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
            return reject(Error.InvalidRequest(res.__('PAYMENT.INSUFFICIENT_KADIMA_IN_SYSTEM_WALLET')));
          }
          taskQueue = 'transfer_kadima';
        }
        const topup = await res.locals.db.topups.create({
          acc: acc.id,
          payment_id,
          amount,
          currency,
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

exports.hello = [
  (req, res) => {
    const details = {
      account_id: '5d9b0f785084bc1c7ac48b2a',
      amount: 10,
      currency: 'KDM',
    };
    res.send(details);
  },
];
