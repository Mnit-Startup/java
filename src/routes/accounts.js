const express = require('express');

const controller = require('../controllers/accounts');

const router = express.Router({});

router.post('/register/:role', controller.register);

module.exports = router;
