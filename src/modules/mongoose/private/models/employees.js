const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  emp_number: String,
  pin: {
    hash: String,
    salt: String,
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
  },
  role: String,
  active: Boolean,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Employee', schema);
