const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'User already exists with this email'
      });
    }

    // Create user (role defaults to 'user')
    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Registration successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // The frontend sends `username: values.email` or `email`
    const email = req.body.username || req.body.email;
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (user.status === 'blocked') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Your account has been blocked by the Administrator.'
      });
    }
    if (user.status === 'on-hold') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Your account is currently on-hold. Please contact support.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Send Reset Password OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
exports.resetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide email address'
      });
    }

    // Verify if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'No user registered with this email'
      });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save/Update in Otp collection
    await Otp.findOneAndUpdate(
      { email },
      { code, expiresAt },
      { upsert: true, new: true }
    );

    // LOG verification code to console so developer/user can see it!
    console.log('\n=========================================');
    console.log(`PASSWORD RESET REQUEST FOR: ${email}`);
    console.log(`YOUR VERIFICATION OTP IS: ${code}`);
    console.log('=========================================\n');

    // Return SUCCESS (we also return the code in payload for easy dev testing / user visual fallback!)
    return res.status(200).json({
      status: 'SUCCESS',
      message: 'OTP sent successfully! Please check your email/console.',
      code: code // sending back for developer convenience
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Reset Password using OTP Code
// @route   PUT /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide verification code and new password'
      });
    }

    // Find valid OTP record
    const otpRecord = await Otp.findOne({
      code,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid or expired verification code'
      });
    }

    // Update password for corresponding user
    const user = await User.findOne({ email: otpRecord.email });
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User associated with this verification code not found'
      });
    }

    // Update user password. Pre-save hook hashes password auto.
    user.password = newPassword;
    await user.save();

    // Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Password reset successful! You can now log in.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Public (mock validation)
exports.logout = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({
      status: 'SUCCESS',
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update user profile settings
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, gender, dob } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    user.name = name || user.name;
    user.phone = phone !== undefined ? phone : user.phone;
    user.gender = gender !== undefined ? gender : user.gender;
    user.dob = dob !== undefined ? dob : user.dob;

    await user.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Incorrect current password'
      });
    }

    // Save triggers hashing pre-save
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
      if (q.length === 24) {
        query.$or.push({ _id: q });
      }
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      status: 'SUCCESS',
      count: users.length,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update user status (Hold, Block, Unhold, Unblock, Active)
// @route   PUT /api/auth/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'on-hold', 'blocked'].includes(status)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide a valid status: active, on-hold, or blocked'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    // Do not allow blocking/holding oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'You cannot block or hold your own account'
      });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: `User account is now ${status}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update user role (Toggle user/admin)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide a valid role: user or admin'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    // Prevent removing admin role from yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'You cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: `User role updated to ${role} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Delete/Terminate user account
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'You cannot terminate your own account'
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'User account has been permanently terminated'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};
