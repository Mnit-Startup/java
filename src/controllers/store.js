/* eslint-disable camelcase */
const _ = require('lodash');
const Promise = require('bluebird');
const {CollectionKeyMaps, ValidationSchemas} = require('../models');
const {UserAccessControl, MerchantAccessControl, InputValidator} = require('../interceptors');

exports.create = [
  UserAccessControl,
  MerchantAccessControl,
  // validation schema
  ValidationSchemas.Store,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const acc = req.user_acc;
    const params = req.body;
    new Promise(async (resolve, reject) => {
      try {
        const store = await res.locals.db.stores.create({
          name: params.name,
          account_id: acc._id,
        });
        return resolve(_.pick(store.toJSON(), CollectionKeyMaps.Store));
      } catch (e) {
        return reject(e);
      }
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
      }
    });
  },
];
