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
  price: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
    isFloat: {
      options: [{
        min: 0,
      }],
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
  sku_number: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
  taxable: {
    in: 'body',
    isBoolean: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
  image: {
    in: 'body',
    trim: true,
    optional: true,
  },
  active: {
    in: 'body',
    isBoolean: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('invalid param'),
    },
  },
  tax: {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.MISSING_TAX_RATE'),
    },
    isFloat: {
      options: [{
        min: 0,
      }],
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_TAX_RATE'),
    },
  },
});
