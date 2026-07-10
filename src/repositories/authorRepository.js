const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

class AuthorRepository {
  findAuthors({ skip, limit }) {
    return User.find({ role: 'author' })
      .select('name profilePicture bio')
      .skip(skip)
      .limit(limit);
  }

  countAuthors() {
    return User.countDocuments({ role: 'author' });
  }

  countPublishedBooks(authorId) {
    return Book.countDocuments({ author: authorId, status: 'published' });
  }

  findAuthorById(id) {
    return User.findOne({ _id: id, role: 'author' }).select('-password');
  }

  findPublishedBooksByAuthor(authorId, { sort, skip, limit }) {
    return Book.find({ author: authorId, status: 'published' })
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  countPublishedBooksByAuthor(authorId) {
    return Book.countDocuments({ author: authorId, status: 'published' });
  }

  findBooksByAuthor(authorId) {
    return Book.find({ author: authorId });
  }

  findOrdersForBooks(bookIds) {
    return Order.find({ 'items.book': { $in: bookIds }, status: { $in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] } });
  }

  findUserById(id) {
    return User.findById(id);
  }
}

module.exports = new AuthorRepository();
module.exports.AuthorRepository = AuthorRepository;
