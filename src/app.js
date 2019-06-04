const express = require('express');
const cookieParser = require('cookie-parser');
const expressWinston = require('express-winston');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('config');
const _ = require('lodash');

// our in-house dependency injection framework
const DI = require('./di');
const Modules = require('./modules');
const {Sentry, Cors, i18n} = require('./core');
const routes = require('./routes');
const {Logger, Error} = require('./helpers');

// from modules
const {DbUtils} = Modules.Db;

// define entries for DI
// register module with respective namespace
const moduleEntries = [
  {
    module: Modules.Db,
    namespace: 'db',
  },
  {
    module: Modules.Accounts,
    namespace: 'accounts',
  },
];

// init app
const app = express();

// init sentry
// note - sentry instance will be undefined if not configured
const sentry = Sentry();

// init localization
const localization = i18n();

// trust the immediate proxy
// as our app sits behind a proxy when deployed, we need to trust the X-Forwarded-* header
// https://expressjs.com/en/guide/behind-proxies.html
app.enable('trust proxy');

// init dependency injection
// module then can be accessible via req.locals.namespace within the controller
app.use(DI(moduleEntries, (err) => {
  if (err) {
    throw err;
  }
  // fire app.ready
  // do it in next iteration to avoid server from not picking up the event
  process.nextTick(() => app.emit('ready'));
}));

// set up cors
app.use(cors());

// if configured, interception start for sentry
if (sentry) {
  app.use(sentry.interceptBegin());
}

// set up winston logger as middleware
app.use(expressWinston.logger({
  winstonInstance: Logger,
  // no pre-build meta
  meta: false,
  msg: 'API HTTP REQUEST - {{req.ip}} - {{res.statusCode}} - {{req.method}} - {{res.responseTime}}ms - {{req.url}} - {{req.headers[\'user-agent\']}}',
  // use the default express/morgan request formatting
  // enabling this will override any msg if true
  expressFormat: false,
  // force colorize when using custom msg
  colorize: true,
  // set log level according to response status
  statusLevels: true,
}));

// set up cookie parser
app.use(cookieParser());

// set up i18n
app.use(localization);

// parse application/json payload
app.use(bodyParser.json());

// app headers
app.use(Cors.addHeaders);

// add request specific config
app.use((req, res, next) => {
  // build config
  // note - use the same namespace as defined in the config files
  const c = {
    root: `${req.protocol}://${req.hostname}`,
  };
  // overwrite via configured values
  // configured values should take precedence over built ones
  _.assign(c, config.get('app'));
  // inject
  res.locals.config = c;
  // conclude
  next();
});

// set up routes
app.use('/', routes.ping);
app.use('/accounts', routes.accounts);

// not found handler
app.use((req, res, next) => {
  next(Error.NotFound());
});

// error handler - determines type
app.use((err, req, res, next) => {
  // determine type and check if hosting needs to be updated
  if (err.type === 'entity.parse.failed') {
    // error returned by body parser
    // conclude
    next(Error.InvalidRequest(res.__('REQ_ERRORS.MALFORMED_INPUT')));
  } else if (DbUtils.checkConnectionErr(err)) {
    // mongoose connection error
    // conclude
    next(Error.TemporarilyUnavailable());
  } else {
    // type could not be determined
    next(err);
  }
});

// errror handler based on type determined
app.use((err, req, res, next) => {
  if (res.headersSent) {
    // log
    Logger.error('App - Received error post response end - %s', err.message);
    // continue to next handler
    next(err);
  } else if (Error.isHandled(err)) {
    // handled error
    res.status(err.api_status);
    const obj = {
      error: err.message || res.__(`DEFAULT_ERRORS.${err.locale_tag}`),
      error_code: err.api_code,
    };
    if (err.errors) obj.errors = err.errors;
    // conclude
    res.send(obj);
  } else {
    // un-handled error
    res.status(500);
    const ret = {
      error_code: 'server-error',
    };
    if (err.trackId) {
      ret.error_track_id = err.trackId;
      ret.error = res.__('DEFAULT_ERRORS.SERVER_ERROR_W_TRK', err.trackId);
    } else {
      ret.error = res.__('DEFAULT_ERRORS.SERVER_ERROR');
    }
    // conclude request
    res.send(ret);
    // continue to next error handler
    next(err);
  }
});

// if configured, interception end for sentry
if (sentry) {
  app.use(sentry.interceptEnd());
}

// error logging via winston
app.use(expressWinston.errorLogger({
  winstonInstance: Logger,
}));

module.exports = app;
