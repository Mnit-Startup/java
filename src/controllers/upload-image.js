const Promise = require('bluebird');
const {AcceptFile} = require('../interceptors');
// static config
const ISSUER_ASSETS_STORAGE_BUCKET = 'merchantAssets';
const MERCHANT_ASSETS_DIR = 'merchant-assets';

exports.uploadImage = [
  // process incoming files
  AcceptFile('photo', {
    mimeType: [AcceptFile.MIME_TYPE.IMAGE_PNG, AcceptFile.MIME_TYPE.IMAGE_JPG],
    maxSize: [2, AcceptFile.SIZE.MB],
    dest: MERCHANT_ASSETS_DIR,
    autoResolveExtension: true,
  }),
  // controller
  // note - controller is also invoked in case no file was provided, handle accordingly
  (req, res, next) => {
    // load files from req
    const logo = req.file;
    // begin process
    new Promise(async (resolve, reject) => {
      try {
        // init ret, payload to conclude the procedure with
        // ret will contain links to uploaded assets
        const ret = {};
        if (logo) {
          // upload
          const obj = await res.locals.storage.upload(logo.path, {
            // note - logo.filename also honors the extension
            key: logo.filename,
            bucket: ISSUER_ASSETS_STORAGE_BUCKET,
          });
            // load ret with access links
          ret.logo = obj.link;
        }
        // conclude
        resolve(ret);
      } catch (err) {
        reject(err);
      }
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
        // in order for clean up to run
        next();
      }
    });
  },
  // clean up
  AcceptFile.CleanUp,
];
