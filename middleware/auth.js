const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      status: 'ERROR',
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mount user to the request
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'No user found with this id'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'ERROR',
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      status: 'ERROR',
      message: 'Access denied: Admin privileges required'
    });
  }
};

module.exports = { protect, adminOnly };
