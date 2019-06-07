/**
 * @function - removes padding (0x) from key
 * @param {string} key
 * @returns {string}
 */
exports.removeKeyPadding = key => key.substring(2, key.length);
