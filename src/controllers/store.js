/* eslint-disable camelcase */
const _ = require('lodash');
const Promise = require('bluebird');
const {CollectionKeyMaps, ValidationSchemas} = require('../models');
const {
  UserAccessControl, MerchantAccessControl, InputValidator,
  StoreAccessControl,
} = require('../interceptors');
const {Error} = require('../helpers');

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
            reject(Error.NotFound());
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
            reject(Error.NotFound());
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
          return reject(Error.NotFound());
        }
        if (!product.active) {
          return reject(Error.InvalidRequest(res.__('PRODUCT.NOT_ACTIVE')));
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
  MerchantAccessControl,
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
