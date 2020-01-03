const _ = require('lodash');
const moment = require('moment');

const {Logger} = require('../../helpers');
const {PaymentStatus, PaymentMode} = require('../../models');

const MAIL_ACCOUNTS_SENDER = 'accounts';
const TRANSACTION_EMAIL_RECEIPT = 'transactionEmailReceipt';

module.exports = async (ctx, msg) => {
  const {localization, channel, modules} = ctx;
  const params = ctx.deserializeMessage(msg);
  const {
    transaction, acc, merchantAccount, locale,
  } = params;
  new Promise(async (resolve) => {
    Logger.info('worker.transfer_kadima - starting routine for transactionId - %s', transaction.id);
    const speed = 1;
    const paymentTransaction = await modules.blockchainWallet.transferKadimaCoin({
      from: acc.blockchain.wallet.add,
      to: merchantAccount.blockchain.wallet.add,
      amount: transaction.amount,
      from_wallet_private_key: modules.accounts.decryptWalletPrivateKey(acc.blockchain.wallet.enc),
      speed,
      translate: localization.__,
      locale,
    });
    return resolve(paymentTransaction);
  }).then(async (paymentTransaction) => {
    const now = new Date();
    // get the subtotal of a transaction
    // calculate tax for the transaction
    const tax = _.round(transaction.amount - transaction.subTotal, 2);
    // create a receipt for this transaction
    const receipt = await modules.db.receipts.create({
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
      sub_total: transaction.subTotal,
      tax,
      payment_mode: PaymentMode.KADIMA,
    });

    await modules.db.transactions.updateOne({
      _id: transaction.id,
    }, {
      $set: {
        payment_status: PaymentStatus.PAID,
        paid_on: now,
        updated_at: now,
        payment_info: paymentTransaction,
        payment_mode: PaymentMode.KADIMA,
        receipt: receipt.id,
      },
    });
    const receiptDetails = receipt.toJSON();
    receiptDetails.transaction = transaction.id;
    // calcaute amount each item adds in cart
    _.forEach(receiptDetails.cart.products, (item) => {
      item.cost = item.price * item.quantity;
    });
    const emailData = {
      date: moment(receipt.created_at).format('DD/MM/YYYY'),
      receiptDetails,
    };
    // send email
    await modules.mail.sendEmail({
      sender: MAIL_ACCOUNTS_SENDER,
      template: TRANSACTION_EMAIL_RECEIPT,
      recipient: {
        email: acc.email,
      },
      data: emailData,
      locale,
    });
    // acknowledge the message so that handler can receive the next one in queue
    Logger.info('worker.transfer_kadima - concluding routine for transactionId - %s via ack', transaction.id);
    channel.ack(msg);
  }).catch((err) => {
    // log
    Logger.error('worker.transfer_kadima - encountered error at transfer kadima for transactionId - %s - %s', transaction.id, err.message);
    ctx.captureException(err);
    // can inform someone about the failure
  });
};
