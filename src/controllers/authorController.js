const authorService = require('../services/authorService');

// @desc    Get all authors
// @route   GET /api/authors
// @access  Public
const getAuthors = async (req, res) => {
  try {
    const result = await authorService.listAuthors(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get author profile
// @route   GET /api/authors/:id
// @access  Public
const getAuthorById = async (req, res) => {
  try {
    const author = await authorService.getAuthorById(req.params.id);
    res.json({ success: true, data: author });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get author books
// @route   GET /api/authors/:id/books
// @access  Public
const getAuthorBooks = async (req, res) => {
  try {
    const result = await authorService.getAuthorBooks(req.params.id, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const authorDashboardService = require('../services/authorDashboardService');

// @desc    Get author stats
// @route   GET /api/authors/:id/stats
// @access  Private (Author/Admin)
const getAuthorStats = async (req, res, next) => {
  try {
    const data = await authorService.getAuthorStats(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get author royalties history
// @route   GET /api/authors/:id/royalties/history
// @access  Private (Author/Admin)
const getAuthorRoyaltiesHistory = async (req, res, next) => {
  try {
    const data = await authorService.getRoyaltiesHistory(req.params.id, req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated author dashboard summary
// @route   GET /api/authors/me/dashboard
// @access  Private (Author/Admin)
const getMyDashboard = async (req, res, next) => {
  try {
    const data = await authorDashboardService.getDashboardSummary(req.user._id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated author analytics
// @route   GET /api/authors/me/analytics
// @access  Private (Author/Admin)
const getMyAnalytics = async (req, res, next) => {
  try {
    const data = await authorDashboardService.getAuthorAnalytics(req.user._id, req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated author book performance
// @route   GET /api/authors/me/books/performance
// @access  Private (Author/Admin)
const getMyBookPerformance = async (req, res, next) => {
  try {
    const data = await authorDashboardService.getAuthorBookPerformance(req.user._id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated author royalties history
// @route   GET /api/authors/me/royalties
// @access  Private (Author/Admin)
const getMyRoyalties = async (req, res, next) => {
  try {
    const data = await authorDashboardService.getAuthorRoyaltyHistory(req.user._id, req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuthors,
  getAuthorById,
  getAuthorBooks,
  getAuthorStats,
  getAuthorRoyaltiesHistory,
  getMyDashboard,
  getMyAnalytics,
  getMyBookPerformance,
  getMyRoyalties
};
