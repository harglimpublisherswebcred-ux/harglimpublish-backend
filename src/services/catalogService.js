const catalogRepository = require('../repositories/catalogRepository');

const pageMeta = (page, limit) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const notFound = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const parseBoolean = (value, field) => {
  if (value === undefined) return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw badRequest(`${field} must be true or false`);
};

const parseNonNegativeNumber = (value, field) => {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw badRequest(`${field} must be a non-negative number`);
  return number;
};

const buildSort = (sort, hasSearch) => {
  if (sort === 'price_asc') return { mrp: 1, _id: 1 };
  if (sort === 'price_desc') return { mrp: -1, _id: 1 };
  if (sort === 'rating') return { ratings: -1, reviewCount: -1, _id: 1 };
  if (sort === 'featured') return { isFeatured: -1, createdAt: -1, _id: -1 };
  if (sort === 'newest') return { createdAt: -1, _id: -1 };
  return hasSearch ? { score: { $meta: 'textScore' }, _id: 1 } : { createdAt: -1, _id: -1 };
};

class CatalogService {
  constructor(repository = catalogRepository) {
    this.repository = repository;
  }

  async listBooks(filters = {}) {
    const {
      category, minPrice, maxPrice, sort, page, limit, format,
      featured, bestseller, newRelease
    } = filters;
    const search = String(filters.q || filters.search || '').trim();
    const query = { status: 'published' };

    const featuredValue = parseBoolean(featured, 'featured');
    const bestsellerValue = parseBoolean(bestseller, 'bestseller');
    const newReleaseValue = parseBoolean(newRelease, 'newRelease');
    if (featuredValue !== undefined) query.isFeatured = featuredValue;
    if (bestsellerValue !== undefined) query.isBestseller = bestsellerValue;
    if (newReleaseValue !== undefined) query.isNewRelease = newReleaseValue;

    if (category) {
      const categoryDoc = await this.repository.findCategoryBySlug(category);
      if (!categoryDoc) {
        const { pageNum, limitNum } = pageMeta(page, limit);
        return { data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 } };
      }
      query.category = categoryDoc._id;
    }

    const minimumPrice = parseNonNegativeNumber(minPrice, 'minPrice');
    const maximumPrice = parseNonNegativeNumber(maxPrice, 'maxPrice');
    if (minimumPrice !== undefined && maximumPrice !== undefined && minimumPrice > maximumPrice) {
      throw badRequest('minPrice must be less than or equal to maxPrice');
    }
    if (minimumPrice !== undefined || maximumPrice !== undefined) {
      query.mrp = {};
      if (minimumPrice !== undefined) query.mrp.$gte = minimumPrice;
      if (maximumPrice !== undefined) query.mrp.$lte = maximumPrice;
    }

    if (format) query.format = String(format).trim().toLowerCase();

    const minimumRating = parseNonNegativeNumber(
      filters.minRating !== undefined ? filters.minRating : filters.rating,
      'minRating'
    );
    if (minimumRating !== undefined) {
      if (minimumRating > 5) throw badRequest('minRating must be between 0 and 5');
      query.ratings = { $gte: minimumRating };
    }

    const { pageNum, limitNum, skip } = pageMeta(page, limit);
    const sortQuery = buildSort(sort, Boolean(search));
    const data = search
      ? await this.repository.searchPublishedBooks(search, { filter: query, sort: sortQuery, skip, limit: limitNum })
      : await this.repository.findPublishedBooks(query, { sort: sortQuery, skip, limit: limitNum });
    const total = search
      ? await this.repository.countPublishedSearch(search, query)
      : await this.repository.countBooks(query);

    return { data, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } };
  }

  async getBookBySlug(slug) {
    const book = await this.repository.findPublishedBookBySlug(slug);
    if (!book) throw notFound('Book not found');
    return book;
  }

  async searchBooks(filters = {}) {
    const { q } = filters;
    if (!q) {
      const error = new Error('Search query is required');
      error.statusCode = 400;
      throw error;
    }
    return this.listBooks(filters);
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
    return { data, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } };
  }
}

module.exports = new CatalogService();
module.exports.CatalogService = CatalogService;
