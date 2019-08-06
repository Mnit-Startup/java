const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  consumer_wallet: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.MISSING_CONSUMER_WALLET_ADDRESS'),
    },
  },
  merchant_wallet: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.MISSING_MERCHANT_WALLET_ADDRESS'),
    },
  },
  consumer_wallet_pvt_key: {
    in: 'body',
    trim: true,
    optional: true,
  },
  amount: {
    in: 'body',
    trim: true,
    isFloat: {
      options: [{
        gt: 0,
      }],
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_AMOUNT'),
    },
  },
});
