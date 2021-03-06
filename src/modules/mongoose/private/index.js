const mongoose = require('mongoose');
const config = require('config');

// register plugins
const plugins = require('./plugins');

mongoose.plugin(plugins.basicTransformation);

const {Logger} = require('../../../helpers');
const models = require('./models');

// load values from config
const MONGO_DB_URI = config.get('mongoDb.uri');
const MONGO_DB_DEBUG = config.get('mongoDb.debug') === true;
const MONGO_DB_RECONNECT_TRIES = config.get('mongoDb.reconnectTries');

exports.init = (done) => {
  // skip installation if not configured
  if (!MONGO_DB_URI) return;

  // add event listeners
  mongoose.connection.on('connected', () => {
    Logger.info('core.mongoose - connection - connected');
  });

  mongoose.connection.on('disconnected', () => {
    Logger.info('core.mongoose - connection - disconnected');
  });

  mongoose.connection.on('reconnect', () => {
    Logger.info('core.mongoose - connection - reconnect');
  });

  mongoose.connection.on('error', (err) => {
    // on any connection error, the app should crash
    throw err;
  });

  // set global props
  // enable debugging via logger if configured
  mongoose.set('debug', MONGO_DB_DEBUG ? (...args) => {
    Logger.info('core.mongoose - request - ', args);
  } : null);

  // disable bufferCommands
  // if not connected returns errors immediately rather than waiting for reconnect
  mongoose.set('bufferCommands', false);

  mongoose.connect(config.get('mongoDb.uri'), {
    autoIndex: true,
    // reconnect if connection is lost
    autoReconnect: true,
    // make no of re-tries small finite value, so error can float up
    // before main process time out
    reconnectTries: MONGO_DB_RECONNECT_TRIES,
    // reconnect interval in ms
    reconnectInterval: 500,
    // if not connected, return error immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    useNewUrlParser: true,
    promiseLibrary: global.Promise,
  }, (err) => {
    if (err) {
      // initial connection error, report it right away
      done(err);
    } else {
      // initial connection was succrssful, conclude
      done(null, models);
    }
  });
};
