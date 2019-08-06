const Web3 = require('web3');

/**
 * @function - removes padding (0x) from key
 * @param {string} key
 * @returns {string}
 */
exports.removeKeyPadding = key => key.substring(2, key.length);

/**
 * @function - initializes provider for Web3 based on the endpoint provided
 * @param endpoint
 */
exports.getProviderForWeb3 = (endpoint) => {
  // resolve protocol
  const [protocol] = endpoint.split('://');
  // conclude based on the resolved protocol
  // throw error if none could be resolved
  switch (protocol) {
    case 'https':
    case 'http':
      return new Web3.providers.HttpProvider(endpoint);
    case 'wss':
    case 'ws':
      return new Web3.providers.WebsocketProvider(endpoint);
    default:
      throw new Error('Encountered error at getProviderForWeb3 - No supported protocol could be resolved for initializing provider');
  }
};
