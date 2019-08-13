const path = require('path');
const fs = require('fs');
const _ = require('lodash');

/**
 * @function - unlinks provided path chunks
 * @param {[string]} chunks
 */
exports.unlink = (chunks) => {
  if (!chunks) {
    return;
  }
  _.chunk(chunks, 2)
    .forEach((chunk) => {
      // unlink only if stored otherwise unlink throws error
      try {
        const file = path.join(...chunk);
        fs.accessSync(file, fs.constants.R_OK || fs.constants.W_OK);
        // exists, unlink
        fs.unlinkSync(file);
      } catch (e) {
        // does not exists, do nothing
      }
    });
};
