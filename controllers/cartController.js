const Cart = require('../models/Cart');

// Get cart for logged in user
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Cart retrieved successfully',
      data: cart
    });
  } catch (error) {
    console.error('Get Cart error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

// Add item to cart or increase quantity
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      productId, 
      name, 
      image, 
      size, 
      variant, 
      basePrice, 
      discountType, 
      discountValue, 
      quantity, 
      stock, 
      color, 
      styleNumber 
    } = req.body;

    if (!productId || !size || !basePrice) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Missing required item information (productId, size, basePrice)'
      });
    }

    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item exists in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId && item.size === size
    );

    if (itemIndex > -1) {
      // Item exists, update quantity
      cart.items[itemIndex].quantity += (quantity || 1);
      
      // Ensure we don't exceed stock
      if (cart.items[itemIndex].quantity > stock) {
        return res.status(400).json({
          status: 'ERROR',
          message: `Cannot exceed available stock of ${stock}`
        });
      }
    } else {
      // New item
      cart.items.push({
        productId,
        name,
        image,
        size,
        variant,
        basePrice,
        discountType,
        discountValue,
        quantity: quantity || 1,
        stock,
        color,
        styleNumber
      });
    }

    await cart.save();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to Cart error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Item ID and quantity are required'
      });
    }

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Item not found in cart'
      });
    }

    if (quantity < 1) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Ensure we don't exceed stock
      if (quantity > cart.items[itemIndex].stock) {
        return res.status(400).json({
          status: 'ERROR',
          message: `Cannot exceed available stock of ${cart.items[itemIndex].stock}`
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Cart updated successfully',
      data: cart
    });
  } catch (error) {
    console.error('Update Cart error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to update cart',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    
    await cart.save();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Remove from Cart error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to remove item',
      error: error.message
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ user: userId });
    
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Cart cleared successfully',
      data: cart || { items: [] }
    });
  } catch (error) {
    console.error('Clear Cart error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Merge guest cart with user cart on login
exports.mergeCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Guest cart items

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({
        status: 'SUCCESS',
        message: 'No items to merge',
      });
    }

    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Merge logic
    for (const guestItem of items) {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId === guestItem.productId && item.size === guestItem.size
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += (guestItem.quantity || 1);
        if (cart.items[existingItemIndex].quantity > cart.items[existingItemIndex].stock) {
          cart.items[existingItemIndex].quantity = cart.items[existingItemIndex].stock;
        }
      } else {
        // We delete the front-end 'id' when saving to DB (mongoose assigns _id)
        const { id, ...itemToPush } = guestItem;
        cart.items.push(itemToPush);
      }
    }

    await cart.save();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Carts merged successfully',
      data: cart
    });

  } catch (error) {
    console.error('Merge Cart error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to merge carts',
      error: error.message
    });
  }
};
