const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  store_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  price: Number,
  sku_number: String,
  taxable: Boolean,
  image: String,
  active: Boolean,
  tax: Number,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Product', schema);
