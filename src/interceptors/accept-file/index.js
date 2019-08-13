const _ = require('lodash');
const multer = require('multer');
const bytes = require('bytes');

const {Errors, CryptoUtils, FSUtils} = require('../../helpers');

const Constants = require('./constants');
const Utils = require('./utils');

// static config
const FILE_UPLOADS_DIR = FSUtils.initializeTempDir('file-uploads');

/**
 * @function - initializes interceptor for accepting file uploads
 * @param {string} fieldName
 * @param [options]
 * @param {string | [string]} [options.dest]
 * @param {number | [number, string]} [options.maxSize]
 * @param {string | [string]} [options.mimeType]
 * @param {Boolean} [options.autoResolveExtension=false]
 */
function AcceptFile(fieldName, options) {
  const opts = options || {};
  // if configured, process maxSize
  if (opts.maxSize) {
    opts.maxSize = _.isArray(opts.maxSize) ? bytes.parse(`${opts.maxSize[0]}${opts.maxSize[1]}`) : opts.maxSize;
    opts.formattedMaxSize = bytes.format(opts.maxSize, {unitSeparator: ' '});
  }
  // if configured, process mimeType
  if (opts.mimeType) {
    opts.mimeType = typeof opts.mimeType === 'string' ? [opts.mimeType] : opts.mimeType;
    opts.formattedMimeType = opts.mimeType.join(', ');
  }
  // if configured, process dest
  if (opts.dest) {
    const stack = [FILE_UPLOADS_DIR];
    if (typeof opts.dest === 'string') {
      stack.push(opts.dest);
    } else if (_.isArray(opts.dest)) {
      stack.push(...opts.dest);
    }
    // init configured dir
    opts.dest = FSUtils.initializeDir(stack);
  } else {
    // fallback to default if not configured
    opts.dest = FILE_UPLOADS_DIR;
  }
  // init invoker
  const invoker = multer({
    // stage #1 - filter file, return done(null, true) to signal file save
    fileFilter: (req, file, done) => {
      // check mimeType
      if (opts.mimeType && !opts.mimeType.includes(file.mimetype)) {
        return done(Errors.ValidationError([
          {
            param: file.fieldname,
            msg: req.__('VAL_ERRORS.FILE_INVALID_MIMETYPE', opts.formattedMimeType, file.mimetype),
          },
        ]));
      }
      // all good, conclude successfully to signal file save
      return done(null, true);
    },
    // stage #2 - invoke storage routine
    storage: multer.diskStorage({
      // stage #2.1 - resolve dir
      destination: (req, file, done) => {
        // init loadedPathChunks for post-processing
        req.loadedPathChunks = req.loadedPathChunks || [];
        req.loadedPathChunks.push(opts.dest);
        // conclude
        done(null, opts.dest);
      },
      // stage #2.2 - resolve filename
      filename: (req, file, done) => {
        // init file name
        let fileName = `${file.fieldname}-${CryptoUtils.generateUUID()}`;
        // if extension resolve is enabled, save file with extension
        // let fileExtension = null;
        if (opts.autoResolveExtension === true) {
          const ext = Constants.MIME_TYPE_EXT[file.mimetype];
          // load onto file
          file.extension = ext;
          // load fileName
          fileName += `.${ext}`;
        }
        // load loadedPathChunks
        req.loadedPathChunks.push(fileName);
        // conclude
        return done(null, fileName);
      },
    }),
    // stage #3 - when all limits are passed, then only file is persisted on storage
    limits: {
      fileSize: opts.maxSize,
    },
  })
    .single(fieldName);
  // conclude with controller invoking invoker
  return (req, res, next) => {
    invoker(req, res, (err) => {
      if (err) {
        if (Errors.isHandled(err) || err.name !== 'MulterError') {
          // do nothing
          next(err);
        } else {
          // multer error, conclude based on the error code
          // init error
          const error = {
            param: err.field,
            msg: undefined,
          };
          switch (err.code) {
            case Constants.MULTER_ERROR_CODE.LARGE_FILE:
              error.msg = res.__('VAL_ERRORS.FILE_INVALID_SIZE_MAX', opts.formattedMaxSize);
              break;
            default:
              error.msg = res.__('VAL_ERRORS.FILE_MALFORMED');
              break;
          }
          // conclude
          next(Errors.ValidationError([error]));
        }
      } else {
        // all good
        next();
      }
    });
  };
}

AcceptFile.CleanUp = [
  (err, req, res, next) => {
    // invoked in case error occurred
    // perform unlink procedure
    Utils.unlink(req.loadedPathChunks);
    // conclude
    next(err);
  },
  (req) => {
    // invoked in case no error occurred
    Utils.unlink(req.loadedPathChunks);
  },
];

// export constants - mime type
AcceptFile.MIME_TYPE = Constants.MIME_TYPE;

// exports constants - size
AcceptFile.SIZE = Constants.SIZE;

module.exports = AcceptFile;
