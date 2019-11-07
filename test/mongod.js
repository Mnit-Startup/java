const config = require('config');
const {MongoMemoryServer} = require('mongodb-memory-server');
const {MongoClient} = require('mongodb');
const _ = require('lodash');
const Promise = require('bluebird');

// get mongoDb config
const MONGODB_URI = config.get('mongoDb.uri');
const MONGODB_SYS_BIN = config.has('mongoDb.systemBinary') && config.get('mongoDb.systemBinary');

// process URI
const [
  ip,
  port,
  dbName,
] = MONGODB_URI.replace(/^mongodb:\/\/(.*):(.*)\/(.*)$/g, '$1~$2~$3').split('~');

/**
 * @async - initializes local mongod instance
 */
module.exports = (done) => {
  new Promise(async (resolve, reject) => {
    try {
      const mongoServer = new MongoMemoryServer({
        instance: {
          port: _.parseInt(port),
          ip,
          dbName,
        },
        binary: {
          systemBinary: MONGODB_SYS_BIN,
        },
      });
      const connectionURI = await mongoServer.getConnectionString();
      const connection = await MongoClient.connect(connectionURI, {
        useNewUrlParser: true,
      });
      const db = connection.db(await mongoServer.getDbName());
      resolve({
        db,
        connection,
        server: mongoServer,
      });
    } catch (e) {
      reject(e);
    }
  }).asCallback(done);
};
