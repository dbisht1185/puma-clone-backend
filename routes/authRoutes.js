const express = require('express');
const router = express.Router();
const {
  register,
  login,
  resetPasswordOtp,
  resetPassword,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password-otp', resetPasswordOtp);
router.put('/reset-password', resetPassword);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin-Only User Account Management Routes
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/status', protect, adminOnly, updateUserStatus);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
