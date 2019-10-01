const Promise = require('bluebird');
const {Error} = require('../helpers');
const {Roles} = require('../models');

module.exports = (req, res, next) => {
  new Promise(async (resolve, reject) => {
    // load account from req
    const acc = req.user_acc;
    const {id} = req.params;
    // if merchant or consumer match id in params with acc id
    if (acc.role === Roles.MERCHANT || acc.role === Roles.CONSUMER) {
      if (acc.id === id) {
        return resolve(acc);
      }
    // if employee match id in params with employee merchant
    } else if (acc.merchant.equals(id)) {
      return resolve(acc);
    }
    // Make sure that token is authorized to access resource associated with account id
    return reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
  }).asCallback((err) => {
    if (err) {
      next(err);
    } else {
      next();
    }
  });
};
