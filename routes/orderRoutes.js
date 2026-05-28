const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// All checkout order routes require authentication
router.use(protect);

router.post('/place', placeOrder);
router.get('/my-orders', getMyOrders);
router.put('/:id/cancel', cancelOrder);

// Admin billing/shipping operations
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
