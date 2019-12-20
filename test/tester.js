/* eslint-disable func-names */
const {before, after} = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const async = require('async');
const sinon = require('sinon');

const config = require('./mock-config');
const mongod = require('./mongod');

const {Logger} = require('../src/helpers');
const modules = require('../src/modules');

// configure chai to use http
chai.use(chaiHttp);

// logging before laoding anyting
Logger.info(`tester - init config environment - ${process.env.NODE_CONFIG_ENV}`);

const ctx = {
  // injected config
  config,
};

before('tester - initialization', function (cb) {
  Logger.info('tester.init - attempting to start procedure...');
  // this might take some time
  this.timeout(0);
  // process
  async.series([
    (done) => {
      // stage: spin up local db
      Logger.info('tester.init - waiting for db to get ready...');
      // get connection string will ensure server is up and runnuing
      mongod((err, mongo) => {
        if (err) {
          done(err);
        } else {
          // db is up and running
          Logger.info('tester.init - db init completed...');
          // conclude stage
          done(null, mongo);
        }
      });
    },
    (done) => {
      // stage: spin up server
      Logger.info(' stage: spin up server');
      Logger.info('tester.init - waiting for server to get ready...');
      const workerStub = sinon.stub(modules.Worker);
      workerStub.init = (param, callback) => {
        callback(null, {});
      };
      // eslint-disable-next-line global-require
      const server = require('../src/bin/www');
      // add on listen handler
      server.on('listening', function () {
        Logger.info('tester.init - server init completed...');
        Object.assign(ctx, {
          mail: modules.Mail.getRef(),
          blockchainWallet: modules.BlockchainWallet.getRef(),
          storage: modules.Storage.getRef(),
        });
        Logger.info('tester - now ready for use...');
        done(null, this);
      });
    },
  ], (err, [mongo, server]) => {
    if (err) {
      cb(err);
    } else {
      ctx.database = mongo.db;
      ctx.mongo = {
        server: mongo.server,
        connection: mongo.connection,
      };
      // init requester which will create and start the server
      // leave it open, close it manually when finishing up
      ctx.requester = chai.request(server).keepOpen();
      Logger.info('tester - concluding init routine...');
      cb(null);
    }
  });
});

afterEach('tester - ctx restore', async () => {
  ctx.config.reset();
  // remove database
  await ctx.database.dropDatabase();
});

after('tester - clean up', async () => {
  Logger.info('tester - cleaning up...');
  Logger.info('tester - closing http connection...');
  if (ctx.requester) {
    // close chai's requester
    ctx.requester.close();
  }
  if (ctx.database && ctx.mongo) {
    Logger.info('tester - closing database connection');
    // un-refer all active sockets
    await ctx.database.unref();
    // close connection
    await ctx.mongo.connection.close();
    // stop the local mongo server instance
    await ctx.mongo.server.stop();
  }
});

exports.bootstrap = () => ctx;
