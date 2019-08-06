const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  account_id: String,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Consumer', schema);
