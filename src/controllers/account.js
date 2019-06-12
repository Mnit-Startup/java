/* eslint-disable camelcase */
const Promise = require('bluebird');
const {UserAccessControl} = require('../interceptors');
const {Error} = require('../helpers');

exports.get = [
  UserAccessControl,
  (req, res, next) => {
    const acc = req.user_acc;
    new Promise(async (resolve) => {
      resolve({
        id: acc.id,
        email: acc.email,
        role: acc.role,
        blockchain: {
          wallet: {
            add: acc.blockchain.wallet.add,
            pub: acc.blockchain.wallet.pub,
          },
        },
      });
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
      }
    });
  },
];

exports.getBalance = [
  UserAccessControl,
  (req, res, next) => {
    const acc = req.user_acc;
    new Promise(async (resolve, reject) => {
      const {address} = req.params;
      if (address !== acc.blockchain.wallet.add) {
        reject(Error.Unauthorized(res.__('DEFAULT_ERRORS.INVALID_AUTH')));
        return;
      }
      try {
        const balance = await res.locals.blockchainWallet.getBalance(acc.blockchain.wallet.add);
        resolve([{
          symbol: 'KDM',
          updated_at: new Date(),
          description: 'Kadmia Coin',
          balance: (balance / 1000000000000000000),
        }]);
      } catch (e) {
        reject(e);
      }
    }).asCallback((err, response) => {
      if (err) {
        next(err);
      } else {
        res.json(response);
      }
    });
  },
];
