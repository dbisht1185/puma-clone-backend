const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a PIN code'],
    unique: true,
    minlength: 6,
    maxlength: 6,
    trim: true
  },
  deliveryDays: {
    type: Number,
    required: [true, 'Please specify delivery days'],
    default: 3
  },
  isServiceable: {
    type: Boolean,
    default: true
  },
  charges: {
    type: Number,
    default: 0
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pincode', pincodeSchema);
