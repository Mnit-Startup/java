const lib = require('./lib');

exports.init = (done) => {
  done(null, lib);
};

exports.getRef = () => lib;
