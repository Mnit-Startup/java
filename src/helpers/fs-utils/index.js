const _ = require('lodash');
const path = require('path');
const config = require('config');

const Utils = require('./utils');

// load from config
const TEMP_DIR = config.get('app.tempDir');

// initialize temp directory
Utils.initDirIfNExists(TEMP_DIR);

/**
 * @function - initializes directory under tmp
 * @param {string | [string]} dir
 * @returns {string | null}
 */
exports.initializeTempDir = (dir) => {
  if (typeof dir === 'string') {
    const mkDir = path.join(TEMP_DIR, dir);
    Utils.initDirIfNExists(mkDir);
    // conclude
    return mkDir;
  }
  if (_.isArray(dir)) {
    // init mkDirs - against which the directories will be initialized, maintaining order
    const mkDirs = [];
    // flat each entry
    let base = null;
    dir.forEach((entry) => {
      if (!base) {
        base = entry;
      } else {
        base = path.join(base, entry);
      }
      mkDirs.push(path.join(TEMP_DIR, base));
    });
    // init dirs
    _.map(mkDirs, Utils.initDirIfNExists);
    // conclude via final merge with base
    return path.join(TEMP_DIR, base);
  }
  // invalid fir format
  return null;
};

/**
 * @function - initializes directory
 * @param {string | [string]} dir
 * @returns {string | null}
 */
exports.initializeDir = (dir) => {
  if (typeof dir === 'string') {
    Utils.initDirIfNExists(dir);
    // conclude
    return dir;
  }
  if (_.isArray(dir)) {
    // init mkDirs - against which the directories will be initialized, maintaining order
    const mkDirs = [];
    // flat each entry
    let base = null;
    dir.forEach((entry) => {
      if (!base) {
        base = entry;
      } else {
        base = path.join(base, entry);
      }
      mkDirs.push(base);
    });
    // init dirs
    _.map(mkDirs, Utils.initDirIfNExists);
    // conclude
    return base;
  }
  // invalid fir format
  return null;
};
