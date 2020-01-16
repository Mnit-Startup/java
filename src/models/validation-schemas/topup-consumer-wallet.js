const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  payment_id: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.MISSING_PAYMENT_ID'),
    },
  },
});
