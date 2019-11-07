/* eslint-disable no-unused-expressions */
const {expect} = require('chai');
const {beforeEach, describe} = require('mocha');


const dummyData = require('../../data/application-data');
const {
  storeValidTax, storeMissingTax, storeInvalidTax, storeZeroTax, storeNegativeTax,
} = require('./store-data');
const tester = require('../../tester');

const {token} = dummyData.merchants[0];

describe('merchant should be able to specify tax percentage when creating a store', () => {
  const ctx = tester.bootstrap();

  beforeEach('merchant account creation', async () => {
    await ctx.database.collection('accounts').insertOne(dummyData.merchants[0]);
  });

  describe('When creating a store, a valid tax rate for a store should be specified', () => {
    it('When creating a store, should conclude with error, if tax field is missing', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store`)
        .set('authorization', token)
        .send(storeMissingTax);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'tax')).to.exist;
    });

    it('When creating a store, should conclude with error, if tax is not floating point data-type value', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store`)
        .set('authorization', token)
        .send(storeInvalidTax);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'tax')).to.exist;
    });

    it('When creating a store, should conclude with error, if tax is a negative float value while creating a store', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store`)
        .set('authorization', token)
        .send(storeNegativeTax);
      expect(res.statusCode).equal(400);
      expect(res.body.errors).to.be.instanceOf(Array);
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors.find(err => err.param === 'tax')).to.exist;
    });

    it('When creating a store, should conclude with created store if tax is Zero', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store`)
        .set('authorization', token)
        .send(storeZeroTax);
      expect(res.statusCode).equal(200);
      expect(res.body).to.have.all.keys(['id', 'name', 'contact', 'address',
        'merchant_id_ein', 'store_identifier', 'tax', 'account_id', 'created_at', 'updated_at']);
      expect(res.body.id).to.be.a('string');
      expect(res.body.account_id).to.be.a('string');
      expect(res.body.tax).to.be.a('number');
      expect(res.body.name).to.be.equal(storeZeroTax.name);
      expect(res.body.contact.phone).to.be.equal(storeZeroTax.phone);
      expect(res.body.contact.email).to.be.equal(storeZeroTax.email);
      expect(res.body.address.street_address).to.be.equal(storeZeroTax.street_address);
      expect(res.body.address.city).to.be.equal(storeZeroTax.city);
      expect(res.body.address.state).to.be.equal(storeZeroTax.state);
      expect(res.body.address.zipcode).to.be.equal(storeZeroTax.zipcode);
      expect(res.body.merchant_id_ein).to.be.equal(storeZeroTax.merchant_id_ein);
      expect(res.body.tax).to.be.equal(storeZeroTax.tax);
      expect(res.body.store_identifier).to.be.equal(storeZeroTax.store_identifier);
      expect(res.body.store_identifier).to.be.equal(storeZeroTax.store_identifier);
      expect(res.body.created_at).to.be.a('string');
      expect(res.body.updated_at).to.be.a('string');
    });

    it('When creating a store,, should conclude with store, if tax is valid positive float type', async () => {
      const merchantId = dummyData.merchants[0]._id;
      const res = await ctx.requester
        .post(`/account/${merchantId}/store`)
        .set('authorization', token)
        .send(storeValidTax);
      expect(res.statusCode).equal(200);
      expect(res.body).to.have.all.keys(['id', 'name', 'contact', 'address',
        'merchant_id_ein', 'store_identifier', 'tax', 'account_id', 'created_at', 'updated_at']);
      expect(res.body.id).to.be.a('string');
      expect(res.body.account_id).to.be.a('string');
      expect(res.body.tax).to.be.a('number');
      expect(res.body.name).to.be.equal(storeValidTax.name);
      expect(res.body.contact.phone).to.be.equal(storeValidTax.phone);
      expect(res.body.contact.email).to.be.equal(storeValidTax.email);
      expect(res.body.address.street_address).to.be.equal(storeValidTax.street_address);
      expect(res.body.address.city).to.be.equal(storeValidTax.city);
      expect(res.body.address.state).to.be.equal(storeValidTax.state);
      expect(res.body.address.zipcode).to.be.equal(storeValidTax.zipcode);
      expect(res.body.merchant_id_ein).to.be.equal(storeValidTax.merchant_id_ein);
      expect(res.body.store_identifier).to.be.equal(storeValidTax.store_identifier);
      expect(res.body.store_identifier).to.be.equal(storeValidTax.store_identifier);
      expect(res.body.tax).to.be.equal(storeValidTax.tax);
      expect(res.body.created_at).to.be.a('string');
      expect(res.body.updated_at).to.be.a('string');
    });
  });
});
