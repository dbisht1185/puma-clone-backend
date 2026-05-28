const express = require('express');
const router = express.Router();
const {
  getAllPincodes,
  checkPincode,
  createPincode,
  updatePincode,
  deletePincode
} = require('../controllers/pincodeController');

// Public route to check pincode
router.get('/check/:code', checkPincode);

// Admin routes (assuming no auth middleware is required for this demo)
router.route('/')
  .get(getAllPincodes)
  .post(createPincode);

router.route('/:id')
  .put(updatePincode)
  .delete(deletePincode);

module.exports = router;
