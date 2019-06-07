const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  email: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_LOGIN_MISSING_EMAIL'),
    },
    isEmail: {
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_LOGIN_INVALID_EMAIL'),
    },
  },
  password: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.USR_ACC_LOGIN_MISSING_PWD'),
    },
  },
});
