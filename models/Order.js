const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      productId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      img: {
        type: String
      },
      size: {
        type: String
      },
      color: {
        type: String
      },
      discountType: {
        type: String,
        enum: ['PERCENT', 'FLAT', null],
        default: null
      },
      discountValue: {
        type: Number,
        default: 0
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  promoDiscount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    pinCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String }
  },
  billingAddress: {
    firstName: { type: String },
    lastName: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    pinCode: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
