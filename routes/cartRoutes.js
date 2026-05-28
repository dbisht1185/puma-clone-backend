const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// All cart routes require user to be logged in
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem);
router.delete('/remove/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.post('/merge', cartController.mergeCart);

module.exports = router;
