const {checkSchema} = require('express-validator/check');
const {DbUtils} = require('../../modules/mongoose');

module.exports = checkSchema({
  // express validator wildcard syntax to validate array of objects
  'cart_items.*.product': {
    in: 'body',
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_PRODUCT_ID'),
    },
    custom: {
      options: value => DbUtils.checkValidObjectId(value),
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_PRODUCT_ID'),
    },
  },
  // express validator wildcard syntax to validate array of objects
  'cart_items.*.quantity': {
    in: 'body',
    trim: true,
    isEmpty: {
      negated: true,
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_QUANTITY'),
    },
    isInt: {
      options: [{
        gt: 0,
      }],
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_QUANTITY'),
    },
  },
  amount: {
    in: 'body',
    optional: true,
    isFloat: {
      options: [{
        min: 0,
      }],
      errorMessage: (value, {req}) => req.__('VAL_ERRORS.INVALID_AMOUNT'),
    },
  },
});
