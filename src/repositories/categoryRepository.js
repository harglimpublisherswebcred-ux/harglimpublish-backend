const mongoose = require('mongoose');
const Category = require('../models/Category');
const Book = require('../models/Book');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

class CategoryRepositoryError extends Error {
  constructor(message = 'Category repository operation failed', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = 'CATEGORY_REPOSITORY_ERROR';
    this.details = details;
  }
}

class CategoryDuplicateError extends CategoryRepositoryError {
  constructor(message = 'Category already exists', details = {}) {
    super(message, details);
    this.code = 'CATEGORY_DUPLICATE';
    this.statusCode = 409;
  }
}

class CategoryNotFoundError extends CategoryRepositoryError {
  constructor(message = 'Category not found', details = {}) {
    super(message, details);
    this.code = 'CATEGORY_NOT_FOUND';
    this.statusCode = 404;
  }
}

const normalizePagination = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const pageNumber = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: pageNumber, limit: limitNumber, skip: (pageNumber - 1) * limitNumber };
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const execute = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error && error.code === 11000) {
      throw new CategoryDuplicateError('Category name or slug already exists', { keyValue: error.keyValue });
    }
    if (error instanceof CategoryRepositoryError) throw error;
    throw new CategoryRepositoryError(error.message, { message: error.message });
  }
};

class CategoryRepository {
  constructor({ categoryModel = Category, bookModel = Book } = {}) {
    this.Category = categoryModel;
    this.Book = bookModel;
  }

  create(data, options = {}) {
    return execute(async () => {
      const [category] = await this.Category.create([data], { session: options.session });
      return category;
    });
  }

  findById(id, options = {}) {
    return execute(async () => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return this.Category.findById(id).session(options.session || null);
    });
  }

  findBySlug(slug, options = {}) {
    return execute(async () => this.Category.findOne({ slug }).session(options.session || null));
  }

  findByName(name, options = {}) {
    return execute(async () => this.Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') }).session(options.session || null));
  }

  findBySlugOrName({ slug, name, excludeId }, options = {}) {
    return execute(async () => {
      const query = { $or: [] };
      if (slug) query.$or.push({ slug });
      if (name) query.$or.push({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
      if (!query.$or.length) return null;
      if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) query._id = { $ne: excludeId };
      return this.Category.findOne(query).session(options.session || null);
    });
  }

  updateById(id, update, options = {}) {
    return execute(async () => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return this.Category.findByIdAndUpdate(id, update, {
        returnDocument: 'after',
        runValidators: true,
        session: options.session
      });
    });
  }

  search(filters = {}, pagination = {}, options = {}) {
    return execute(async () => {
      const { page, limit, skip } = normalizePagination(pagination);
      const query = this.buildFilter(filters);
      const sort = this.buildSort(filters.sort);
      const [items, total] = await Promise.all([
        this.Category.find(query)
          .populate('parentCategory', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .session(options.session || null)
          .lean(),
        this.Category.countDocuments(query).session(options.session || null)
      ]);
      return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
    });
  }

  countBooks(categoryId, filters = {}, options = {}) {
    return execute(async () => {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) return 0;
      const query = { category: categoryId };
      if (filters.activeOnly !== false) query.status = { $ne: 'archived' };
      return this.Book.countDocuments(query).session(options.session || null);
    });
  }

  listBooksByCategory(categoryId, filters = {}, pagination = {}, options = {}) {
    return execute(async () => {
      const { page, limit, skip } = normalizePagination(pagination);
      const query = { category: categoryId, status: 'published' };
      const sort = this.buildBookSort(filters.sort);
      const [items, total] = await Promise.all([
        this.Book.find(query)
          .populate('author', 'name')
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .session(options.session || null)
          .lean(),
        this.Book.countDocuments(query).session(options.session || null)
      ]);
      return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
    });
  }

  updateBookCount(categoryId, count, options = {}) {
    return execute(async () => {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) return null;
      return this.Category.findByIdAndUpdate(
        categoryId,
        { bookCount: count },
        { returnDocument: 'after', runValidators: true, session: options.session }
      );
    });
  }

  buildFilter(filters = {}) {
    const query = {};
    const and = [];
    const activeValue = filters.active !== undefined ? filters.active : filters.isActive;
    if (activeValue !== undefined) {
      const active = String(activeValue) === 'true';
      and.push({ $or: [
        { active },
        { active: { $exists: false }, isActive: active }
      ] });
    }
    if (filters.featured !== undefined) query.featured = String(filters.featured) === 'true';
    if (filters.parentCategory) query.parentCategory = filters.parentCategory;
    if (filters.search || filters.q) {
      const regex = new RegExp(escapeRegex(filters.search || filters.q), 'i');
      and.push({ $or: [{ name: regex }, { slug: regex }, { description: regex }, { shortDescription: regex }] });
    }
    if (and.length) query.$and = and;
    return query;
  }

  buildSort(sort) {
    const allowed = new Set(['name', 'sortOrder', 'bookCount', 'createdAt', 'updatedAt']);
    const fallback = { sortOrder: 1, name: 1 };
    if (!sort) return fallback;
    const direction = String(sort).startsWith('-') ? -1 : 1;
    const field = String(sort).replace(/^-/, '');
    if (!allowed.has(field)) return fallback;
    return { [field]: direction, name: 1 };
  }

  buildBookSort(sort) {
    if (sort === 'price_asc') return { price: 1 };
    if (sort === 'price_desc') return { price: -1 };
    if (sort === 'newest') return { createdAt: -1 };
    return { createdAt: -1 };
  }
}

module.exports = new CategoryRepository();
module.exports.CategoryRepository = CategoryRepository;
module.exports.CategoryRepositoryError = CategoryRepositoryError;
module.exports.CategoryDuplicateError = CategoryDuplicateError;
module.exports.CategoryNotFoundError = CategoryNotFoundError;
