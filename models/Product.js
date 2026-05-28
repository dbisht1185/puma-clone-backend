const mongoose = require('mongoose');

const SizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 5
  }
});

const ColorSchema = new mongoose.Schema({
  colorName: {
    type: String,
    required: true
  },
  colorCode: {
    type: String,
    required: true,
    default: '#000000'
  }
});

const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  price: {
    type: String,
    required: [true, 'Please add a display price (e.g. ₹8,999)']
  },
  offerPrice: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  img: {
    type: String,
    required: [true, 'Please add a main image path or URL']
  },
  images: {
    type: [String],
    default: []
  },
  basePrice: {
    type: Number,
    required: [true, 'Please add a base numeric price']
  },
  discountType: {
    type: String,
    enum: ['PERCENT', 'FLAT', null],
    default: null
  },
  discountValue: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'Please add overall stock count'],
    default: 10
  },
  sizes: {
    type: [SizeSchema],
    default: [
      { size: "UK 5", stock: 3 },
      { size: "UK 6", stock: 5 },
      { size: "UK 7", stock: 8 },
      { size: "UK 8", stock: 10 },
      { size: "UK 9", stock: 4 },
      { size: "UK 10", stock: 6 },
      { size: "UK 11", stock: 2 }
    ]
  },
  colors: {
    type: [ColorSchema],
    default: [{ colorName: "PUMA Black-Frosted Ivory", colorCode: "#000000" }]
  },
  styleNumber: {
    type: String,
    default: '399029_02'
  },
  gender: {
    type: String,
    required: [true, 'Please specify gender target'],
    enum: ['male', 'female', 'unisex', 'unisex-adults', 'boys', 'girls', 'kids', 'unisex-kids']
  },
  category: {
    type: String,
    default: 'footwear',
    enum: ['footwear', 'apparel', 'accessories']
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isCollaboration: {
    type: Boolean,
    default: false
  },
  collaborationName: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
