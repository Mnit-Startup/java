const config = require('config');

/**
 * @function - loads config value
 * @param {string} path
 */
exports.get = path => config.get(path);

/**
 * @function - checks whether the config was provided for path
 * @param {string} path
 * @returns boolean
 */
exports.has = path => config.has(path);

/**
 * @function - ensures that config entries were provided for paths
 * @param {[string | {check: string, config: string}]} paths
 */
exports.ensure = (paths) => {
  paths.forEach((path) => {
    // config.ge throws error if not found
    if (typeof path === 'string') {
      config.get(path);
    } else if (config.has(path.check) && config.get(path.check) === true) {
      config.get(path.config);
    }
  });
};

/**
 * @function - checks whether provided path is set to true
 * @param {string} path
 * @returns boolean
 */
exports.check = path => config.has(path) && config.get(path) === true;
