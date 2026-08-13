const authorBookRepository = require('../repositories/authorBookRepository');
const Category = require('../models/Category');
const logger = require('../utils/logger');

class AuthorBookError extends Error {
  constructor(message, code = 'AUTHOR_BOOK_ERROR', statusCode = 400, details = {}) {
    super(message);
    this.name = 'AuthorBookError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class AuthorBookNotFoundError extends AuthorBookError {
  constructor(bookId) {
    super(`Book not found or access denied: ${bookId}`, 'AUTHOR_BOOK_NOT_FOUND', 404);
  }
}

class AuthorBookOwnershipError extends AuthorBookError {
  constructor(message = 'You do not own this book') {
    super(message, 'AUTHOR_BOOK_OWNERSHIP_DENIED', 403);
  }
}

class AuthorBookStateError extends AuthorBookError {
  constructor(message = 'Book is in a state that cannot be modified') {
    super(message, 'AUTHOR_BOOK_INVALID_STATE', 409);
  }
}

class AuthorBookValidationError extends AuthorBookError {
  constructor(message = 'Invalid book payload', details = {}) {
    super(message, 'AUTHOR_BOOK_VALIDATION_ERROR', 400, details);
  }
}

const AUTHOR_EDITABLE_FIELDS = new Set([
  'title',
  'description',
  'category',
  'format',
  'coverImage',
  'mrp',
  'price',
  'isbn',
  'pages'
]);

const PROTECTED_ADMIN_FIELDS = new Set([
  'status',
  'royaltyPercentage',
  'stock',
  'reservedStock',
  'ratings',
  'reviewCount',
  'isBestseller',
  'isFeatured',
  'isNewRelease',
  'discountPrice',
  'author',
  'slug'
]);

const hasValue = (val) => val !== undefined && val !== null;

const filterAndNormalizeAuthorPayload = (payload = {}, isUpdate = false) => {
  const filtered = {};

  for (const field of PROTECTED_ADMIN_FIELDS) {
    if (payload[field] !== undefined) {
      throw new AuthorBookValidationError(`Field '${field}' is admin-only and cannot be set by author`);
    }
  }

  for (const key of Object.keys(payload)) {
    if (AUTHOR_EDITABLE_FIELDS.has(key)) {
      filtered[key] = payload[key];
    }
  }

  // Phase 1 MRP / Price Synchronization
  const hasMrp = hasValue(filtered.mrp);
  const hasPrice = hasValue(filtered.price);

  if (hasMrp && hasPrice && Number(filtered.mrp) !== Number(filtered.price)) {
    throw new AuthorBookValidationError('MRP and legacy price must match');
  }

  if (hasMrp && !hasPrice) filtered.price = filtered.mrp;
  if (!hasMrp && hasPrice) filtered.mrp = filtered.price;

  if (!isUpdate && (!hasValue(filtered.mrp) && !hasValue(filtered.price))) {
    filtered.mrp = 0;
    filtered.price = 0;
  }

  return filtered;
};

class AuthorBookService {
  constructor(repository = authorBookRepository, categoryModel = Category) {
    this.repository = repository;
    this.Category = categoryModel;
  }

  async listAuthorBooks(user, query = {}) {
    const { books, pagination } = await this.repository.findAuthorBooks(user._id, query, {
      page: query.page,
      limit: query.limit
    });

    const items = await Promise.all(
      books.map(async (book) => {
        const latestRequest = await this.repository.findLatestPublishRequestByBookId(book._id);
        return {
          ...book,
          publishingStatus: latestRequest ? latestRequest.status : (book.status === 'published' ? 'APPROVED' : 'DRAFT'),
          latestPublishRequest: latestRequest || null
        };
      })
    );

    return {
      books: items,
      pagination
    };
  }

  async getAuthorBookDetail(user, bookId) {
    const book = await this.repository.findAuthorBookById(user._id, bookId);
    if (!book) {
      throw new AuthorBookNotFoundError(bookId);
    }

    const latestRequest = await this.repository.findLatestPublishRequestByBookId(book._id);

    return {
      book,
      publishingStatus: latestRequest ? latestRequest.status : (book.status === 'published' ? 'APPROVED' : 'DRAFT'),
      latestPublishRequest: latestRequest || null
    };
  }

  async createAuthorBookDraft(user, payload = {}) {
    if (!user || user.role !== 'author') {
      throw new AuthorBookError('Must be an approved author to create books', 'AUTHOR_ROLE_REQUIRED', 403);
    }

    if (!payload.title || String(payload.title).trim() === '') {
      throw new AuthorBookValidationError('Book title is required');
    }

    if (!payload.description || String(payload.description).trim() === '') {
      throw new AuthorBookValidationError('Book description is required');
    }

    if (!payload.category) {
      throw new AuthorBookValidationError('Book category is required');
    }

    const categoryExists = await this.Category.findById(payload.category);
    if (!categoryExists) {
      throw new AuthorBookValidationError(`Invalid category ID: ${payload.category}`);
    }

    const sanitizedData = filterAndNormalizeAuthorPayload(payload, false);

    const bookData = {
      ...sanitizedData,
      author: user._id,
      slug: `${String(payload.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`
    };

    const book = await this.repository.createDraft(bookData);

    logger.info('author_book.draft_created', {
      service: 'hm-backend',
      bookId: book._id.toString(),
      authorId: user._id.toString()
    });

    return book;
  }

  async updateAuthorBookDraft(user, bookId, payload = {}) {
    const book = await this.repository.findAuthorBookById(user._id, bookId);
    if (!book) {
      throw new AuthorBookNotFoundError(bookId);
    }

    if (book.status === 'published') {
      throw new AuthorBookStateError('Published books cannot be directly modified by authors');
    }

    const latestRequest = await this.repository.findLatestPublishRequestByBookId(book._id);
    if (latestRequest && ['PENDING', 'UNDER_REVIEW', 'pending', 'reviewed'].includes(latestRequest.status)) {
      throw new AuthorBookStateError(`Book is currently under review (${latestRequest.status}) and locked for editing`);
    }

    if (payload.category) {
      const categoryExists = await this.Category.findById(payload.category);
      if (!categoryExists) {
        throw new AuthorBookValidationError(`Invalid category ID: ${payload.category}`);
      }
    }

    const sanitizedData = filterAndNormalizeAuthorPayload(payload, true);

    const updated = await this.repository.updateDraft(book._id, sanitizedData);

    logger.info('author_book.draft_updated', {
      service: 'hm-backend',
      bookId: book._id.toString(),
      authorId: user._id.toString()
    });

    return updated;
  }

  async deleteAuthorBookDraft(user, bookId) {
    const book = await this.repository.findAuthorBookById(user._id, bookId);
    if (!book) {
      throw new AuthorBookNotFoundError(bookId);
    }

    if (book.status === 'published') {
      throw new AuthorBookStateError('Published books cannot be deleted');
    }

    const latestRequest = await this.repository.findLatestPublishRequestByBookId(book._id);
    if (latestRequest && ['PENDING', 'UNDER_REVIEW', 'pending', 'reviewed'].includes(latestRequest.status)) {
      throw new AuthorBookStateError('Cannot delete a book that is currently under editorial review');
    }

    await this.repository.deleteDraft(book._id);

    logger.info('author_book.draft_deleted', {
      service: 'hm-backend',
      bookId: bookId.toString(),
      authorId: user._id.toString()
    });

    return { success: true, message: 'Book draft deleted' };
  }

  async submitBookForReview(user, bookId, payload = {}) {
    const book = await this.repository.findAuthorBookById(user._id, bookId);
    if (!book) {
      throw new AuthorBookNotFoundError(bookId);
    }

    if (book.status === 'published') {
      throw new AuthorBookStateError('Book is already published');
    }

    const activeRequest = await this.repository.findActivePublishRequestByBookId(book._id);
    if (activeRequest && ['PENDING', 'UNDER_REVIEW', 'pending', 'reviewed'].includes(activeRequest.status)) {
      throw new AuthorBookStateError(`Book has an active review submission in state: ${activeRequest.status}`);
    }

    const fileUrl = payload.fileUrl || payload.manuscriptUrl || payload.documentUrl;
    if (!fileUrl) {
      throw new AuthorBookValidationError('Manuscript file URL (fileUrl) is required for publishing submission');
    }

    let defaultPkg = await this.repository.getDefaultPackage();
    const packageId = payload.packageId || defaultPkg._id;

    const categoryDoc = await this.Category.findById(book.category);
    const genre = payload.genre || (categoryDoc ? categoryDoc.name : 'General');
    const wordCount = Number(payload.wordCount) || Number(payload.pages ? payload.pages * 300 : 25000);

    const publishRequest = await this.repository.createPublishRequest({
      user: user._id,
      book: book._id,
      title: book.title,
      genre,
      wordCount,
      packageId,
      fileUrl,
      status: 'PENDING'
    });

    logger.info('author_book.submitted_for_review', {
      service: 'hm-backend',
      bookId: book._id.toString(),
      authorId: user._id.toString(),
      requestId: publishRequest._id.toString()
    });

    return {
      book,
      publishRequest
    };
  }
}

module.exports = new AuthorBookService();
module.exports.AuthorBookService = AuthorBookService;
module.exports.AuthorBookError = AuthorBookError;
module.exports.AuthorBookNotFoundError = AuthorBookNotFoundError;
module.exports.AuthorBookOwnershipError = AuthorBookOwnershipError;
module.exports.AuthorBookStateError = AuthorBookStateError;
module.exports.AuthorBookValidationError = AuthorBookValidationError;
