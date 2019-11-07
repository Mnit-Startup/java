const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  contact: {
    phone: String,
    email: String,
  },
  address: {
    street_address: String,
    street_address_2: String,
    city: String,
    state: String,
    zipcode: String,
  },
  merchant_id_ein: String,
  store_profile: String,
  store_identifier: String,
  account_id: String,
  image: String,
  tax: String,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Store', schema);
