const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  wallet: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.MISSING_CONSUMER_WALLET_ADDRESS'),
    },
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
