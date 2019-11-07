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
      token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkNDdiZTU4NTUxN2RiMDczYzEwMzBhNSIsInJvbGUiOiJtZXJjaGFudCIsImlhdCI6MTU3MzAxOTk3NCwiZXhwIjoxNTczNjI4Mzc0fQ.ASVUHbZkoGLpcf0MTm1w1eUVO8TJr2qH4dCRyB0Dk9U',
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
};
