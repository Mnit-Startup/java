const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  account_id: String,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Store', schema);
