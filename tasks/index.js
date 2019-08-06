/* eslint-disable global-require */
// register tasks with the loader along with its name
module.exports = {
  sync_locales: {
    handler: require('./sync-locales'),
    config: '.syncrc',
  },
};
