const amqplib = require('amqplib');
const config = require('config');
const _ = require('lodash');
const Promise = require('bluebird');

const DI = Promise.promisify(require('../di'));
const Modules = require('../modules');
const {Logger} = require('../helpers');
const {i18n, Sentry} = require('../core');

// config
const RABBIT_MQ_URL = config.get('rabbitMQ.url');

const Handlers = require('./handlers');

const sentry = Sentry();
const localization = i18n(true);

const moduleEntries = [
  {
    module: Modules.Db,
    namespace: 'db',
  },
  {
    module: Modules.Mail,
    namespace: 'mail',
  },
  {
    module: Modules.BlockchainWallet,
    namespace: 'blockchainWallet',
  },
];

function deserializeMessage(msg) {
  const {content, fields} = msg;
  Logger.info('worker - message received for deserialization - consumerTag - %s, routingTag - %s', fields.consumerTag, fields.routingKey);
  const {mediaType, params} = JSON.parse(content.toString());
  switch (mediaType) {
    case 'text/plain':
      return params;
    case 'application/json':
      return JSON.parse(params);
    default:
      throw new Error(`Worker encountered error while deserializing message - Unrecognized mediaType - ${mediaType}`);
  }
}

// set server
amqplib.connect(RABBIT_MQ_URL)
  .then(async (connection) => {
    Logger.info('server worker - connection to message broker was successful');
    Logger.info('attempting to create channel');
    // create a channel
    const channel = await connection.createChannel();
    Logger.info('server worker - channel was created successfully, attempting to initialise modules');
    const modules = await DI(moduleEntries);
    Logger.info('server modules were initialised successfully');
    return {
      channel,
      modules,
    };
  })
  .then(({channel, modules}) => Promise.all(_.map(Handlers, async (handler, name) => {
    Logger.info('server worker - attempting to register queue - %s', name);
    await channel.assertQueue(name, {durable: true});
    Logger.info('server worker - queue was registered, attempting to register handler for - %s', name);
    // register handler with each queue
    // add initialized modules and channel to context
    await channel.consume(name, _.bind(handler, null, {
      deserializeMessage,
      captureException: (err) => {
        if (sentry) {
          sentry.captureException(err);
        }
      },
      localization,
      channel,
      modules,
    }));
    Logger.info('server worker - handler for %s was registered successfully', name);
  })))
  .catch((err) => {
    throw err;
  });
