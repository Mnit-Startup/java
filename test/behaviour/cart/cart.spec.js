/* eslint-disable no-unused-expressions */
const {ObjectId} = require('mongodb').ObjectId;

const {expect} = require('chai');
const {beforeEach, describe} = require('mocha');


const applicationData = require('../../data/application-data');
const {
  cart, cartMissingProduct, cartMissingQuantity, cartInactiveProduct,
} = require('./cart-data');
const tester = require('../../tester');

const {token} = applicationData.employees.cashiers[0];

describe('system should be able to calculate total cart value based on tax information of individual product', () => {
  const ctx = tester.bootstrap();

  beforeEach('', async () => {
    await ctx.database.collection('accounts').insertOne(applicationData.merchants[0]);
    await ctx.database.collection('stores').insertOne(applicationData.stores[0]);
    await ctx.database.collection('products').insertMany(applicationData.products);
    await ctx.database.collection('employees').insertOne(applicationData.employees.cashiers[0]);
    await ctx.database.collection('employee_details').insertOne(applicationData.employeeDetails[0]);
  });

  describe('when correct cart_items data is passed', () => {
    it('should conclude with error, if product id is missing in a cart items entry', async () => {
      const merchantId = applicationData.merchants[0]._id;
      const storeId = applicationData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/transaction`)
        .set('authorization', token)
        .send(cartMissingProduct);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'cart_items[0].product')).to.exist;
    });

    it('should conclude with error, if quantity is missing in a cart items entry', async () => {
      const merchantId = applicationData.merchants[0]._id;
      const storeId = applicationData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/transaction`)
        .set('authorization', token)
        .send(cartMissingQuantity);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'cart_items[0].quantity')).to.exist;
    });

    it('should conclude with error, if product in cart item is inactive', async () => {
      const merchantId = applicationData.merchants[0]._id;
      const storeId = applicationData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/transaction`)
        .set('authorization', token)
        .send(cartInactiveProduct);
      expect(res.statusCode).equal(400);
    });

    it('should conclude with created transaction with correct amount if valid is cart', async () => {
      // pre condition
      const productA = await ctx.database.collection('products').findOne({_id: ObjectId(cart.cart_items[0].product)});
      expect(productA.price).to.be.eql(10);
      expect(productA.taxable).to.be.eql(true);
      expect(productA.tax).to.be.eql(10);

      expect(cart.cart_items[0].quantity).to.be.eql(2);

      // pre condition
      const productB = await ctx.database.collection('products').findOne({_id: ObjectId(cart.cart_items[1].product)});
      expect(productB.price).to.be.eql(10);
      expect(productB.taxable).to.be.eql(false);
      expect(productB.tax).to.be.eql(10);

      expect(cart.cart_items[1].quantity).to.be.eql(1);

      // test execution
      const merchantId = applicationData.merchants[0]._id;
      const storeId = applicationData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/transaction`)
        .set('authorization', token)
        .send(cart);

      // post condition
      expect(res.statusCode).equal(200);
      expect(res.body).to.have.all.keys(['id', 'amount', 'store', 'payment_status',
        'cart', 'created_at', 'updated_at']);
      expect(res.body.id).to.be.a('string');
      expect(res.body.amount).to.be.a('number');
      expect(res.body.store).to.be.a('string');
      // check status when a transaction is created
      expect(res.body.payment_status).to.be.eql('pending_payment');

      // check final amount
      expect(res.body.amount).to.be.eql(32);

      // check cart details for product A
      expect(res.body.cart.products[0].name).to.be.eql(productA.name);
      expect(res.body.cart.products[0].price).to.be.eql(productA.price);
      expect(res.body.cart.products[0].tax).to.be.eql(productA.tax);

      // check cart details for product B
      expect(res.body.cart.products[1].name).to.be.eql(productB.name);
      expect(res.body.cart.products[1].price).to.be.eql(productB.price);
      expect(res.body.cart.products[1].tax).to.be.eql(productB.tax);

      expect(res.body.created_at).to.be.a('string');
      expect(res.body.updated_at).to.be.a('string');
    });
  });
});
