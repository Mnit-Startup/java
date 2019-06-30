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
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Transaction', schema);
