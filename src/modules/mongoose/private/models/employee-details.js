const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  role: String,
  active: Boolean,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('employee_detail', schema);
