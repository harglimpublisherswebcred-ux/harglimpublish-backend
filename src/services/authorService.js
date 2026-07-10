const authorRepository = require('../repositories/authorRepository');

const pageMeta = (page, limit, defaultLimit = 12) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || defaultLimit;
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const authorizeAuthor = (authorId, actor) => {
  if (String(actor.id || actor._id) !== String(authorId) && actor.role !== 'admin') {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
};

class AuthorService {
  constructor(repository = authorRepository) {
    this.repository = repository;
  }

  async listAuthors({ page, limit } = {}) {
    const { pageNum, limitNum, skip } = pageMeta(page, limit);
    const authors = await this.repository.findAuthors({ skip, limit: limitNum });
    const data = await Promise.all(authors.map(async (author) => ({
      ...author.toObject(),
      bookCount: await this.repository.countPublishedBooks(author._id)
    })));
    const total = await this.repository.countAuthors();
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getAuthorById(id) {
    const author = await this.repository.findAuthorById(id);
    if (!author) {
      const error = new Error('Author not found');
      error.statusCode = 404;
      throw error;
    }
    return author;
  }

  async getAuthorBooks(authorId, { page, limit, sort } = {}) {
    const { pageNum, limitNum, skip } = pageMeta(page, limit);
    let sortQuery = '-createdAt';
    if (sort === '-sales') sortQuery = '-sales';
    const data = await this.repository.findPublishedBooksByAuthor(authorId, { sort: sortQuery, skip, limit: limitNum });
    const total = await this.repository.countPublishedBooksByAuthor(authorId);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getAuthorStats(authorId, actor) {
    authorizeAuthor(authorId, actor);
    const books = await this.repository.findBooksByAuthor(authorId);
    const bookIds = books.map((book) => book._id);
    const orders = await this.repository.findOrdersForBooks(bookIds);

    let totalRevenue = 0;
    let totalSales = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (bookIds.some((id) => id.equals(item.book))) {
          totalRevenue += item.price * item.quantity;
          totalSales += item.quantity;
        }
      });
    });

    return { totalBooks: books.length, totalSales, totalRevenue };
  }

  async getRoyaltiesHistory(authorId, actor) {
    authorizeAuthor(authorId, actor);
    const user = await this.repository.findUserById(authorId);
    return {
      balance: user.royaltiesBalance || 0,
      history: []
    };
  }
}

module.exports = new AuthorService();
module.exports.AuthorService = AuthorService;
