exports.InvalidRequest = (msg) => {
  const eMsg = msg || '';
  const error = new Error(eMsg);
  error.api_code = 'invalid_request';
  error.api_status = 400;
  // noinspection JSUndefinedPropertyAssignment
  error.locale_tag = 'INVALID_REQUEST';
  return error;
};

exports.NotFound = (msg) => {
  const eMsg = msg || '';
  const error = new Error(eMsg);
  error.api_code = 'not_found';
  error.api_status = 404;
  // noinspection JSUndefinedPropertyAssignment
  error.locale_tag = 'NOT_FOUND';
  return error;
};

/**
 * @param {[{param: String, msg: String}]} errors
 */
exports.ValidationError = (errors) => {
  const error = new Error();
  // noinspection JSUndefinedPropertyAssignment
  error.errors = errors;
  error.api_code = 'invalid_request';
  error.api_status = 400;
  // noinspection JSUndefinedPropertyAssignment
  error.locale_tag = 'VALIDATION_ERROR';
  return error;
};

exports.Unauthorized = (msg) => {
  const eMsg = msg || '';
  const error = new Error(eMsg);
  error.api_code = 'unauthorized';
  error.api_status = 401;
  // noinspection JSUndefinedPropertyAssignment
  error.locale_tag = 'UNAUTHORIZED';
  return error;
};

exports.Forbidden = (msg) => {
  const eMsg = msg || '';
  const error = new Error(eMsg);
  error.api_code = 'forbidden';
  error.api_status = 403;
  // noinspection JSUndefinedPropertyAssignment
  error.locale_tag = 'FORBIDDEN';
  return error;
};

exports.TemporarilyUnavailable = (msg) => {
  const eMsg = msg || '';
  const error = new Error(eMsg);
  error.api_code = 'temporarily_unavailable';
  error.api_status = 503;
  // noinspection JSUndefinedPropertyAssignment
  error.locale_tag = 'TEMPORARILY_UNAVAILABLE';
  return error;
};

exports.isHandled = err => err.api_code;
