const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const crypto = require('crypto');

function generateHash(input) {
  return crypto.createHash('sha256')
    .update(input)
    .digest('hex');
}

function isModified(hashedVal, rawVal) {
  return hashedVal !== generateHash(rawVal);
}

/**
 * @function
 * @param params
 * @param {string | [string]} params.localeSyncDir - directory where sync info will be stored
 * @param {string | [string]} params.localesDir - directory from where locales will be loaded
 * @param {string} params.localeBase - locale tag acting as base
 * @param {string} params.localeTarget - locale tag acting as target
 * @param {string} params.tag - sync version tagging
 */
module.exports = (params) => {
  // inputs
  const LOCALE_SYNC_DIR = _.isArray(params.localeSyncDir) ? path.join(...params.localeSyncDir) : params.localeSyncDir;
  const LOCALES_DIR = _.isArray(params.localesDir) ? path.join(...params.localesDir) : params.localesDir;
  const LOCALE_BASE = params.localeBase;
  const LOCALE_TARGET = params.localeTarget;
  const LOCALE_SYNC_ID = params.tag;

  const LOCALE_BASE_FILE = `${LOCALE_BASE}.json`;
  const LOCALE_TARGET_FILE = `${LOCALE_TARGET}.json`;
  const LOCALE_SYNC_FILE = `${LOCALE_SYNC_ID}.json`;
  const LOCALE_SYNC_LOCK_FILE = `${LOCALE_SYNC_ID}-lock.json`;

  const BUILD = {};
  const INIT = {};
  const DIFF = {};
  const DIFF_ADDED_PATHS = [];
  const DIFF_REMOVED_PATHS = [];
  const DIFF_UPDATED_PATHS = [];
  const DIFF_PROCESSED_PATHS = [];

  // record initiated timestamp
  const TIMESTAMP_INITIATED = Date.now();

  // read base locale
  const LOCALE_BASE_JSON = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, LOCALE_BASE_FILE), {
    encoding: 'utf-8',
  }));

  // read target locale
  const LOCALE_TARGET_JSON = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, LOCALE_TARGET_FILE), {
    encoding: 'utf-8',
  }));

  // read lock file (if exists)
  const LOCALE_SYNC_LOCK_PATH = path.join(LOCALE_SYNC_DIR, LOCALE_SYNC_LOCK_FILE);
  const LOCALE_SYNC_LOCK_JSON = fs.existsSync(LOCALE_SYNC_LOCK_PATH) ? JSON.parse(fs.readFileSync(LOCALE_SYNC_LOCK_PATH, {
    encoding: 'utf-8',
  })) : {};

  // read diff file (if exists)
  const LOCALE_SYNC_PATH = path.join(LOCALE_SYNC_DIR, LOCALE_SYNC_FILE);
  const LOCALE_SYNC_JSON = fs.existsSync(LOCALE_SYNC_PATH) ? JSON.parse(fs.readFileSync(LOCALE_SYNC_PATH, {
    encoding: 'utf-8',
  })) : {};

  // load from sync
  const LOCALE_SYNC_DIFF = LOCALE_SYNC_JSON.diff;
  const LOCALE_SYNC_MAP = LOCALE_SYNC_JSON.map || [];

  // load from lock
  const LOCALE_SYNC_LOCK_INIT = LOCALE_SYNC_LOCK_JSON.init;
  const LOCALE_SYNC_LOCK_RUNS = LOCALE_SYNC_LOCK_JSON.runs || [];

  // define handler
  function parseEntity(entity, base) {
    Object.keys(entity)
      .forEach((key) => {
        // build base
        const b = base ? `${base}.${key}` : key;
        // process
        if (typeof entity[key] === 'string') {
          // it's an entry
          // load base
          const x = entity[key];
          // load target
          const y = _.get(LOCALE_TARGET_JSON, b);
          // load diff
          const diff = _.get(LOCALE_SYNC_DIFF, b);
          // load entryUpdated
          // ony done when existing init exists
          // returns true if hashed value in init matches the one from calculating has h from loaded one
          let entryUpdated = false;
          // load to init if not yet done
          if (!LOCALE_SYNC_LOCK_INIT) {
            // base not initialized yet
            _.set(INIT, b, generateHash(x));
          } else {
            entryUpdated = isModified(_.get(LOCALE_SYNC_LOCK_INIT, b), x);
          }
          // 1: not found in target
          // 2: already processed in diff
          // 3: values updated
          if (!y || diff || entryUpdated) {
            // set diff
            _.set(DIFF, b, x);
            DIFF_PROCESSED_PATHS.push(b);
            // set build
            _.set(BUILD, b, x);
            // load corresponding paths
            if (!y) {
              DIFF_ADDED_PATHS.push(b);
            } else if (!diff && entryUpdated) {
              DIFF_UPDATED_PATHS.push(b);
            }
          } else {
            // do nothing
            _.set(BUILD, b, y);
          }
        } else {
          // it's an entity, recurse
          parseEntity(entity[key], b);
        }
      });
  }

  // invoke handler
  parseEntity(LOCALE_BASE_JSON);
  // make sure that for every existing diff map, there should be an active entry
  LOCALE_SYNC_MAP.forEach((existingDiffKey) => {
    if (!_.get(DIFF, existingDiffKey)) {
      // entry was removed
      DIFF_REMOVED_PATHS.push(existingDiffKey);
    }
  });

  // write sync
  fs.writeFileSync(path.join(LOCALE_SYNC_DIR, LOCALE_SYNC_FILE), JSON.stringify({
    diff: DIFF,
    map: DIFF_PROCESSED_PATHS,
  }, null, 2), {
    encoding: 'utf-8',
  });

  // write build
  fs.writeFileSync(path.join(LOCALES_DIR, LOCALE_TARGET_FILE), JSON.stringify(BUILD, null, 2), {
    encoding: 'utf-8',
  });

  // record finished timestamp
  const TIMESTAMP_FINISHED = Date.now();

  // build lock
  LOCALE_SYNC_LOCK_RUNS.push({
    initiated_at: TIMESTAMP_INITIATED,
    finished_at: TIMESTAMP_FINISHED,
    duration: TIMESTAMP_FINISHED - TIMESTAMP_INITIATED,
    diff: {
      added: DIFF_ADDED_PATHS,
      removed: DIFF_REMOVED_PATHS,
      updated: DIFF_UPDATED_PATHS,
    },
  });

  // write lock
  fs.writeFileSync(LOCALE_SYNC_LOCK_PATH, JSON.stringify({
    init: LOCALE_SYNC_LOCK_INIT || INIT,
    runs: LOCALE_SYNC_LOCK_RUNS,
  }, null, 2), {
    encoding: 'utf-8',
  });
};
