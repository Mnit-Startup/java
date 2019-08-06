const express = require('express');

const transactionController = require('../controllers/transaction');

const {AccessControl} = require('../interceptors');

const router = express.Router({});

router.use(AccessControl());

router.get('/:transactionId', transactionController.getTransactionDetail);

router.patch('/:transactionId/pay', transactionController.payTransaction);

module.exports = router;
