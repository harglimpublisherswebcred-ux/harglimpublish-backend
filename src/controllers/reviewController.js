const reviewService = require('../services/reviewService');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const createReview = async (req, res) => {
  try {
    const bookRef = req.params.slug || req.body.book || req.body.bookId;
    const review = await reviewService.createReview(bookRef, req.user, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    sendError(res, error);
  }
};

const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;
    const review = await reviewService.updateReview(reviewId, req.user, req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    sendError(res, error);
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;
    res.json(await reviewService.deleteReview(reviewId, req.user));
  } catch (error) {
    sendError(res, error);
  }
};

const listReviews = async (req, res) => {
  try {
    const result = await reviewService.listReviews(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    sendError(res, error);
  }
};
const moderateReview = async (req, res) => {
  try {
    const review = await reviewService.moderateReview(req.params.reviewId || req.params.id, req.body.status, req.user);
    res.json({ success: true, data: review });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = { createReview, updateReview, deleteReview, listReviews, moderateReview };


