const Book = require('../models/Book');
const Category = require('../models/Category');
const Review = require('../models/Review');

class CatalogRepository {
  findCategoryBySlug(slug) {
    return Category.findOne({ slug });
  }

  findPublishedBooks(query, { sort, skip, limit }) {
    return Book.find(query)
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
      .populate('author', 'name bio profilePicture')
      .populate('category', 'name slug');
  }

  searchPublishedBooks(search, { skip, limit }) {
    return Book.find(
      { $text: { $search: search }, status: 'published' },
      { score: { $meta: 'textScore' } }
    )
      .populate('author', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);
  }

  countPublishedSearch(search) {
    return Book.countDocuments({ $text: { $search: search }, status: 'published' });
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


