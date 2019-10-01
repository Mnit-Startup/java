const fs = require('fs');

// static config
const ACCESS_PERMISSIONS = fs.constants.R_OK || fs.constants.W_OK;

/**
 * @function - initializes directory if not already exists
 * @param {string} dir
 */
exports.initDirIfNExists = (dir) => {
  try {
    fs.accessSync(dir, ACCESS_PERMISSIONS);
    // already exits, do nothing
  } catch (e) {
    // does not exists, create
    fs.mkdirSync(dir);
  }
};
