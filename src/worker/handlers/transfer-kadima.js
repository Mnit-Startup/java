const {Logger} = require('../../helpers');
/* eslint-disable no-unused-vars */
module.exports = async (ctx, msg) => {
  const {localization, channel, modules} = ctx;
  const params = ctx.deserializeMessage(msg);
  // acknowledge the message so that handler can receive the next one in queue
  Logger.info('worker.transfer_kadima - concluding routine for requestId - %s via ack', params);
  channel.ack(msg);
};
