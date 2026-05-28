const Address = require('../models/Address');

// @desc    Get user's addresses
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      status: 'SUCCESS',
      data: addresses
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private
exports.createAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide all required address fields'
      });
    }

    // Check if this is the first address or set to default
    const existingAddressesCount = await Address.countDocuments({ user: req.user._id });
    const makeDefault = existingAddressesCount === 0 ? true : isDefault;

    // If making this default, set other addresses to false
    if (makeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      postalCode,
      country: country || "India",
      isDefault: makeDefault
    });

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    let address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Address not found'
      });
    }

    // If setting to default, unset others first
    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2 !== undefined ? addressLine2 : address.addressLine2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: req.params.id });

    // If deleted address was the default one, make the most recently updated address default
    if (wasDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Address deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};
