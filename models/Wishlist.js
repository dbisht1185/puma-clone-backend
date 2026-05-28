const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  basePrice: { type: Number, required: true },
  discountType: { type: String, enum: ['PERCENT', 'FLAT', null], default: null },
  discountValue: { type: Number, default: 0 },
  slug: { type: String, required: true }
});

const WishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [WishlistItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
