const {checkSchema} = require('express-validator/check');
const PaymentMode = require('../payment-modes');

module.exports = checkSchema({
  mode_of_payment: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_PAYMENT_MODE'),
    },
    // to pay a transaction
    // there are two supported modes of transaction:
    // 1.kadima 2.cash
    isIn: {
      options: [[PaymentMode.CASH, PaymentMode.KADIMA]],
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_PAYMENT_MODE'),
    },
  },
});
