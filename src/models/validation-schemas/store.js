const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  // TODO jjalan: Add more attributes such as location with a store
  name: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.STORE_MISSING_NAME'),
    },
  },
});
