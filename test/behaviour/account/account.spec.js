/* eslint-disable no-unused-expressions */
const _ = require('lodash');
const sinon = require('sinon');
const {expect} = require('chai');
const {beforeEach, describe, before} = require('mocha');


const applicationData = require('../../data/application-data');

const tester = require('../../tester');
const {PaymentStatus} = require('../../../src/models');

const {token} = applicationData.consumers[0];

describe('system should calculate available balance', () => {
  const ctx = tester.bootstrap();
  const sandbox = sinon.createSandbox();
  let getKadimaBalance;

  before(() => {
    // stub
    getKadimaBalance = sandbox.stub(ctx.blockchainWallet, 'getKadimaBalance').callsFake(() => {
      const kadimaBalance = {balance: 100, symbol: 'KDM'}; return kadimaBalance;
    });
  });

  beforeEach('', async () => {
    await ctx.database.collection('accounts').insertOne(applicationData.consumers[0]);
    await ctx.database.collection('stores').insertOne(applicationData.stores[0]);
    await ctx.database.collection('products').insertMany(applicationData.products);
    await ctx.database.collection('employees').insertOne(applicationData.employees.cashiers[0]);
    await ctx.database.collection('employee_details').insertOne(applicationData.employeeDetails[0]);
    await ctx.database.collection('transactions').insertMany(applicationData.transactions);
  });

  afterEach('', () => {
    sandbox.resetHistory();
    sandbox.resetHistory();
  });

  describe('if some transactions of user are under process', () => {
    it(`it should calculate available balance should current balance minus amount of
    transactions under process `, async () => {
      const consumerId = applicationData.consumers[0]._id;
      const {add} = applicationData.consumers[0].blockchain.wallet;

      const transactionsInProcess = await ctx.database.collection('transactions').find({payee: consumerId, payment_status: PaymentStatus.PROCESSING}).toArray();
      expect(transactionsInProcess).to.be.instanceOf(Array);
      expect(transactionsInProcess).to.have.length(2);
      let transactionAmountSum = 0;
      _.forEach(transactionsInProcess, (transaction) => {
        transactionAmountSum += transaction.amount;
      });
      expect(transactionAmountSum).to.eql(42);
      const res = await ctx.requester
        .get(`/account/${consumerId}/wallet/${add}/balance`)
        .set('authorization', token);
      expect(res.statusCode).equal(200);
      sandbox.assert.calledOnce(getKadimaBalance);
      expect(res.body[0].balance).to.be.eql(58);
    });
  });
});
