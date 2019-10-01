const {checkSchema} = require('express-validator/check');

module.exports = checkSchema({
  name: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
  emp_number: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invlid param'),
    },
  },
  pin: {
    in: 'body',
    trim: true,
    isString: true,
  },
  role: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
  active: {
    in: 'body',
    isBoolean: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
});
