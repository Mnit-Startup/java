const _ = require('lodash');
const {PaymentStatus, Currency} = require('../models');

async function getAmountOfTransactionsInProcess(ctx, payee) {
  const transactionsInProcess = await ctx.db.transactions.find({payee, payment_status: PaymentStatus.PROCESSING});
  let amount = 0;
  if (!_.isNil(transactionsInProcess)) {
    _.forEach(transactionsInProcess, (transaction) => {
      amount += transaction.amount;
    });
  }
  return amount;
}

async function getKDMAmountOfTopuspInProcess(ctx) {
  let amount = 0;
  const pendingKadimaTopups = await ctx.db.topups.find({currency: Currency.KDM, topup_status: PaymentStatus.PROCESSING});
  if (!_.isNil(pendingKadimaTopups)) {
    _.forEach(pendingKadimaTopups, (topup) => {
      amount += topup.amount;
    });
  }
  return amount;
}

module.exports = {
  getAmountOfTransactionsInProcess,
  getKDMAmountOfTopuspInProcess,
};
