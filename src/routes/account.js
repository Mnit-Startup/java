const express = require('express');

const accountController = require('../controllers/account');

const storeController = require('../controllers/store');

const transactionController = require('../controllers/transaction');

const {AccessControl} = require('../interceptors');

const router = express.Router({});

router.post('/load-kadima-balance', accountController.loadKadimaInConsumerWallet);

router.post('/transfer-kadima-conusmer-to-merchant', accountController.transferKadimaConsumerToMerchant);

router.use(AccessControl());

router.get('/:id', accountController.get);

router.get('/:id/stores', storeController.get);

router.get('/:id/wallet/:address/balance', accountController.getBalance);

router.post('/:id/store', storeController.create);

router.post('/:id/store/:storeId/transaction', transactionController.createStoreTransaction);

router.get('/:id/store/:storeId/transactions', transactionController.getStoreTransactions);

router.get('/:id/transactions', transactionController.getConsumerTransactions);

module.exports = router;
