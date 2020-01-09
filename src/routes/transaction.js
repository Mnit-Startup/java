const express = require('express');

const transactionController = require('../controllers/transaction');

const {AccessControl} = require('../interceptors');

const router = express.Router({});

router.post('/load-kadima', transactionController.topupConsumerWallet);

router.get('/hello', transactionController.hello);

// endpoint to send email for a paid cash transaction
router.post('/:transactionId/receipt/:receiptId/email', transactionController.emailReceipt);

router.use(AccessControl());

router.get('/:transactionId', transactionController.getTransactionDetail);

router.patch('/:transactionId/pay', transactionController.payTransaction);

module.exports = router;
