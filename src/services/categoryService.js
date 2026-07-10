const categoryRepository = require('../repositories/categoryRepository');
const eventBus = require('../events/eventBus');
const { DOMAIN_EVENTS } = require('../events/eventCatalog');
const logger = require('../utils/logger');

class CategoryServiceError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class CategoryValidationError extends CategoryServiceError {
  constructor(message, details = {}) {
    super(message, 400, details);
  }
}

class CategoryConflictError extends CategoryServiceError {
  constructor(message, details = {}) {
    super(message, 409, details);
  }
}

class CategoryNotFoundError extends CategoryServiceError {
  constructor(message = 'Category not found', details = {}) {
    super(message, 404, details);
  }
}

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const toBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return String(value) === 'true';
};

class CategoryService {
  constructor({ repository = categoryRepository, bus = eventBus, serviceLogger = logger } = {}) {
    this.repository = repository;
    this.bus = bus;
    this.logger = serviceLogger;
  }

  async listPublicCategories(filters = {}) {
    return this.repository.search(
      { ...filters, active: filters.active === undefined ? true : filters.active },
      { page: filters.page, limit: filters.limit }
    );
  }

  async getPublicCategory(slug) {
    const category = await this.repository.findBySlug(slug);
    if (!category || category.active === false) throw new CategoryNotFoundError();
    await this.refreshBookCount(category._id);
    return this.repository.findBySlug(slug);
  }

  async getCategoryBooks(slug, filters = {}) {
    const category = await this.getPublicCategory(slug);
    const result = await this.repository.listBooksByCategory(category._id, filters, filters);
    return { category, books: result.items, pagination: result.pagination };
  }

  async listAdminCategories(filters = {}) {
    return this.repository.search(filters, { page: filters.page, limit: filters.limit });
  }

  async getAdminCategory(id) {
    const category = await this.repository.findById(id);
    if (!category) throw new CategoryNotFoundError();
    await this.refreshBookCount(category._id);
    return this.repository.findById(id);
  }

  async createCategory(data, actor = {}, options = {}) {
    this.validateCategoryPayload(data, { requireName: true });
    const payload = await this.preparePayload(data);
    const existing = await this.repository.findBySlugOrName({ slug: payload.slug, name: payload.name }, options);
    if (existing) throw new CategoryConflictError('Category name or slug already exists');

    const category = await this.repository.create(payload, options);
    await this.publishCategoryEvent(DOMAIN_EVENTS.CATEGORY_CREATED, category, actor, options);
    this.logger.info('category.created', { categoryId: category._id, slug: category.slug });
    return category;
  }

  async updateCategory(id, data, actor = {}, options = {}) {
    const category = await this.repository.findById(id, options);
    if (!category) throw new CategoryNotFoundError();
    this.validateCategoryPayload(data);
    const payload = await this.preparePayload(data, category);

    const existing = await this.repository.findBySlugOrName({
      slug: payload.slug,
      name: payload.name,
      excludeId: category._id
    }, options);
    if (existing) throw new CategoryConflictError('Category name or slug already exists');

    const updated = await this.repository.updateById(category._id, payload, options);
    await this.publishCategoryEvent(DOMAIN_EVENTS.CATEGORY_UPDATED, updated, actor, options);
    this.logger.info('category.updated', { categoryId: updated._id, slug: updated.slug });
    return updated;
  }

  async updateCategoryStatus(id, active, actor = {}, options = {}) {
    const category = await this.repository.findById(id, options);
    if (!category) throw new CategoryNotFoundError();
    const nextActive = toBoolean(active);
    if (nextActive === undefined) throw new CategoryValidationError('active status is required');

    const updated = await this.repository.updateById(category._id, { active: nextActive, isActive: nextActive }, options);
    await this.publishCategoryEvent(
      nextActive ? DOMAIN_EVENTS.CATEGORY_ACTIVATED : DOMAIN_EVENTS.CATEGORY_DEACTIVATED,
      updated,
      actor,
      options
    );
    return updated;
  }

  async deleteCategory(id, actor = {}, options = {}) {
    const category = await this.repository.findById(id, options);
    if (!category) throw new CategoryNotFoundError();
    const activeBooks = await this.repository.countBooks(category._id, { activeOnly: true }, options);
    if (activeBooks > 0) {
      throw new CategoryConflictError('Cannot delete category with active books', { activeBooks });
    }
    const updated = await this.repository.updateById(category._id, { active: false, isActive: false }, options);
    await this.publishCategoryEvent(DOMAIN_EVENTS.CATEGORY_DELETED, updated, actor, options);
    this.logger.info('category.deleted', { categoryId: updated._id, slug: updated.slug });
    return updated;
  }

  async refreshBookCount(categoryId, options = {}) {
    const count = await this.repository.countBooks(categoryId, { activeOnly: true }, options);
    return this.repository.updateBookCount(categoryId, count, options);
  }

  validateCategoryPayload(data = {}, options = {}) {
    if (options.requireName && !String(data.name || '').trim()) {
      throw new CategoryValidationError('Category name is required');
    }
    if (data.sortOrder !== undefined && Number.isNaN(Number(data.sortOrder))) {
      throw new CategoryValidationError('sortOrder must be a number');
    }
    if (data.bookCount !== undefined) {
      throw new CategoryValidationError('bookCount is managed by the system');
    }
  }

  async preparePayload(data = {}, current = {}) {
    const payload = {};
    const copyFields = [
      'name', 'description', 'shortDescription', 'image', 'banner', 'icon',
      'seoTitle', 'seoDescription', 'parentCategory', 'sortOrder', 'featured', 'metadata'
    ];
    copyFields.forEach((field) => {
      if (data[field] !== undefined) payload[field] = data[field];
    });

    if (data.active !== undefined || data.isActive !== undefined) {
      const active = toBoolean(data.active !== undefined ? data.active : data.isActive);
      payload.active = active;
      payload.isActive = active;
    }

    const baseSlug = data.slug ? slugify(data.slug) : (data.name ? slugify(data.name) : current.slug);
    if (baseSlug !== undefined) {
      if (!baseSlug) throw new CategoryValidationError('Category slug is invalid');
      payload.slug = baseSlug;
    }

    return payload;
  }

  async publishCategoryEvent(eventName, category, actor = {}, options = {}) {
    return this.bus.publish(eventName, {
      categoryId: String(category._id),
      name: category.name,
      slug: category.slug,
      active: category.active,
      actorId: actor && actor._id ? String(actor._id) : undefined
    }, {
      session: options.session,
      correlationId: options.correlationId,
      idempotencyKey: `${eventName}:${category._id}:${category.updatedAt ? category.updatedAt.getTime() : Date.now()}`
    });
  }
}

module.exports = new CategoryService();
module.exports.CategoryService = CategoryService;
module.exports.CategoryServiceError = CategoryServiceError;
module.exports.CategoryValidationError = CategoryValidationError;
module.exports.CategoryConflictError = CategoryConflictError;
module.exports.CategoryNotFoundError = CategoryNotFoundError;
module.exports.slugify = slugify;
