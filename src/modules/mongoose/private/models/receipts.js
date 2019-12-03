const mongoose = require('mongoose');

// receipt for a paid transaction
const schema = new mongoose.Schema({
  store: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    name: String,
    address: String,
    city: String,
    state: String,
    zipcode: String,
    logo: String,
  },
  cart: {
    products: [{
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      name: String,
      price: Number,
      taxable: Boolean,
      tax: Number,
      quantity: Number,
      _id: false,
    }],
  },
  total: Number,
  sub_total: Number,
  tax: Number,
  payment_mode: String,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Receipt', schema);
