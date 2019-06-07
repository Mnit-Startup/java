/* eslint-disable default-case */
const Promise = require('bluebird');
const _ = require('lodash');

const {CollectionKeyMaps, Roles, ValidationSchemas} = require('../models');
const {InputValidator} = require('../interceptors');
const {Errors} = require('../helpers');

exports.register = [
  // validation schema
  ValidationSchemas.Account,
  // validation intercepter
  InputValidator(),
  // controller
  (req, res, next) => {
    // host elements from which params will be acquired
    const params = req.body;
    // load role
    const {role} = req.params;
    // begin process
    new Promise(async (resolve, reject) => {
      try {
        // check for an existing account
        const existingAcc = await res.locals.db.accounts.findOne({email: params.email});
        if (existingAcc) {
          return reject(Errors.ValidationError([{
            param: 'email',
            msg: res.__('VAL_ERRORS.USR_ACC_NEW_EMAIL_EXISTS'),
          }]));
        }
        // init hash and salts for new password
        const {hash, salt} = res.locals.accounts.initPasswordHash(params.password);
        // init blockchain identity for the issuer
        const wallet = res.locals.blockchainWallet.createNew();
        // encrypt the private key via encryptionkey
        const encryptedKey = res.locals.accounts.encryptFromPassword(wallet.private_key, params.password);
        // create account
        const registerData = {
          email: params.email,
          password: {
            hash,
            salt,
          },
          role,
          blockchain: {
            wallet: {
              add: wallet.address,
              pub: wallet.public_key,
              enc: encryptedKey,
            },
          },
        };
        const account = await res.locals.db.accounts.create(registerData);
        // create new profile based on the role
        // profileKeys which will be loaded based on the active role
        let profile;
        let profileKeys;
        switch (role) {
          case Roles.CONSUMER:
            profileKeys = CollectionKeyMaps.ProfileConsumer;
            profile = await res.locals.db.consumers.create({
              account_id: account._id,
            });
            break;
          case Roles.MERCHANT:
            profileKeys = CollectionKeyMaps.ProfileMerchant;
            profile = await res.locals.db.merchants.create({
              account_id: account._id,
            });
            break;
        }
        return resolve({
          account: _.pick(account.toJSON(), CollectionKeyMaps.Account),
          profile: _.pick(profile.toJSON(), profileKeys),
        });
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
