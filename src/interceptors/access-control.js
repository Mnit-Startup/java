const Promise = require('bluebird');

const {Error} = require('../helpers');

const {Roles} = require('../models');

/**
 * @param [opts]
 * @param {String} opts.role
 * @return {Function}
 */
module.exports = (opts) => {
  const options = opts || {};
  return (req, res, next) => new Promise(async (resolve, reject) => {
    try {
      // obtain token - our in house bearer token parser
      const header = req.get('Authorization');
      if (!header) {
        return reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.MISSING_AUTH')));
      }
      // split it
      const splits = header.split(' ');
      // process splits
      if (splits.length !== 2 || splits[0] !== 'Bearer' || !splits[1]) {
        return reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
      }
      // all good, obtain token from splits
      const token = splits[1];
      let decoded = null;
      let decodeErr = null;
      // decode it, manually handle any errors
      try {
        decoded = res.locals.accounts.decodeJWT({token});
      } catch (e) {
        decodeErr = e;
      }
      // verify
      if (decodeErr || !decoded) {
        return reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
      }
      // process it - role negotiation
      if (options.role && options.role !== decoded.role) {
        return reject(Error.Forbidden());
      }
      // load user account
      let acc;
      // if consumer or merchant locate in accounts
      if (decoded.role === Roles.CONSUMER || decoded.role === Roles.MERCHANT) {
        acc = await res.locals.db.accounts.findById(decoded.id);
      } else {
        // if employee locate in employees
        acc = await res.locals.db.employees.findById(decoded.id);
      }
      // verify acc
      if (!acc) {
        return reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
      }
      // all good
      return resolve(acc);
    } catch (e) {
      return reject(e);
    }
  }).asCallback((err, acc) => {
    if (err) {
      next(err);
    } else {
      req.user_acc = acc;
      next();
    }
  });
};
