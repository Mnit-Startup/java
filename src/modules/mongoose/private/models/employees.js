const _ = require('lodash');
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

// eslint-disable-next-line func-names
schema.methods.getEmployeeDetail = async function (ctx) {
  return new Promise(async (resolve, reject) => {
    try {
      const {role, _id} = this;
      const details = await ctx.employeeDetails.find({
        employee: _id,
        role,
        active: true,
      });
      const assignedStores = [];
      _.map(details, (detail) => {
        assignedStores.push(detail.store);
      });
      resolve(assignedStores);
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = mongoose.model('Employee', schema);
