const {checkSchema} = require('express-validator/check');

// server-side validation for emlpoyee login
module.exports = checkSchema({
  emp_number: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.EMP_ACC_LOGIN_MISSING_EMP_NUMBER'),
    },
  },
  store_identifier: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.EMP_ACC_LOGIN_MISSING_STORE_IDENTIFIER'),
    },
  },
  pin: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.EMP_ACC_LOGIN_MISSING_PIN'),
    },
  },
});
