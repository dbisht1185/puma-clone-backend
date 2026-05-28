const Pincode = require('../models/Pincode');

// @desc    Check pincode delivery availability
// @route   GET /api/pincodes/check/:code
// @access  Public
exports.checkPincode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid PIN code format'
      });
    }

    const pincodeData = await Pincode.findOne({ code });

    if (!pincodeData) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Delivery not available to this PIN code at the moment.'
      });
    }

    if (!pincodeData.isServiceable) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Service is temporarily unavailable for this PIN code.'
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      data: pincodeData
    });

  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Get all pincodes
// @route   GET /api/pincodes
// @access  Private/Admin
exports.getAllPincodes = async (req, res) => {
  try {
    const pincodes = await Pincode.find().sort({ createdAt: -1 });
    
    return res.status(200).json({
      status: 'SUCCESS',
      count: pincodes.length,
      data: pincodes
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Create a new pincode
// @route   POST /api/pincodes
// @access  Private/Admin
exports.createPincode = async (req, res) => {
  try {
    const { code, deliveryDays, isServiceable, charges, city, state } = req.body;

    if (!code) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'PIN code is required'
      });
    }

    const existingPincode = await Pincode.findOne({ code });
    if (existingPincode) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'PIN code already exists in the system'
      });
    }

    const pincode = await Pincode.create({
      code,
      deliveryDays: deliveryDays || 3,
      isServiceable: isServiceable !== undefined ? isServiceable : true,
      charges: charges || 0,
      city,
      state
    });

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Pincode added successfully',
      data: pincode
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update a pincode
// @route   PUT /api/pincodes/:id
// @access  Private/Admin
exports.updatePincode = async (req, res) => {
  try {
    const { id } = req.params;
    
    let pincode = await Pincode.findById(id);
    
    if (!pincode) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Pincode not found'
      });
    }

    pincode = await Pincode.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Pincode updated successfully',
      data: pincode
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Delete a pincode
// @route   DELETE /api/pincodes/:id
// @access  Private/Admin
exports.deletePincode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pincode = await Pincode.findById(id);
    
    if (!pincode) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Pincode not found'
      });
    }

    await Pincode.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Pincode deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};
