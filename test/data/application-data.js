const {ObjectId} = require('mongodb').ObjectId;

module.exports = {
  merchants: [
    {
      _id: ObjectId('5d47be585517db073c1030a5'),
      blockchain: {
        wallet: {
          add: '0x1cb621073248e56859eb8d4409e87677891ac5d8',
          pub: 'ba2967b78e91c994923dc38bd80923e71a3189f76358cdfa31e2a1a4ac4bda76f89978c2dcae8df0fc5bdfceaed30a568d3bf8e2368d22fe8dd2be6f89921e31',
          enc: '966c34c8c14d4833a915ae71569a8e4f0811c6b7b4e83b55bc81c2a25add1bb08b60863d0a935390358053f783f55ef428295d604fcb07ebae12b2f0cdbb6d993843b8f1e93c9b5a1fb2ba92dd56245c',
        },
      },
      email: 'merchant@kadima.com',
      password: {
        hash: '013832225efe09b456e06c85593db877a64f10950cdca83f35485b9655eec55f8cbaf310bc6c16e075fd0f587f62c8bb6f839a13bc455bdd33fb8876fb387e18',
        salt: 'c5aedf40-b741-11e9-a045-d92ca277604d',
      },
      role: 'merchant',
      created_at: Date('2019-08-05T05:27:52.916Z'),
      updated_at: Date('2019-08-05T05:27:52.916Z'),
      token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkNDdiZTU4NTUxN2RiMDczYzEwMzBhNSIsInJvbGUiOiJtZXJjaGFudCIsImlhdCI6MTU3NDE1NzA4NywiZXhwIjoxNTc0NzY1NDg3fQ.vcPSzAGMR6lPzufF-O2rl0Lq4dzoSTh2Md6XFuZ-4ow',
    },
  ],
  stores: [
    {
      id: '5dc2c27c6349d55037421401',
      name: 'test_store',
      contact: {
        phone: '1111',
        email: 'test_store@email.com',
      },
      address: {
        street_address: 'test address',
        city: 'test city',
        state: 'test state',
        zipcode: '1111',
      },
      merchant_id_ein: 'test mid',
      store_identifier: 'test store-identifier',
      tax: '10',
      account_id: '5d47be585517db073c1030a5',
      created_at: '2019-11-06T12:54:20.059Z',
      updated_at: '2019-11-06T12:54:20.059Z',
    },
  ],
  employees: {
    cashiers: [
      {
        _id: ObjectId('5dc5679d0084ff882c1756f4'),
        name: 'test employee',
        emp_number: '1',
        pin: {
          hash: 'ec4bbb31e97189204a2ce01d31380ee8d6e2f9f27dc81fa3d08ac9bb2f870e1705ef4377b3ed8a28c0d55cae4778a57c87f8751d814bb3c4c0cca3e549d95e46',
          salt: '269b49c0-0228-11ea-8750-ab2c03b926e8',
        },
        role: 'cashier',
        merchant: ObjectId('5d47be585517db073c1030a5'),
        active: true,
        created_at: Date('2019-11-08T13:03:25.798Z'),
        updated_at: Date('2019-11-08T13:03:25.798Z'),
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkYzU2NzlkMDA4NGZmODgyYzE3NTZmNCIsInJvbGUiOiJjYXNoaWVyIiwiaWF0IjoxNTc0MTU4NDA1LCJleHAiOjE1NzQ3NjY4MDV9.DejFT7IEgUmS6mFaanCTJMVM9YNy_QhKPD0tTKxkWwk',
      },
    ],
  },
  employeeDetails: [
    {
      _id: ObjectId('5dc5681d0084ff882c1756f5'),
      store: ObjectId('5dc2c27c6349d55037421401'),
      employee: ObjectId('5dc5679d0084ff882c1756f4'),
      role: 'cashier',
      active: true,
      created_at: Date('2019-11-08T13:05:33.826Z'),
      updated_at: Date('2019-11-08T13:05:33.826Z'),
    },
  ],
  products: [
    {
      _id: ObjectId('5dc55bca49901981f2097193'),
      name: 'test product taxable',
      price: 10,
      sku_number: 'test sku number',
      taxable: true,
      active: true,
      tax: 10,
      created_at: '2019-11-08T12:12:58.575Z',
      updated_at: '2019-11-08T12:12:58.575Z',
    },
    {
      _id: ObjectId('5dc55bf249901981f2097194'),
      name: 'test product non-taxable',
      price: 10,
      sku_number: 'test sku number',
      taxable: false,
      active: true,
      tax: 10,
      created_at: '2019-11-08T12:13:38.409Z',
      updated_at: '2019-11-08T12:13:38.409Z',
    },
    {
      _id: ObjectId('5dc55d9e49901981f2097195'),
      name: 'test product inactive',
      price: 10,
      sku_number: 'test sku number',
      taxable: false,
      active: false,
      tax: 10,
      created_at: '2019-11-08T12:20:46.107Z',
      updated_at: '2019-11-08T12:20:46.107Z',
    },
  ],
};
