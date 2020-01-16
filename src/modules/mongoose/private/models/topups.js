const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  acc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  payment_id: String,
  amount: Number,
  currency: String,
  topup_status: String,
  topup_info: mongoose.Schema.Types.ObjectId,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Topup', schema);
