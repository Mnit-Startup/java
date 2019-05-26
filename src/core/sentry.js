const Sentry = require('@sentry/node');
const config = require('config');

const {Logger} = require('../helpers');

// get values from config
const SENTRY_DSN = config.has('sentry.dsn') ? config.get('sentry.dsn') : null;
const SENTRY_ENVIRONMENT = config.has('sentry.dsn') ? config.get('sentry.env') : null;

// init module
if (!SENTRY_DSN) {
  Logger.info('sentry - skipping init as not configured');
} else {
  Logger.info('sentry - attempting to initialize for provided env - %s', SENTRY_ENVIRONMENT);
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
  });
}

/**
 * @function - initializes interceptors for error reporting
 * @returns  {null | {interceptBegin: Function, interceptEnd: Function, captureException: Function}}
 */

module.exports = () => (SENTRY_DSN ? {
  interceptBegin: Sentry.Handlers.requestHandler,
  interceptEnd: Sentry.Handlers.errorHandler,
  captureException: Sentry.captureException,
} : null);
