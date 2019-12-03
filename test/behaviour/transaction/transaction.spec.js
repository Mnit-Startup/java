const {expect} = require('chai');
const sinon = require('sinon');
const {
  beforeEach, describe, before, after,
} = require('mocha');

const applicationData = require('../../data/application-data');

const {
  emailMissing, invalidEmail, validEmail, invalidPaymentMode, paymentModeCash,
} = require('./transaction-data');

const tester = require('../../tester');
const {PaymentMode, PaymentStatus} = require('../../../src/models');

describe('system should send email containing transaction details', () => {
  const ctx = tester.bootstrap();
  const sandbox = sinon.createSandbox();
  let mailerSendEmailHandler;

  before(() => {
    // fakes
    ctx.mail.sendEmail = () => {};
    // stubs
    mailerSendEmailHandler = sandbox.stub(ctx.mail, 'sendEmail');
  });

  beforeEach('', async () => {
    await ctx.database.collection('accounts').insertOne(applicationData.merchants[0]);
    await ctx.database.collection('accounts').insertOne(applicationData.consumers[0]);
    await ctx.database.collection('stores').insertOne(applicationData.stores[0]);
    await ctx.database.collection('products').insertMany(applicationData.products);
    await ctx.database.collection('employees').insertOne(applicationData.employees.cashiers[0]);
    await ctx.database.collection('employee_details').insertOne(applicationData.employeeDetails[0]);
    await ctx.database.collection('transactions').insertMany(applicationData.transactions);
    await ctx.database.collection('receipts').insertOne(applicationData.receipts[0]);
  });

  afterEach('', () => {
    sandbox.resetHistory();
    sandbox.resetBehavior();
  });

  after('', () => {
    delete ctx.mail.sendEmail;
  });

  describe('when mode of transaction is cash', () => {
    it('should conclude with error if email is missing', async () => {
      const transactionId = applicationData.transactions[0]._id;
      const receiptId = applicationData.receipts[0]._id;
      const res = await ctx.requester
        .post(`/transaction/${transactionId}/receipt/${receiptId}/email`)
        .send(emailMissing);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'email'));
    });

    it('should conclude with error if email is not valid', async () => {
      const transactionId = applicationData.transactions[0]._id;
      const receiptId = applicationData.receipts[0]._id;
      const res = await ctx.requester
        .post(`/transaction/${transactionId}/receipt/${receiptId}/email`)
        .send(invalidEmail);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'email'));
    });

    it('should send email when email is valid and transaction is paid', async () => {
      const paidTransaction = applicationData.transactions[2];
      expect(paidTransaction.payment_status === PaymentStatus.PAID);
      const receiptId = applicationData.receipts[0]._id;
      expect(paidTransaction.receipt === receiptId);
      mailerSendEmailHandler.resolves(1);
      const res = await ctx.requester
        .post(`/transaction/${paidTransaction._id}/receipt/${receiptId}/email`)
        .send(validEmail);
      expect(res.statusCode).equal(200);
      sandbox.assert.calledOnce(mailerSendEmailHandler);
    });
  });
});

describe('system should accept payment in cash for a transaction', () => {
  const ctx = tester.bootstrap();

  beforeEach('', async () => {
    await ctx.database.collection('accounts').insertOne(applicationData.merchants[0]);
    await ctx.database.collection('accounts').insertOne(applicationData.consumers[0]);
    await ctx.database.collection('stores').insertOne(applicationData.stores[0]);
    await ctx.database.collection('products').insertMany(applicationData.products);
    await ctx.database.collection('employees').insertOne(applicationData.employees.cashiers[0]);
    await ctx.database.collection('employee_details').insertOne(applicationData.employeeDetails[0]);
    await ctx.database.collection('transactions').insertMany(applicationData.transactions);
  });

  describe('when payment mode for a transaction is cash', () => {
    it('should conclude with error if payment mode is not kadima or cash', async () => {
      expect(invalidPaymentMode.mode_of_payment !== PaymentMode.CASH
        && invalidPaymentMode.mode_of_payment !== PaymentMode.KADIMA);
      const transactionId = applicationData.transactions[0]._id;
      const {token} = applicationData.consumers[0];
      const res = await ctx.requester
        .patch(`/transaction/${transactionId}/pay`)
        .set('authorization', token)
        .send(invalidPaymentMode);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'mode_of_payment'));
    });

    it('should mark transaction as paid if payment mode is cash', async () => {
      const transactionId = applicationData.transactions[0]._id;
      const {token} = applicationData.employees.cashiers[0];
      const res = await ctx.requester
        .patch(`/transaction/${transactionId}/pay`)
        .set('authorization', token)
        .send(paymentModeCash);
      expect(res.statusCode).equal(200);
      expect(res.body.payment_status).to.be.eql(PaymentStatus.PAID);
    });
  });
});
