const mongoose = require('mongoose');
const reviewRepository = require('../repositories/reviewRepository');

const error = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

class ReviewService {
  constructor(repository = reviewRepository) {
    this.repository = repository;
  }

  async findReviewableBook(bookRef) {
    if (!bookRef) throw error('Book is required', 400);
    if (mongoose.Types.ObjectId.isValid(bookRef)) {
      return this.repository.findBookById(bookRef);
    }
    return this.repository.findBookBySlug(bookRef);
  }

  async createReview(bookRef, user, payload = {}) {
    const book = await this.findReviewableBook(bookRef);
    if (!book || book.status !== 'published') throw error('Book not found', 404);
    const rating = Number(payload.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw error('Rating must be between 1 and 5', 400);
    if (!String(payload.comment || '').trim()) throw error('Comment is required', 400);
    const existing = await this.repository.findByBookAndUser(book._id, user._id);
    if (existing) throw error('You have already reviewed this book', 409);
    const review = await this.repository.create({ book: book._id, user: user._id, rating, comment: String(payload.comment).trim() });
    await this.repository.recalculateBookStats(book._id);
    return review;
  }

  async updateReview(reviewId, user, payload = {}) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw error('Review not found', 404);
    if (String(review.user) !== String(user._id) && user.role !== 'admin') throw error('Not authorized', 403);
    const update = {};
    if (payload.rating !== undefined) {
      const rating = Number(payload.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw error('Rating must be between 1 and 5', 400);
      update.rating = rating;
    }
    if (payload.comment !== undefined) {
      if (!String(payload.comment).trim()) throw error('Comment is required', 400);
      update.comment = String(payload.comment).trim();
    }
    const updated = await this.repository.updateById(reviewId, update);
    await this.repository.recalculateBookStats(review.book);
    return updated;
  }

  async deleteReview(reviewId, user) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw error('Review not found', 404);
    if (String(review.user) !== String(user._id) && user.role !== 'admin') throw error('Not authorized', 403);
    await this.repository.deleteById(reviewId);
    await this.repository.recalculateBookStats(review.book);
    return { success: true, message: 'Review deleted' };
  }

  async listReviews(filters = {}) {
    const page = Math.max(parseInt(filters.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);
    const query = {};
    if (filters.status) {
      query.status = filters.status === 'approved' ? 'visible' : filters.status;
    }
    if (filters.book) query.book = filters.book;
    if (filters.user) query.user = filters.user;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.list(query, { skip, limit }),
      this.repository.count(query)
    ]);
    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
  async moderateReview(reviewId, status, admin) {
    const normalizedStatus = status === 'approved' ? 'visible' : status;
    if (!['visible', 'hidden', 'rejected'].includes(normalizedStatus)) throw error('Invalid review status', 400);
    const review = await this.repository.updateById(reviewId, {
      status: normalizedStatus,
      moderatedBy: admin && admin._id,
      moderatedAt: new Date()
    });
    if (!review) throw error('Review not found', 404);
    await this.repository.recalculateBookStats(review.book);
    return review;
  }
}

module.exports = new ReviewService();
module.exports.ReviewService = ReviewService;


