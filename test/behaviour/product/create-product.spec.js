/* eslint-disable no-unused-expressions */
const {expect} = require('chai');
const {beforeEach, describe} = require('mocha');


const dummyData = require('../../data/application-data');
const {
  productValidTax, productMissingTax, productInvalidTax, productZeroTax, productNegativeTax,
} = require('./product-data');
const tester = require('../../tester');

const {token} = dummyData.merchants[0];

describe('merchant should be able to exercise tax percentage control on each individual product', () => {
  const ctx = tester.bootstrap();

  beforeEach('create merchant and its store', async () => {
    await ctx.database.collection('accounts').insertOne(dummyData.merchants[0]);
    await ctx.database.collection('stores').insertOne(dummyData.stores[0]);
  });

  describe('When creating a product, a valid tax rate for a product should be specified', () => {
    it('When creating a product, should conclude with error, if tax field is missing', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const storeId = dummyData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/product`)
        .set('authorization', token)
        .send(productMissingTax);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'tax')).to.exist;
    });

    it('When creating a product, should conclude with error, if tax is not floating point data-type value', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const storeId = dummyData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/product`)
        .set('authorization', token)
        .send(productInvalidTax);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'tax')).to.exist;
    });

    it('When creating a product, should conclude with error, if tax is a negative float value while creating a store', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const storeId = dummyData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/product`)
        .set('authorization', token)
        .send(productNegativeTax);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'tax')).to.exist;
    });

    it('When creating a product, should conclude with created store if tax is Zero', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const storeId = dummyData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/product`)
        .set('authorization', token)
        .send(productZeroTax);
      expect(res.statusCode).equal(200);
      expect(res.body).to.have.all.keys(['id', 'name', 'price', 'sku_number',
        'taxable', 'active', 'tax', 'created_at', 'updated_at']);
      expect(res.body.id).to.be.a('string');
      expect(res.body.name).to.be.equal(productZeroTax.name);
      expect(res.body.price).to.be.equal(productZeroTax.price);
      expect(res.body.sku_number).to.be.equal(productZeroTax.sku_number);
      expect(res.body.taxable).to.be.equal(productZeroTax.taxable);
      expect(res.body.active).to.be.equal(productZeroTax.active);
      expect(res.body.tax).to.be.equal(productZeroTax.tax);
      expect(res.body.created_at).to.be.a('string');
      expect(res.body.updated_at).to.be.a('string');
    });

    it('When creating a product, should conclude with store, if tax is valid positive float type', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const storeId = dummyData.stores[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store/${storeId}/product`)
        .set('authorization', token)
        .send(productValidTax);
      expect(res.statusCode).equal(200);
      expect(res.body).to.have.all.keys(['id', 'name', 'price', 'sku_number',
        'taxable', 'active', 'tax', 'created_at', 'updated_at']);
      expect(res.body.id).to.be.a('string');
      expect(res.body.name).to.be.equal(productValidTax.name);
      expect(res.body.price).to.be.equal(productValidTax.price);
      expect(res.body.sku_number).to.be.equal(productValidTax.sku_number);
      expect(res.body.taxable).to.be.equal(productValidTax.taxable);
      expect(res.body.active).to.be.equal(productValidTax.active);
      expect(res.body.tax).to.be.equal(productValidTax.tax);
      expect(res.body.created_at).to.be.a('string');
      expect(res.body.updated_at).to.be.a('string');
    });
  });
});
