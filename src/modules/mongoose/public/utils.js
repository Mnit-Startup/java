const mongoose = require('mongoose');

const {ObjectId} = mongoose.Types;

exports.checkValidObjectId = val => ObjectId.isValid(val);

exports.toObjectId = val => ObjectId(val);

exports.parseError = (err) => {
  // init error
  let mongooseErr;
  if (err.errors) {
    // conclude with first error
    mongooseErr = err.errors[Object.keys(err.errors)[0]];
  }
  return mongooseErr;
};

exports.checkConnectionErr = err => err.message === 'no connection available for operation and number of stored operation > 0';

exports.createObjectId = () => ObjectId();

exports.objectIdToString = objectId => objectId.toHexString();
