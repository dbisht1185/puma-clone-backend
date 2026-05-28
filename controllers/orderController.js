const Order = require('../models/Order');
const Product = require('../models/Product');

const Cart = require('../models/Cart');

// @desc    Create new order
// @route   POST /api/orders/place
// @access  Private
exports.placeOrder = async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod, isSameAddress, promoCode } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ status: 'ERROR', message: 'Please provide shipping address' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ status: 'ERROR', message: 'Please provide a payment method' });
    }

    // 1. Get the user's cart from DB
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ status: 'ERROR', message: 'Your cart is empty' });
    }

    // 2. Verify stock & calculate server-side total
    let calculatedSubtotal = 0;
    let totalDiscount = 0;

    for (const item of cart.items) {
      const dbProduct = await Product.findOne({ productId: item.productId });
      if (!dbProduct) {
        return res.status(400).json({ status: 'ERROR', message: `Product ${item.name} not found` });
      }

      // Check stock specifically for the selected size if possible, else general stock
      const sizeData = dbProduct.sizes?.find(s => s.size === item.size);
      const availableStock = sizeData ? sizeData.stock : dbProduct.stock;

      if (availableStock < item.quantity) {
        return res.status(400).json({
          status: 'ERROR',
          message: `Insufficient stock for product ${dbProduct.name} in size ${item.size}. Available: ${availableStock}`
        });
      }

      // Calculate price based on DB product to prevent frontend tampering
      const basePrice = dbProduct.basePrice || dbProduct.price || item.basePrice;
      const discountType = dbProduct.discountType || (dbProduct.offerPrice ? 'PERCENT' : null);
      const discountValue = dbProduct.discountValue || (dbProduct.offerPrice ? 20 : 0);

      calculatedSubtotal += basePrice * item.quantity;

      if (discountType === 'PERCENT') {
        totalDiscount += (basePrice * (discountValue / 100)) * item.quantity;
      } else if (discountType === 'FLAT') {
        totalDiscount += discountValue * item.quantity;
      }
    }

    let calculatedTotal = calculatedSubtotal - totalDiscount;
    let promoDiscountAmount = 0;

    // Apply promo if valid
    if (promoCode) {
      const validPromoCodes = {
        SAVE10: { discount: 0.1, type: "PERCENT" },
        FLAT500: { discount: 500, type: "FLAT" },
        WELCOME20: { discount: 0.2, type: "PERCENT" },
      };
      const promo = validPromoCodes[promoCode];
      if (promo) {
        if (promo.type === "PERCENT") {
          promoDiscountAmount = calculatedSubtotal * promo.discount;
        } else {
          promoDiscountAmount = Math.min(promo.discount, calculatedSubtotal);
        }
        calculatedTotal -= promoDiscountAmount;
      }
    }

    // Payment Simulation Logic
    const paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid';

    // 3. Create the order
    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.basePrice,
        quantity: item.quantity,
        img: item.image,
        size: item.size,
        color: item.color,
        discountType: item.discountType,
        discountValue: item.discountValue
      })),
      totalAmount: Math.max(0, calculatedTotal),
      promoDiscount: promoDiscountAmount,
      shippingAddress,
      billingAddress: isSameAddress ? shippingAddress : billingAddress,
      paymentMethod,
      paymentStatus,
      status: 'Processing' // Auto process for simulated payment
    });

    // 4. Update product inventory
    for (const item of cart.items) {
      const dbProduct = await Product.findOne({ productId: item.productId });
      if (dbProduct) {
        const sizeIndex = dbProduct.sizes?.findIndex(s => s.size === item.size);
        if (sizeIndex > -1) {
          dbProduct.sizes[sizeIndex].stock -= item.quantity;
        } else {
          dbProduct.stock -= item.quantity;
        }
        await dbProduct.save();
      }
    }

    // 5. Clear the user's cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Place Order Error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'SUCCESS',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query.$or = [
        { 'shippingAddress.fullName': { $regex: q, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: q, $options: 'i' } }
      ];
      if (q.length === 24) {
        query.$or.push({ _id: q });
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'SUCCESS',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide status'
      });
    }

    let order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Cancel order (User cancels their own order)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Order not found'
      });
    }

    if (order.status !== 'Pending' && order.status !== 'Pending Payment') {
      return res.status(400).json({
        status: 'ERROR',
        message: `Cannot cancel an order that is already ${order.status}`
      });
    }

    order.status = 'Cancelled';
    await order.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};
