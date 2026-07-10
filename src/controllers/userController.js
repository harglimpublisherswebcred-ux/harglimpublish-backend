const userService = require('../services/userService');

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const data = await userService.getStats(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const data = await userService.updateProfile(req.params.id, req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/users/:id/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const result = await userService.getOrders(req.params.id, req.user, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user wishlist
// @route   GET /api/users/:id/wishlist
// @access  Private
const getUserWishlist = async (req, res) => {
  try {
    const data = await userService.getWishlist(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user library
// @route   GET /api/users/:id/library
// @access  Private
const getUserLibrary = async (req, res) => {
  try {
    const data = await userService.getLibrary(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Add to wishlist
// @route   POST /api/users/:id/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const data = await userService.addToWishlist(req.params.id, req.user, req.body.bookId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/users/:id/wishlist/:bookId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const data = await userService.removeFromWishlist(req.params.id, req.user, req.params.bookId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserStats,
  updateUserProfile,
  getUserOrders,
  getUserWishlist,
  getUserLibrary,
  addToWishlist,
  removeFromWishlist
};
