const _ = require('lodash');
const mock = require('mock-require');

// set env for testing
process.env.NODE_CONFIG_ENV = 'testing';

// load config
const config = require('config');

let mockedConfig = {};

function loadMockedConfig() {
  mockedConfig = config.util.toObject();
}

// init mocked config
loadMockedConfig();

mock('config', {
  get(path) {
    const val = _.get(mockedConfig, path);
    // check
    if (val === undefined) {
      throw new Error(`Configuration property for ${path} is not defined`);
    }
    // all cool
    return val;
  },
  has(path) {
    const val = _.get(mockedConfig, path);
    return val !== undefined;
  },
});

module.exports = {
  /**
   * @function - retrieves configuration at provided path
   * @param {string} path
   * @returns {*}
   */
  get(path) {
    return _.get(mockedConfig, path);
  },
  /**
   * @function - updates config at path with value
   * @param {string} path
   * @param value
   */
  set(path, value) {
    _.set(mockedConfig, path, value);
  },
  /**
   * @function - resets the mocked config back to it's original state
   */
  reset() {
    loadMockedConfig();
  },
};
