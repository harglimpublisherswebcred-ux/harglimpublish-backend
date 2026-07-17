const Review = require('../models/Review');
const Book = require('../models/Book');

class ReviewRepository {
  findBookBySlug(slug) {
    return Book.findOne({ slug });
  }

  findBookById(id) {
    return Book.findById(id);
  }

  create(data) {
    return Review.create(data);
  }

  findById(id) {
    return Review.findById(id);
  }

  findByBookAndUser(bookId, userId) {
    return Review.findOne({ book: bookId, user: userId });
  }

  list(query, { skip, limit }) {
    return Review.find(query)
      .populate('book', 'title slug')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(query) {
    return Review.countDocuments(query);
  }

  updateById(id, update) {
    return Review.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true });
  }

  deleteById(id) {
    return Review.findByIdAndDelete(id);
  }

  async recalculateBookStats(bookId) {
    const stats = await Review.aggregate([
      { $match: { book: bookId, status: 'visible' } },
      { $group: { _id: '$book', average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const next = stats[0] || { average: 0, count: 0 };
    return Book.findByIdAndUpdate(bookId, {
      ratings: Math.round((next.average || 0) * 10) / 10,
      reviewCount: next.count || 0
    }, { returnDocument: 'after' });
  }
}

module.exports = new ReviewRepository();
module.exports.ReviewRepository = ReviewRepository;
