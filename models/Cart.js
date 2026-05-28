const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: null,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['PERCENT', 'FLAT', null],
    default: null,
  },
  discountValue: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  stock: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    default: "",
  },
  styleNumber: {
    type: String,
    default: "",
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', CartSchema);
