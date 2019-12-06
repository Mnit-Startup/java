const {checkSchema} = require('express-validator/check');

// validation schmea for controller which sends
// details of paid transaction to provided email
module.exports = checkSchema({
  email: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_MISSING_EMAIL'),
    },
    isEmail: true,
    errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_MISSING_EMAIL'),
  },
});
