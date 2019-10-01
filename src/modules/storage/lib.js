const Promise = require('bluebird');
const S3 = require('aws-sdk/clients/s3');
const config = require('config');
const _ = require('lodash');
const fs = require('fs');

const {CryptoUtils, Logger} = require('../../helpers');

const Utils = require('./utils');

// static config
const MODULE_NAMESPACE = 'mod.storage';

// load from config
const SDK_OPTIONS = config.has('aws.sdk.options') ? config.get('aws.sdk.options') : null;
const S3_OPTIONS = config.has('aws.services.s3.options') ? config.get('aws.services.s3.options') : null;
const S3_LINK_BASE = config.get('aws.services.s3.linkBase');
const ACCESS_KEY = config.get('aws.sdk.access.key');
const ACCESS_SECRET = config.get('aws.sdk.access.secret');
const BUCKETS = config.get('aws.services.s3.buckets');

// initialize service
const s3 = new S3(_.assign(
  null,
  // note - global sdk options can be override by service options
  SDK_OPTIONS,
  S3_OPTIONS,
  {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: ACCESS_SECRET,
  },
));

/**
 * @function - uploads file from local storage to S3
 * @param {string} file
 * @param params
 * @param {string} params.key
 * @param {string} params.bucket
 * @returns Promise
 */
exports.upload = (file, params) => new Promise((resolve, reject) => {
  // generate request id for tracking
  const requestId = CryptoUtils.generateUUID();
  // get bucket from config
  const bucket = BUCKETS[params.bucket];
  // log
  Logger.info('Module.Storage.upload: %s - Attempting to start procedure. File: %s, Key: %s, Bucket: %s', requestId, file, params.key, bucket);
  // send upload request
  s3.upload({
    Bucket: bucket,
    Key: params.key,
    Body: fs.createReadStream(file),
  }, (err, obj) => {
    if (err) {
      // log
      Logger.error('Module.Storage.upload: %s - Encountered error - %s', requestId, err.message);
      // add tracking to error
      // noinspection JSUndefinedPropertyAssignment
      err.trackId = `${MODULE_NAMESPACE}:${requestId}`;
      // conclude with error
      reject(err);
    } else {
      Logger.info('Module.Storage.upload: %s - Procedure concluded successfully');
      // conclude with link and key
      resolve({
        link: Utils.buildLinkForAsset(S3_LINK_BASE, bucket, obj.Key),
        key: Utils.buildKeyForAsset(bucket, obj.Key),
      });
    }
  });
});
