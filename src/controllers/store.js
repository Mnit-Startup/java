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
        // to do validation of unique store
        const store = await res.locals.db.stores.create({
          name: params.name,
          contact: {
            phone: params.phone,
            email: params.email,
          },
          address: {
            street_address: params.streetAddress,
            street_address_2: params.streetAddress2,
            city: params.city,
            state: params.state,
            zipcode: params.zipcode,
          },
          merchant_id_ein: params.merchantIdEin,
          store_profile: params.storeProfile,
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
