const _ = require('lodash');
const {PaymentStatus} = require('../models');

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

module.exports = {
  getAmountOfTransactionsInProcess,
};
