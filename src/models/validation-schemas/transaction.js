const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  // TODO jjalan: Add more attributes to transaction
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
