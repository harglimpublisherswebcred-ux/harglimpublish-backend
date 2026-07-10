const catalogRepository = require('../repositories/catalogRepository');

const pageMeta = (page, limit) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const notFound = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

class CatalogService {
  constructor(repository = catalogRepository) {
    this.repository = repository;
  }

  async listBooks(filters = {}) {
    const { category, minPrice, maxPrice, sort, page, limit, featured, bestseller, newRelease } = filters;
    const query = { status: 'published' };

    if (featured) query.isFeatured = true;
    if (bestseller) query.isBestseller = true;
    if (newRelease) query.isNewRelease = true;

    if (category) {
      const categoryDoc = await this.repository.findCategoryBySlug(category);
      if (!categoryDoc) {
        return { data: [], pagination: { total: 0, page: 1, pages: 0 } };
      }
      query.category = categoryDoc._id;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const { pageNum, limitNum, skip } = pageMeta(page, limit);
    let sortQuery = '-createdAt';
    if (sort === 'newest') sortQuery = '-createdAt';
    if (sort === 'price_asc') sortQuery = 'price';
    if (sort === 'price_desc') sortQuery = '-price';

    const data = await this.repository.findPublishedBooks(query, { sort: sortQuery, skip, limit: limitNum });
    const total = await this.repository.countBooks(query);

    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getBookBySlug(slug) {
    const book = await this.repository.findPublishedBookBySlug(slug);
    if (!book) throw notFound('Book not found');
    return book;
  }

  async searchBooks({ q, page, limit }) {
    if (!q) {
      const error = new Error('Search query is required');
      error.statusCode = 400;
      throw error;
    }
    const { pageNum, limitNum, skip } = pageMeta(page, limit);
    const data = await this.repository.searchPublishedBooks(q, { skip, limit: limitNum });
    const total = await this.repository.countPublishedSearch(q);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getRelatedBooks(slug, { limit } = {}) {
    const limitNum = parseInt(limit, 10) || 4;
    const book = await this.repository.findBookForRelated(slug);
    if (!book) throw notFound('Book not found');
    return this.repository.findRelatedBooks(book, limitNum);
  }

  async getBookReviews(slug, { page, limit } = {}) {
    const { pageNum, limitNum, skip } = pageMeta(page, limit || 5);
    const book = await this.repository.findBookBySlug(slug);
    if (!book) throw notFound('Book not found');
    const data = await this.repository.findReviewsByBook(book._id, { skip, limit: limitNum });
    const total = await this.repository.countReviewsByBook(book._id);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }
}

module.exports = new CatalogService();
module.exports.CatalogService = CatalogService;
