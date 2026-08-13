const authorBookService = require('../services/authorBookService');

// @desc    List author's own books
// @route   GET /api/authors/me/books
// @access  Private (Author)
const getMyBooks = async (req, res, next) => {
  try {
    const result = await authorBookService.listAuthorBooks(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.books,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get author's own book detail
// @route   GET /api/authors/me/books/:bookId
// @access  Private (Author)
const getMyBookDetail = async (req, res, next) => {
  try {
    const result = await authorBookService.getAuthorBookDetail(req.user, req.params.bookId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create author book draft
// @route   POST /api/authors/me/books
// @access  Private (Author)
const createBookDraft = async (req, res, next) => {
  try {
    const book = await authorBookService.createAuthorBookDraft(req.user, req.body);
    res.status(201).json({
      success: true,
      data: {
        book
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update author book draft
// @route   PUT /api/authors/me/books/:bookId
// @access  Private (Author)
const updateBookDraft = async (req, res, next) => {
  try {
    const book = await authorBookService.updateAuthorBookDraft(req.user, req.params.bookId, req.body);
    res.status(200).json({
      success: true,
      data: {
        book
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete author book draft
// @route   DELETE /api/authors/me/books/:bookId
// @access  Private (Author)
const deleteBookDraft = async (req, res, next) => {
  try {
    const result = await authorBookService.deleteAuthorBookDraft(req.user, req.params.bookId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit author book for editorial review
// @route   POST /api/authors/me/books/:bookId/submit
// @access  Private (Author)
const submitBookForReview = async (req, res, next) => {
  try {
    const result = await authorBookService.submitBookForReview(req.user, req.params.bookId, req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBooks,
  getMyBookDetail,
  createBookDraft,
  updateBookDraft,
  deleteBookDraft,
  submitBookForReview
};
