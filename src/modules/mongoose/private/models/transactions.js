const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  amount: Number,
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  payment_status: String,
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  paid_on: Date,
  payment_info: mongoose.Schema.Types.Mixed,
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
  payment_mode: String,
  receipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receipt',
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// schema function to calculate subtotal for a transaction
// eslint-disable-next-line func-names
schema.methods.getSubtotal = function () {
  const {cart, amount} = this;
  if (cart.products.length > 0) {
    let subTotal = 0;
    _.forEach(cart.products, (product) => {
      subTotal += product.price * product.quantity;
    });
    return _.round(subTotal, 2);
  }
  return amount;
};

module.exports = mongoose.model('Transaction', schema);
