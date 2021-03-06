/* eslint-disable camelcase */
const _ = require('lodash');
const Promise = require('bluebird');
const {CollectionKeyMaps, ValidationSchemas} = require('../models');
const {
  UserAccessControl, MerchantAccessControl, InputValidator,
} = require('../interceptors');
const {Errors} = require('../helpers');

exports.createEmployee = [
  UserAccessControl,
  MerchantAccessControl,
  // validation schema
  ValidationSchemas.Employee,
  // validation intercepter
  InputValidator(),
  // controller
  (req, res, next) => {
    const params = req.body;
    new Promise(async (resolve, reject) => {
      try {
        // init hash and salts for new pin
        const {hash, salt} = res.locals.accounts.initPasswordHash(params.pin);
        // create employee
        const employee = await res.locals.db.employees.create({
          name: params.name,
          emp_number: params.emp_number,
          pin: {
            hash,
            salt,
          },
          role: params.role,
          merchant: req.params.id,
          active: params.active,
        });
        return resolve(_.pick(employee.toJSON(), CollectionKeyMaps.Employee));
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

exports.getEmployees = [
  UserAccessControl,
  MerchantAccessControl,
  (req, res, next) => {
    const {role} = req.params;
    new Promise(async (resolve, reject) => {
      try {
        const employees = await res.locals.db.employees.find({
          merchant: req.params.id,
          role,
          active: true,
        }, null, {
          sort: {
            name: 1,
          },
        });
        const promises = _.map(employees, emp => emp.getEmployeeDetail(res.locals.db)
          .then((stores) => {
            const employee = _.pick(emp.toJSON(), CollectionKeyMaps.Employee);
            employee.stores = stores;
            return employee;
          }));
        Promise.all(promises)
          .asCallback((error, response) => {
            if (error) {
              next(error);
            } else {
              resolve(response);
            }
          });
      } catch (e) {
        reject(e);
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

exports.removeEmployee = [
  UserAccessControl,
  MerchantAccessControl,
  (req, res, next) => {
    new Promise(async (resolve, reject) => {
      try {
        const options = {new: true};
        const updatedEmployee = await res.locals.db.employees.findOneAndUpdate({
          _id: req.params.empId,
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
        return resolve(_.pick(updatedEmployee.toJSON(), CollectionKeyMaps.Employee));
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

exports.updateEmployee = [
  UserAccessControl,
  MerchantAccessControl,
  // validation schema
  ValidationSchemas.Employee,
  // validation intercepter
  InputValidator(),
  (req, res, next) => {
    const params = req.body;
    new Promise(async (resolve, reject) => {
      try {
        const options = {new: true};
        let employeeUpdatedDetails = {};
        // if new pin is provided
        if (!_.isEmpty(params.pin)) {
          // generate hash and salts for new pin
          const {hash, salt} = res.locals.accounts.initPasswordHash(params.pin);
          employeeUpdatedDetails = {
            name: params.name,
            emp_number: params.emp_number,
            pin: {
              hash,
              salt,
            },
          };
        } else {
          employeeUpdatedDetails = {
            name: params.name,
            emp_number: params.emp_number,
          };
        }
        const updatedEmployee = await res.locals.db.employees.findOneAndUpdate({
          _id: req.params.empId,
        }, {
          $set: employeeUpdatedDetails,
        },
        options,
        (err, employee) => {
          if (!_.isNil(err)) {
            reject(err);
          } else if (_.isNull(employee)) {
            reject(Errors.NotFound());
          }
        });
        const stores = await updatedEmployee.getEmployeeDetail(res.locals.db);
        const employee = _.pick(updatedEmployee.toJSON(), CollectionKeyMaps.Employee);
        employee.stores = stores;
        return resolve(employee);
      } catch (e) {
        return reject(e);
      }
    }).asCallback(async (err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
      }
    });
  },
];
