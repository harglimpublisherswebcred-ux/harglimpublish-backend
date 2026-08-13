const userService = require('../services/userService');
const userContextService = require('../services/userContextService');

// @desc    Get current user session context & capabilities
// @route   GET /api/users/me/context
// @access  Private
const getUserContext = async (req, res) => {
  try {
    const data = await userContextService.getUserContext(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const data = await userService.getProfile(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
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

// @desc    Get user invoices
// @route   GET /api/users/:id/invoices
// @access  Private
const getUserInvoices = async (req, res) => {
  try {
    const result = await userService.getInvoices(req.params.id, req.user, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user invoice detail
// @route   GET /api/users/:id/invoices/:invoiceId
// @access  Private
const getUserInvoice = async (req, res) => {
  try {
    const data = await userService.getInvoice(req.params.id, req.user, req.params.invoiceId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Download user invoice document
// @route   GET /api/users/:id/invoices/:invoiceId/download
// @access  Private
const downloadUserInvoice = async (req, res) => {
  try {
    const document = await userService.getInvoiceDocument(req.params.id, req.user, req.params.invoiceId);
    res.setHeader('Content-Type', document.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.send(document.buffer);
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/:id/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const result = await userService.getNotifications(req.params.id, req.user, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Mark user notification as read
// @route   PATCH /api/users/:id/notifications/:notificationId/read
// @access  Private
const markUserNotificationRead = async (req, res) => {
  try {
    const data = await userService.markNotificationRead(req.params.id, req.user, req.params.notificationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
// @desc    Get user payment attempts
// @route   GET /api/users/:id/payments
// @access  Private
const getUserPayments = async (req, res) => {
  try {
    const result = await userService.getPaymentAttempts(req.params.id, req.user, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user payment detail
// @route   GET /api/users/:id/payments/:paymentId
// @access  Private
const getUserPayment = async (req, res) => {
  try {
    const data = await userService.getPayment(req.params.id, req.user, req.params.paymentId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get order payment attempts
// @route   GET /api/users/:id/orders/:orderId/payments
// @access  Private
const getUserOrderPayments = async (req, res) => {
  try {
    const result = await userService.getOrderPayments(req.params.id, req.user, req.params.orderId, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user shipments
// @route   GET /api/users/:id/shipments
// @access  Private
const getUserShipments = async (req, res) => {
  try {
    const result = await userService.getShipments(req.params.id, req.user, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user shipment detail
// @route   GET /api/users/:id/shipments/:shipmentId
// @access  Private
const getUserShipment = async (req, res) => {
  try {
    const data = await userService.getShipment(req.params.id, req.user, req.params.shipmentId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user notification detail
// @route   GET /api/users/:id/notifications/:notificationId
// @access  Private
const getUserNotification = async (req, res) => {
  try {
    const data = await userService.getNotification(req.params.id, req.user, req.params.notificationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications read
// @route   PATCH /api/users/:id/notifications/read-all
// @access  Private
const markAllUserNotificationsRead = async (req, res) => {
  try {
    const data = await userService.markAllNotificationsRead(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Archive user notification
// @route   DELETE /api/users/:id/notifications/:notificationId
// @access  Private
const archiveUserNotification = async (req, res) => {
  try {
    const data = await userService.archiveNotification(req.params.id, req.user, req.params.notificationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserContext,
  getCurrentUser,
  getUserStats,
  updateUserProfile,
  getUserOrders,
  getUserWishlist,
  getUserLibrary,
  addToWishlist,
  removeFromWishlist,
  getUserInvoices,
  getUserInvoice,
  downloadUserInvoice,
  getUserNotifications,
  markUserNotificationRead,
  getUserPayments,
  getUserPayment,
  getUserOrderPayments,
  getUserShipments,
  getUserShipment,
  getUserNotification,
  markAllUserNotificationsRead,
  archiveUserNotification
};
