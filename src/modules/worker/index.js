const async = require('async');
const amqplib = require('amqplib');
const config = require('config');
const _ = require('lodash');

const {Logger} = require('../../helpers');
const Task = require('./task');

const RABBIT_MQ_URL = config.get('rabbitMQ.url');

/**
 * @function
 * @param [string] - process type for which queue needs to be initialized
 */
exports.init = async.asyncify(processTypes => amqplib.connect(RABBIT_MQ_URL)
  .then(async (connection) => {
    Logger.info('worker - connection to message broker was successful');
    Logger.info('worker - attempting to create channel');
    // creating channel
    const channel = await connection.createChannel();
    Logger.info('worker - channel was created successfully');
    return channel;
  })
  .then(channel => Promise
    .all(_.map(processTypes, async (processType) => {
      Logger.info('worker - attempting to register queue for process type %s', processType);
      // register queue
      await channel.assertQueue(processType, {durable: true});
      Logger.info('worker - queue for process type - %s was registered successfully', processType);
    }))
    .then(() => ({
      // di
      submitTask: (task) => {
        channel.sendToQueue(task.processType, task.content, {persistent: true});
      },
    }))));

exports.Task = Task;
