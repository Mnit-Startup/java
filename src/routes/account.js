const express = require('express');

const accountController = require('../controllers/account');

const storeController = require('../controllers/store');

const transactionController = require('../controllers/transaction');

const imageController = require('../controllers/upload-image');

const merchantController = require('../controllers/merchant');

const {AccessControl} = require('../interceptors');

const router = express.Router({});

router.post('/load-kadima', accountController.topupConsumerWallet);

router.post('/load-kadima-balance', accountController.loadKadimaInConsumerWallet);

router.post('/transfer-kadima-conusmer-to-merchant', accountController.transferKadimaConsumerToMerchant);

router.use(AccessControl());

router.get('/:id', accountController.get);

router.get('/:id/stores', storeController.get);

router.get('/:id/store/:storeId', storeController.getStore);

router.get('/:id/wallet/:address/balance', accountController.getBalance);

router.post('/:id/store', storeController.create);

router.post('/:id/store/:storeId/transaction', transactionController.createStoreTransaction);

router.get('/:id/store/:storeId/transactions', transactionController.getStoreTransactions);

router.get('/:id/transactions', transactionController.getConsumerTransactions);

router.post('/upload-image', imageController.uploadImage);

router.post('/:id/store/:storeId/product', storeController.createProduct);

router.delete('/:id/store/:storeId/product/:productId', storeController.removeProduct);

router.put('/:id/store/:storeId/product/:productId', storeController.updateProduct);

router.get('/:id/store/:storeId/product/:productId', storeController.getProduct);

router.get('/:id/store/:storeId/products', storeController.getProducts);

router.post('/:id/employee', merchantController.createEmployee);

router.get('/:id/employees/:role', merchantController.getEmployees);

router.delete('/:id/employee/:empId', merchantController.removeEmployee);

router.put('/:id/employee/:empId', merchantController.updateEmployee);

router.post('/:id/store/:storeId/:role/:empId', storeController.assignStoreToEmployee);

router.delete('/:id/store/:storeId/:role/:empId', storeController.removeEmployeeFromStore);

module.exports = router;
