const Account = require('./account');
const Login = require('./login');
const Store = require('./store');
const Product = require('./product');
const Transaction = require('./transaction');
const LoadKadima = require('./loadKadima');
const TransferKadimaConsumerToMerchant = require('./transfer-kdm-consumer-to-merchant');
const Employee = require('./employee');
const EmployeeLogin = require('./employee-login');
const PayTransaction = require('./pay-transaction');
const EmailTransactionReceipt = require('./email-transaction-reciept');
const TopupConsumerWallet = require('./topup-consumer-wallet');

module.exports = {
  Account,
  Login,
  Store,
  Product,
  Transaction,
  LoadKadima,
  TransferKadimaConsumerToMerchant,
  Employee,
  EmployeeLogin,
  PayTransaction,
  EmailTransactionReceipt,
  TopupConsumerWallet,
};
