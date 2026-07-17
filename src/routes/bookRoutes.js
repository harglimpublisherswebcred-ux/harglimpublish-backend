const express = require('express');
const router = express.Router();
const { getBooks, getBookBySlug, getRelatedBooks, getBookReviews } = require('../controllers/bookController');
const { createReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getBooks);
router.get('/:slug', getBookBySlug);
router.get('/:slug/related', getRelatedBooks);
router.get('/:slug/reviews', getBookReviews);
router.post('/:slug/reviews', protect, createReview);
router.put('/:slug/reviews/:reviewId', protect, updateReview);
router.delete('/:slug/reviews/:reviewId', protect, deleteReview);

module.exports = router;

