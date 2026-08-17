const adminCoreService = require('../services/adminCoreService');

// @desc    Get global analytics for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
  try {
    const data = await adminCoreService.getAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List books for admin inventory management
// @route   GET /api/admin/books
// @access  Private (Admin)
const listBooks = async (req, res) => {
  try {
    const result = await adminCoreService.listBooks(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new book (Inventory Management)
// @route   POST /api/admin/books
// @access  Private (Admin)
const createBook = async (req, res) => {
  try {
    const createdBook = await adminCoreService.createBook(req.body, req.user);
    res.status(201).json({ success: true, data: createdBook });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update a book
// @route   PUT /api/admin/books/:id
// @access  Private (Admin)
const updateBook = async (req, res) => {
  try {
    const book = await adminCoreService.updateBook(req.params.id, req.body);
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a book
// @route   DELETE /api/admin/books/:id
// @access  Private (Admin)
const deleteBook = async (req, res) => {
  try {
    const result = await adminCoreService.deleteBook(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getOrders = async (req, res) => {
  try {
    const orders = await adminCoreService.listOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const order = await adminCoreService.updateOrderStatus(req.params.id, req.body.status);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get publish requests
// @route   GET /api/admin/publish-requests
// @access  Private (Admin)
const getPublishRequests = async (req, res) => {
  try {
    const requests = await adminCoreService.listPublishRequests();
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update publish request status
// @route   PUT /api/admin/publish-requests/:id/status
// @access  Private (Admin)
const updatePublishRequestStatus = async (req, res) => {
  try {
    const request = await adminCoreService.updatePublishRequestStatus(req.params.id, req.body.status);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Request changes on publish request
// @route   POST /api/admin/publish-requests/:id/request-changes
// @access  Private (Admin)
const requestChangesOnPublishRequest = async (req, res) => {
  try {
    const request = await adminCoreService.requestChangesOnPublishRequest(req.user, req.params.id, req.body.reason);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Reject publish request
// @route   POST /api/admin/publish-requests/:id/reject
// @access  Private (Admin)
const rejectPublishRequest = async (req, res) => {
  try {
    const request = await adminCoreService.rejectPublishRequest(req.user, req.params.id, req.body.reason);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Approve publish request and publish book
// @route   POST /api/admin/publish-requests/:id/approve
// @access  Private (Admin)
const approveAndPublishBook = async (req, res) => {
  try {
    const request = await adminCoreService.approveAndPublishBook(req.user, req.params.id, req.body.notes);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    List users
// @route   GET /api/admin/users
// @access  Private (Admin)
const listUsers = async (req, res) => {
  try {
    const result = await adminCoreService.listUsers(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUser = async (req, res) => {
  try {
    res.json({ success: true, data: await adminCoreService.getUser(req.params.id) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    res.json({ success: true, data: await adminCoreService.updateUser(req.params.id, req.body) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
  try {
    res.json({ success: true, data: await adminCoreService.updateUserRole(req.params.id, req.body.role) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
  try {
    res.json({ success: true, data: await adminCoreService.updateUserStatus(req.params.id, req.body.isActive) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private (Admin)
const resetUserPassword = async (req, res) => {
  try {
    res.json({ success: true, data: await adminCoreService.resetUserPassword(req.params.id, req.body.password) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const authorDashboardService = require('../services/authorDashboardService');

const getAdminAuthorDashboard = async (req, res) => {
  try {
    const data = await authorDashboardService.getDashboardSummary(req.params.authorId, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAdminAuthorRoyalties = async (req, res) => {
  try {
    const data = await authorDashboardService.getAuthorRoyaltyHistory(req.params.authorId, req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAdminDashboardOverview = async (req, res) => {
  try {
    const data = await adminCoreService.getAdminDashboardOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAdminAuthorDetail = async (req, res) => {
  try {
    const data = await adminCoreService.getAdminAuthorDetail(req.params.authorId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminAnalytics,
  getAdminDashboardOverview,
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  getOrders,
  updateOrderStatus,
  getPublishRequests,
  updatePublishRequestStatus,
  requestChangesOnPublishRequest,
  rejectPublishRequest,
  approveAndPublishBook,
  listUsers,
  getUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  getAdminAuthorDashboard,
  getAdminAuthorRoyalties,
  getAdminAuthorDetail
};
