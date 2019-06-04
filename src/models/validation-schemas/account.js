const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  email: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_MISSING_EMAIL'),
    },
  },
  password: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_MISSING_PWD'),
    },
  },
});
