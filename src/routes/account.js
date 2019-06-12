const express = require('express');

const controller = require('../controllers/account');

const {AccessControl} = require('../interceptors');

const router = express.Router({});

router.use(AccessControl());

router.get('/:id', controller.get);

router.get('/:id/wallet/:address/balance', controller.getBalance);

module.exports = router;
