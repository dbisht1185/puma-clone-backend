const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// Public catalog routes
router.get('/', getProducts);
router.get('/:slugOrId', getProductByIdOrSlug);

// Private/Admin catalog editing routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
