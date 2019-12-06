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
        const encryptedKey = res.locals.accounts.encryptWalletPrivateKey(wallet.private_key);
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

exports.login = [
  // validation schema
  ValidationSchemas.Login,
  // validation interceptor
  InputValidator(),
  // controller
  (req, res, next) => {
    // get params from body
    const {email, password} = req.body;
    // begin promise
    new Promise(async (resolve, reject) => {
      try {
        // load account
        const account = await res.locals.db.accounts.findOne({email});
        if (!account) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.USR_ACC_LOGIN_INVALID_CRE')));
        }
        // generate password hash
        const passwordHash = await res.locals.accounts.generatePasswordHash(password, account.password.salt);
        // verify it
        if (account.password.hash !== passwordHash) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.USR_ACC_LOGIN_INVALID_CRE')));
        }
        const access = await res.locals.accounts.generateJWT({
          id: account.id,
          role: account.role,
        });
        // conclude
        return resolve({
          account_id: account.id,
          access_token: access.token,
          role: account.role,
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

exports.employeeLogin = [
  // validation schema
  ValidationSchemas.EmployeeLogin,
  // validation interceptor
  InputValidator(),
  // controller
  (req, res, next) => {
    const params = req.body;

    new Promise(async (resolve, reject) => {
      try {
        // query store using store identifier
        const store = await res.locals.db.stores.findOne({store_identifier: params.store_identifier.toLowerCase()});

        // reject if no such store
        if (!store) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.EMP_ACC_LOGIN_INVALID_STORE_IDENTIFIER')));
        }

        // query the employees of this store
        const employeesOnThisStore = await res.locals.db.employeeDetails.find({store: store.id});

        // reject if no employees on the store
        if (employeesOnThisStore.length === 0) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.EMP_ACC_LOGIN_ACCESS_DENIED')));
        }

        // query employees with this employee number
        const employees = await res.locals.db.employees.find({emp_number: params.emp_number});

        // reject if no employees with this employee number
        if (employees.length === 0) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.EMP_ACC_LOGIN_INVALID_CRE')));
        }

        // find the employee with this number and acces to above store
        let index;
        _.forEach(employees, (emp) => {
          index = _.findIndex(employeesOnThisStore, detail => detail.employee.equals(emp._id) && detail.active);
          if (index !== -1) {
            return false;
          }
          return true;
        });

        // reject if no employee on the store with access
        if (index === -1) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.EMP_ACC_LOGIN_ACCESS_DENIED')));
        }

        // employee trying to login
        const employee = employees[index];

        // password verification
        const passwordHash = await res.locals.accounts.generatePasswordHash(params.pin, employee.pin.salt);

        // reject if password match
        if (employee.pin.hash !== passwordHash) {
          return reject(Errors.InvalidRequest(res.__('VAL_ERRORS.EMP_ACC_LOGIN_INVALID_CRE')));
        }

        // generate jwt
        const access = await res.locals.accounts.generateJWT({
          id: employee.id,
          role: employee.role,
        });

        // store_id: id of the store in which employee is trying to log in with store identifer
        // merchant_id: merchant of the employee who is trying to log in
        // resolve promise
        return resolve({
          account_id: employee.id,
          access_token: access.token,
          role: employee.role,
          merchant_id: employee.merchant,
          store_id: store.id,
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
