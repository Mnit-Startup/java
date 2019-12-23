// https://pm2.io/doc/en/runtime/reference/ecosystem-file/
// configurable options via env:
// PM2_MAX_INSTANCES - use maximum number of CPUs available
// PM2_AUTO_RESTART - auto restart on app crash

// configurable options via cmd (provide via --option=value)
// app - app to select

const _ = require('lodash');
const {argv} = require('yargs');

// load values from env
const MAX_INSTANCES = process.env.PM2_MAX_INSTANCES;
const AUTO_RESTART = process.env.PM2_AUTO_RESTART;
// load values from args
const APP = argv.name;

// apps
const APPS = [
  {
    name: 'HttpServer',
    script: 'npm',
    args: 'start',
  },
  {
    name: 'Worker',
    script: 'npm',
    args: 'run start-worker',
  },
];

// shared config - config shared across the apps
const SharedConfig = {
  // by default, only a single instance is run
  // https://pm2.io/doc/en/runtime/guide/load-balancing/
  instances: MAX_INSTANCES ? _.parseInt(MAX_INSTANCES) : null,
  autorestart: AUTO_RESTART === 'true',
  watch: false,
  // auto restart if heap size exceeds 1GB
  max_memory_restart: '1G',
  // rename the NODE_APP_INSTANCE as it will conflict with our config module
  instance_var: 'NODE_DEPLOY_INSTANCE',
};

module.exports = {
  apps: [
    _.merge(APPS.find(app => app.name === APP), SharedConfig),
  ],
};
