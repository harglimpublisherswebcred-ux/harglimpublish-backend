const catalogService = require('../services/catalogService');

// @desc    Get all published books with pagination and filters
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const result = await catalogService.listBooks(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single book by slug
// @route   GET /api/books/:slug
// @access  Public
const getBookBySlug = async (req, res) => {
  try {
    const book = await catalogService.getBookBySlug(req.params.slug);
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Search books
// @route   GET /api/search
// @access  Public
const searchBooks = async (req, res) => {
  try {
    const result = await catalogService.searchBooks(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get related books
// @route   GET /api/books/:slug/related
// @access  Public
const getRelatedBooks = async (req, res) => {
  try {
    const related = await catalogService.getRelatedBooks(req.params.slug, req.query);
    res.json({ success: true, data: related });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get book reviews
// @route   GET /api/books/:slug/reviews
// @access  Public
const getBookReviews = async (req, res) => {
  try {
    const result = await catalogService.getBookReviews(req.params.slug, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBooks,
  getBookBySlug,
  searchBooks,
  getRelatedBooks,
  getBookReviews
};
