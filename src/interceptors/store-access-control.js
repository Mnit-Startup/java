const Promise = require('bluebird');
const {Error} = require('../helpers');

module.exports = (req, res, next) => {
  new Promise(async (resolve, reject) => {
    // load account from req
    const acc = req.user_acc;
    const {storeId} = req.params;
    try {
      const store = await res.locals.db.stores.findOne({
        _id: storeId,
        account_id: acc.id,
      });
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
