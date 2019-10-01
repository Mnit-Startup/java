const _ = require('lodash');
const Promise = require('bluebird');
const {Error} = require('../helpers');
const {Roles} = require('../models');

module.exports = (req, res, next) => {
  new Promise(async (resolve, reject) => {
    // load account from req
    const acc = req.user_acc;
    const {storeId, id, storeIdentifier} = req.params;
    try {
      let store;
      // if merchant accessing the store: always check with store id in params
      if (acc.role === Roles.MERCHANT) {
        store = await res.locals.db.stores.findOne({
          _id: storeId,
          account_id: acc.id,
        });
      // if employee accessing the store with store identifer: find with store identifier
      } else if (!_.isNil(storeIdentifier)) {
        store = await res.locals.db.stores.findOne({
          store_identifier: storeIdentifier,
          account_id: id,
        });
      // if employee accessing store but not with store identifier: find with store id in params
      } else {
        store = await res.locals.db.stores.findOne({
          _id: storeId,
          account_id: id,
        });
      }

      if (!store) {
        return reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
      }
      return resolve(store);
    } catch (e) {
      return reject(e);
    }
  }).asCallback((err, store) => {
    if (err) {
      next(err);
    } else {
      req.store = store;
      next();
    }
  });
};
