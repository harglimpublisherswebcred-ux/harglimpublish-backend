const Book = require('../models/Book');
const User = require('../models/User');

class PublicStatsRepository {
  countPublishedBooks() {
    return Book.countDocuments({ status: 'published' });
  }

  countActiveAuthors() {
    return User.countDocuments({ role: 'author', isActive: true });
  }
}

module.exports = new PublicStatsRepository();
module.exports.PublicStatsRepository = PublicStatsRepository;
