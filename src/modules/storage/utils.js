/**
 * @function - builds key for asset access
 * @param {string} bucket
 * @param {string} key
 * @returns {string}
 */
exports.buildKeyForAsset = (bucket, key) => `${bucket}:${key}`;

exports.buildLinkForAsset = (base, bucket, key) => `${base}/${bucket}/${key}`;
