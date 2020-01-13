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
      token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkNDdiZTU4NTUxN2RiMDczYzEwMzBhNSIsInJvbGUiOiJtZXJjaGFudCIsImlhdCI6MTU3ODYzNzU2OSwiZXhwIjoxNTc5MjQ1OTY5fQ.7owzrSlEjS3vD2BJO2t06tyw_noasqFKTByNQBrfCVY',
    },
  ],
  consumers: [
    {
      _id: ObjectId('5d9b0f785084bc1c7ac48b2a'),
      blockchain: {
        wallet: {
          add: '0xb7060d9470b15e31850e99997c116a87288f1314',
          pub: 'd010ed2d006dab0a034ba86adfa9ad466e6f8b6167e7843c42a1c9347a46e751de198de8305c600730a87b5422e1dcde86810ba2fd58400501f65f6253930ba3',
          enc: 'bc974fdaab04284c3ba7bba442d49d07cf783068165c1db1668ff713305308ec4bade327257e345f80af11e5011edef6e3ef88bb405f4f2790a9749c76427b114a54f140abda0c407c4b6a4885aa410c',
        },
      },
      email: 'consumer@kadima.com',
      password: {
        hash: 'cb14869a261901f649c8b97024eb691abbd496f705e766249252b784db2c5dae55bdd5d87ad2f5c31a431ecec9096c8cf5d3c175912e4e5e121d1a7a944d9f1a',
        salt: 'eb4fd620-e8ea-11e9-aff3-6f6aff08013c',
      },
      role: 'consumer',
      created_at: Date('2019-10-07T10:12:08.064Z'),
      updated_at: Date('2019-10-07T10:12:08.064Z'),
      token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkOWIwZjc4NTA4NGJjMWM3YWM0OGIyYSIsInJvbGUiOiJjb25zdW1lciIsImlhdCI6MTU3ODYzNzUzOSwiZXhwIjoxNTc5MjQ1OTM5fQ.W3BlclxUuDLrLLRi7tjLNKw65jp1GgeJkCVhNg58vh8',
    },
  ],
  stores: [
    {
      _id: ObjectId('5dc2c27c6349d55037421401'),
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
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkYzU2NzlkMDA4NGZmODgyYzE3NTZmNCIsInJvbGUiOiJjYXNoaWVyIiwiaWF0IjoxNTc4NjM3NDU1LCJleHAiOjE1NzkyNDU4NTV9.iUPuu5fk__tIgkaUhSgBO01bO1cX25OoA7oj7w_IJUg',
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
  transactions: [
    // 3 transactions covering all 3 payemnt statuses:
    // pendig, processing, paid
    // pending_payment transaction
    {
      _id: ObjectId('5dd77aaafeb715e3a56921de'),
      amount: 21,
      store: ObjectId('5dc2c27c6349d55037421401'),
      payment_status: 'pending_payment',
      cart: {
        products: [
          {
            id: '5dc55bca49901981f2097193',
            name: 'test product',
            price: 10,
            taxable: true,
            tax: 10,
            quantity: 1,
          },
          {
            id: '5dc55bf249901981f2097194',
            name: 'Phone Cover',
            price: 10,
            taxable: false,
            tax: 10,
            quantity: 1,
          },
        ],
      },
      created_at: '2019-11-22T06:05:30.908Z',
      updated_at: '2019-11-22T06:05:30.908Z',
    },
    // payment under process transaction
    {
      _id: ObjectId('5dd77c2efeb715e3a56921e0'),
      amount: 32,
      store: ObjectId('5dc2c27c6349d55037421401'),
      payment_status: 'processing',
      cart: {
        products: [
          {
            id: '5dc55bca49901981f2097193',
            name: 'test product',
            price: 10,
            taxable: true,
            tax: 10,
            quantity: 2,
          },
          {
            id: '5dc55bf249901981f2097194',
            name: 'Phone Cover',
            price: 10,
            taxable: false,
            tax: 10,
            quantity: 1,
          },
        ],
      },
      created_at: '2019-11-22T06:11:58.435Z',
      updated_at: '2019-11-22T06:11:58.435Z',
    },
    {
      _id: ObjectId('5e0da773e9c6c218928eee80'),
      store: ObjectId('5dc2c27c6349d55037421401'),
      amount: 21,
      payment_status: 'processing',
      cart: {
        products: [
          {
            id: ObjectId('5dc55bca49901981f2097193'),
            name: 'test product',
            price: 10,
            taxable: true,
            tax: 10,
            quantity: 1,
          },
          {
            id: ObjectId('5dc55bf249901981f2097194'),
            name: 'Phone Cover',
            price: 10,
            taxable: false,
            tax: 10,
            quantity: 1,
          },
        ],
      },
      created_at: Date('2020-01-02T08:18:59.393Z'),
      updated_at: Date('2020-01-02T08:34:42.439Z'),
      payee: ObjectId('5d9b0f785084bc1c7ac48b2a'),
      payment_mode: 'kadima',
    },
    {
      _id: ObjectId('5e0d9bbee658dc752a95756f'),
      store: ObjectId('5dc2c27c6349d55037421401'),
      amount: 21,
      payment_status: 'processing',
      cart: {
        products: [
          {
            id: ObjectId('5dc55bca49901981f2097193'),
            name: 'test product',
            price: 10,
            taxable: true,
            tax: 10,
            quantity: 1,
          },
          {
            id: ObjectId('5dc55bf249901981f2097194'),
            name: 'Phone Cover',
            price: 10,
            taxable: false,
            tax: 10,
            quantity: 1,
          },
        ],
      },
      created_at: Date('2020-01-02T07:29:02.761Z'),
      updated_at: Date('2020-01-02T08:00:06.403Z'),
      payee: ObjectId('5d9b0f785084bc1c7ac48b2a'),
      payment_mode: 'kadima',
    },
    // paid payment status transaction
    {
      _id: ObjectId('5dd77b37feb715e3a56921df'),
      amount: 42,
      store: ObjectId('5dc2c27c6349d55037421401'),
      payment_status: 'paid',
      cart: {
        products: [
          {
            id: '5dc55bca49901981f2097193',
            name: 'test product',
            price: 10,
            taxable: true,
            tax: 10,
            quantity: 2,
          },
          {
            id: '5dc55bf249901981f2097194',
            name: 'Phone Cover',
            price: 10,
            taxable: false,
            tax: 10,
            quantity: 2,
          },
        ],
      },
      receipt: ObjectId('5ddbce88705d1f4808582866'),
      created_at: '2019-11-22T06:07:51.945Z',
      updated_at: '2019-11-22T06:07:51.945Z',
    },
  ],
  receipts: [
    {
      _id: ObjectId('5ddbce88705d1f4808582866'),
      store: {
        id: ObjectId('5dc2c27c6349d55037421401'),
        name: 'Amazon',
        address: 'test address',
        city: 'test city',
        state: 'test state',
        zipcode: '1111',
        logo: 'https://s3.amazonaws.com/blockade.merchant.assets/photo-473cb8f0-0b81-11ea-83f8-0792c1923834.jpg',
      },
      cart: {
        products: [
          {
            id: ObjectId('5dc55bca49901981f2097193'),
            name: 'test product',
            price: 10,
            taxable: true,
            tax: 10,
            quantity: 2,
          },
          {
            id: ObjectId('5dc55bf249901981f2097194'),
            name: 'Phone Cover',
            price: 10,
            taxable: false,
            tax: 10,
            quantity: 2,
          },
        ],
      },
      total: 42,
      sub_total: 40,
      tax: 2,
      transaction: ObjectId('5dd77b37feb715e3a56921df'),
      payment_mode: 'cash',
      created_at: Date('2019-11-25T12:52:24.840Z'),
      updated_at: Date('2019-11-25T12:52:24.840Z'),
    },
  ],
};
