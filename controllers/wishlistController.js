const Wishlist = require('../models/Wishlist');

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      // Create an empty wishlist on first request
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: []
      });
    }

    res.status(200).json({
      status: 'SUCCESS',
      data: wishlist.items
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to load wishlist details'
    });
  }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res) => {
  const { productId, name, image, basePrice, discountType, discountValue, slug } = req.body;

  if (!productId || !name || !image || basePrice === undefined) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Missing required product information'
    });
  }

  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        items: []
      });
    }

    // Check if item is already in wishlist
    const exists = wishlist.items.some(item => item.productId === productId);
    if (exists) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Product is already in wishlist'
      });
    }

    const newItem = {
      productId,
      name,
      image,
      basePrice,
      discountType: discountType || null,
      discountValue: discountValue || 0,
      slug: slug || productId
    };

    wishlist.items.push(newItem);
    wishlist.updatedAt = Date.now();
    await wishlist.save();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Product added to wishlist successfully',
      data: wishlist.items
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to add product to wishlist'
    });
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Wishlist not found'
      });
    }

    // Filter out item
    const originalLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(item => item.productId !== productId);

    if (wishlist.items.length === originalLength) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Product not found in wishlist'
      });
    }

    wishlist.updatedAt = Date.now();
    await wishlist.save();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Product removed from wishlist successfully',
      data: wishlist.items
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to remove product from wishlist'
    });
  }
};
