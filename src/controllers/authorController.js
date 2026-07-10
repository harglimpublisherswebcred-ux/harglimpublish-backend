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

// @desc    Get author stats
// @route   GET /api/authors/:id/stats
// @access  Private (Author/Admin)
const getAuthorStats = async (req, res) => {
  try {
    const data = await authorService.getAuthorStats(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get author royalties history
// @route   GET /api/authors/:id/royalties/history
// @access  Private
const getAuthorRoyaltiesHistory = async (req, res) => {
  try {
    const data = await authorService.getRoyaltiesHistory(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAuthors,
  getAuthorById,
  getAuthorBooks,
  getAuthorStats,
  getAuthorRoyaltiesHistory
};
