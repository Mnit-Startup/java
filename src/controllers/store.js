/* eslint-disable camelcase */
const _ = require('lodash');
const Promise = require('bluebird');
const {CollectionKeyMaps, ValidationSchemas} = require('../models');
const {
  UserAccessControl, MerchantAccessControl, InputValidator,
  StoreAccessControl,
} = require('../interceptors');
const {Errors} = require('../helpers');

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
        // check for unique store id provided by merchant
        const existingStore = await res.locals.db.stores.findOne({store_identifier: params.store_identifier});
        if (existingStore) {
          return reject(Errors.ValidationError([{
            param: 'store_identifier',
            msg: res.__('VAL_ERRORS.STORE_ID_EXISTS'),
          }]));
        }
        const store = await res.locals.db.stores.create({
          name: params.name,
          contact: {
            phone: params.phone,
            email: params.email,
          },
          address: {
            street_address: params.street_address,
            street_address_2: params.street_address_2,
            city: params.city,
            state: params.state,
            zipcode: params.zipcode,
          },
          merchant_id_ein: params.merchant_id_ein,
          store_profile: params.store_profile,
          store_identifier: params.store_identifier.toLowerCase(),
          account_id: acc._id,
          image: params.image,
          tax: params.tax,
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

exports.get = [
  UserAccessControl,
  MerchantAccessControl,
  (req, res, next) => {
    const acc = req.user_acc;
    new Promise(async (resolve, reject) => {
      try {
        const stores = await res.locals.db.stores.find({
          account_id: acc.id,
        }).sort({name: 1});
        return resolve(_.map(stores, store => _.pick(store.toJSON(), CollectionKeyMaps.Store)));
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

exports.getStore = [
  UserAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const store = await res.locals.db.stores.findOne({
          _id: req.params.storeId,
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

exports.createProduct = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  // validation schema
  ValidationSchemas.Product,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const params = req.body;
    new Promise(async (resolve, reject) => {
      try {
        const product = await res.locals.db.products.create({
          name: params.name,
          store_id: req.params.storeId,
          price: params.price,
          sku_number: params.sku_number,
          taxable: params.taxable,
          image: params.image,
          active: params.active,
          tax: params.tax,
        });
        return resolve(_.pick(product.toJSON(), CollectionKeyMaps.Product));
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

exports.updateProduct = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  // validation schema
  ValidationSchemas.Product,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const params = req.body;
    new Promise(async (resolve, reject) => {
      try {
        const options = {new: true};
        const updatedProduct = await res.locals.db.products.findOneAndUpdate({
          _id: req.params.productId,
        }, {
          $set: {
            name: params.name,
            price: params.price,
            sku_number: params.sku_number,
            taxable: params.taxable,
            image: params.image,
            active: params.active,
          },
        },
        options,
        (err, product) => {
          if (!_.isNil(err)) {
            reject(err);
          } else if (_.isNull(product)) {
            reject(Errors.NotFound());
          }
        });
        return resolve(_.pick(updatedProduct.toJSON(), CollectionKeyMaps.Product));
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

exports.removeProduct = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const options = {new: true};
        const updatedProduct = await res.locals.db.products.findOneAndUpdate({
          _id: req.params.productId,
        }, {
          $set: {
            active: false,
          },
        },
        options,
        (err, product) => {
          if (!_.isNil(err)) {
            reject(err);
          } else if (_.isNull(product)) {
            reject(Errors.NotFound());
          }
        });
        // return updated
        return resolve(_.pick(updatedProduct.toJSON(), CollectionKeyMaps.Product));
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

exports.getProduct = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const product = await res.locals.db.products.findOne({
          _id: req.params.productId,
        });
        if (!product) {
          return reject(Errors.NotFound());
        }
        if (!product.active) {
          return reject(Errors.InvalidRequest(res.__('PRODUCT.NOT_ACTIVE')));
        }
        return resolve(_.pick(product.toJSON(), CollectionKeyMaps.Product));
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

exports.getProducts = [
  UserAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    const {storeId} = req.params;
    new Promise(async (resolve, reject) => {
      try {
        const products = await res.locals.db.products.find({
          store_id: storeId,
          active: true,
        });
        return resolve(_.map(products, product => _.pick(product.toJSON(), CollectionKeyMaps.Product)));
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

exports.assignStoreToEmployee = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const employeeDetails = {
          store: req.params.storeId,
          employee: req.params.empId,
          role: req.params.role,
        };

        const assignedStore = await res.locals.db.employeeDetails.findOne(employeeDetails);
        if (!_.isNil(assignedStore) && assignedStore.active) {
          return reject(Errors.ValidationError([{
            param: 'store',
            msg: res.__('VAL_ERRORS.STORE_ALREADY_ASSIGNED'),
          }]));
        }
        if (!_.isNil(assignedStore) && !assignedStore.active) {
          assignedStore.set({
            active: true,
          });
          await assignedStore.save();
          return resolve(_.pick(assignedStore.toJSON(), CollectionKeyMaps.EmployeeDetail));
        }
        employeeDetails.active = true;
        const assignStore = await res.locals.db.employeeDetails.create(employeeDetails);

        return resolve(_.pick(assignStore.toJSON(), CollectionKeyMaps.EmployeeDetail));
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

exports.removeEmployeeFromStore = [
  UserAccessControl,
  MerchantAccessControl,
  StoreAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const options = {new: true};
        const updatedEmployeeDetail = await res.locals.db.employeeDetails.findOneAndUpdate({
          employee: req.params.empId,
          store: req.params.storeId,
          role: req.params.role,
        }, {
          $set: {
            active: false,
          },
        },
        options,
        (err, detail) => {
          if (!_.isNil(err)) {
            reject(err);
          } else if (_.isNull(detail)) {
            reject(Errors.NotFound());
          }
        });
        // return updated
        return resolve(_.pick(updatedEmployeeDetail.toJSON(), CollectionKeyMaps.EmployeeDetail));
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
