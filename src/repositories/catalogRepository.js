const Book = require('../models/Book');
const Category = require('../models/Category');
const Review = require('../models/Review');

const PUBLIC_BOOK_FIELDS = '-royaltyPercentage -reservedStock -printingCost -platformCharges -deliveryCharges';

class CatalogRepository {
  findCategoryBySlug(slug) {
    return Category.findOne({
      slug,
      $or: [{ active: true }, { active: { $exists: false }, isActive: true }]
    });
  }

  findPublishedBooks(query, { sort, skip, limit }) {
    return Book.find(query)
      .select(PUBLIC_BOOK_FIELDS)
      .populate('author', 'name')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  countBooks(query) {
    return Book.countDocuments(query);
  }

  findPublishedBookBySlug(slug) {
    return Book.findOne({ slug, status: 'published' })
      .select(PUBLIC_BOOK_FIELDS)
      .populate('author', 'name bio profilePicture')
      .populate('category', 'name slug');
  }

  searchPublishedBooks(search, { filter = {}, sort, skip, limit }) {
    return Book.find(
      { ...filter, $text: { $search: search }, status: 'published' },
      { score: { $meta: 'textScore' } }
    )
      .select(PUBLIC_BOOK_FIELDS)
      .populate('author', 'name')
      .populate('category', 'name slug')
      .sort(sort || { score: { $meta: 'textScore' }, _id: 1 })
      .skip(skip)
      .limit(limit);
  }

  countPublishedSearch(search, filter = {}) {
    return Book.countDocuments({ ...filter, $text: { $search: search }, status: 'published' });
  }

  findBookForRelated(slug) {
    return Book.findOne({ slug, status: 'published' });
  }

  findRelatedBooks(book, limit) {
    return Book.find({
      category: book.category,
      _id: { $ne: book._id },
      status: 'published'
    })
      .select(PUBLIC_BOOK_FIELDS)
      .populate('author', 'name')
      .limit(limit);
  }

  findBookBySlug(slug) {
    return Book.findOne({ slug });
  }

  findReviewsByBook(bookId, { skip, limit }) {
    return Review.find({ book: bookId, status: 'visible' })
      .populate('user', 'name profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
  }

  countReviewsByBook(bookId) {
    return Review.countDocuments({ book: bookId, status: 'visible' });
  }
}

module.exports = new CatalogRepository();
module.exports.CatalogRepository = CatalogRepository;


