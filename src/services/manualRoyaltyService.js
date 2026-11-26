const mongoose = require('mongoose');
const crypto = require('crypto');
const manualRoyaltyRepository = require('../repositories/manualRoyaltyRepository');
const logger = require('../utils/logger');
const { roundMoney } = require('../utils/royaltyCalculation');

const serviceError = (message, statusCode = 400, code = 'MANUAL_ROYALTY_INVALID_REQUEST') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const moneyToPaise = (value, field) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw serviceError(`${field} must be greater than 0`);
  return Math.round((amount + Number.EPSILON) * 100);
};

const parseOptionalDate = (value, field) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw serviceError(`${field} must be a valid date`, 400, 'MANUAL_ROYALTY_INVALID_DATE');
  return parsed;
};

const parsePage = ({ page, limit } = {}) => {
  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  return { page: pageNumber, limit: limitNumber, skip: (pageNumber - 1) * limitNumber };
};

class ManualRoyaltyService {
  constructor(repository = manualRoyaltyRepository) {
    this.repository = repository;
  }

  async createStatement(payload = {}, actor, options = {}) {
    if (!mongoose.isValidObjectId(payload.authorId)) throw serviceError('Invalid authorId', 400, 'MANUAL_ROYALTY_INVALID_AUTHOR');
    const author = await this.repository.findAuthorById(payload.authorId);
    if (!author) throw serviceError('Author not found', 404);
    if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 100) {
      throw serviceError('items must contain between 1 and 100 entries');
    }

    const periodStart = parseOptionalDate(payload.periodStart, 'periodStart');
    const periodEnd = parseOptionalDate(payload.periodEnd, 'periodEnd');
    if (periodStart && periodEnd && periodStart > periodEnd) {
      throw serviceError('periodStart must be before or equal to periodEnd');
    }

    const items = [];
    for (let index = 0; index < payload.items.length; index += 1) {
      const input = payload.items[index] || {};
      const royaltyPerBookPaise = moneyToPaise(input.royaltyPerBook, `items[${index}].royaltyPerBook`);
      const royaltyPerBook = royaltyPerBookPaise / 100;
      const unitsSold = Number(input.unitsSold);
      if (!Number.isInteger(unitsSold) || unitsSold < 1) {
        throw serviceError(`items[${index}].unitsSold must be an integer greater than or equal to 1`);
      }

      let book;
      let bookTitle = String(input.bookTitle || '').trim();
      if (input.bookId) {
        if (!mongoose.isValidObjectId(input.bookId)) throw serviceError(`items[${index}].bookId is invalid`);
        book = await this.repository.findBookById(input.bookId);
        if (!book) throw serviceError(`items[${index}].book was not found`, 404);
        if (String(book.author) !== String(author._id)) {
          throw serviceError(`items[${index}].book does not belong to the selected author`);
        }
        bookTitle = book.title;
      }
      if (!bookTitle) throw serviceError(`items[${index}].bookTitle is required`);

      items.push({
        ...(book && { book: book._id }),
        bookTitle,
        royaltyPerBook: roundMoney(royaltyPerBook),
        unitsSold,
        totalRoyalty: (royaltyPerBookPaise * unitsSold) / 100,
      });
    }

    let replacementFor;
    if (payload.replacementFor) {
      if (!mongoose.isValidObjectId(payload.replacementFor)) {
        throw serviceError('replacementFor is invalid', 400, 'MANUAL_ROYALTY_INVALID_REPLACEMENT');
      }
      const original = await this.repository.findById(payload.replacementFor);
      if (!original) throw serviceError('Replacement statement was not found', 404, 'MANUAL_ROYALTY_REPLACEMENT_NOT_FOUND');
      if (String(original.author?._id || original.author) !== String(author._id)) {
        throw serviceError('Replacement statement belongs to another author', 409, 'MANUAL_ROYALTY_REPLACEMENT_AUTHOR_MISMATCH');
      }
      if (original.status !== 'VOID') {
        throw serviceError('Only a void statement can be replaced', 409, 'MANUAL_ROYALTY_REPLACEMENT_NOT_VOID');
      }
      replacementFor = original._id;
    }

    const actorId = actor._id || actor.id;
    const idempotencyKey = String(options.idempotencyKey || payload.idempotencyKey || '').trim() || undefined;
    if (idempotencyKey && idempotencyKey.length > 128) {
      throw serviceError('Idempotency-Key must not exceed 128 characters', 400, 'MANUAL_ROYALTY_INVALID_IDEMPOTENCY_KEY');
    }
    const canonicalRequest = {
      authorId: String(author._id),
      periodStart: periodStart?.toISOString() || null,
      periodEnd: periodEnd?.toISOString() || null,
      note: payload.note ? String(payload.note).trim() : null,
      replacementFor: replacementFor ? String(replacementFor) : null,
      items: items.map((item) => ({
        book: item.book ? String(item.book) : null,
        bookTitle: item.bookTitle,
        royaltyPerBook: item.royaltyPerBook,
        unitsSold: item.unitsSold,
        totalRoyalty: item.totalRoyalty
      }))
    };
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(canonicalRequest)).digest('hex');
    if (idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(actorId, idempotencyKey);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw serviceError('Idempotency-Key was already used for a different statement', 409, 'MANUAL_ROYALTY_IDEMPOTENCY_CONFLICT');
        }
        return this.repository.findById(existing._id);
      }
    }

    const statementData = {
      author: author._id,
      createdBy: actorId,
      idempotencyKey,
      requestHash,
      replacementFor,
      periodStart,
      periodEnd,
      note: payload.note ? String(payload.note).trim() : undefined,
      items,
      totalUnits: items.reduce((sum, item) => sum + item.unitsSold, 0),
      totalRoyalty: items.reduce((sum, item) => sum + Math.round(item.totalRoyalty * 100), 0) / 100,
      currency: 'INR',
      status: 'RECORDED',
    };
    let statement;
    try {
      statement = await this.repository.create(statementData);
    } catch (error) {
      if (error?.code !== 11000 || !idempotencyKey) throw error;
      const existing = await this.repository.findByIdempotencyKey(actorId, idempotencyKey);
      if (!existing || existing.requestHash !== requestHash) {
        throw serviceError('Idempotency-Key was already used for a different statement', 409, 'MANUAL_ROYALTY_IDEMPOTENCY_CONFLICT');
      }
      return this.repository.findById(existing._id);
    }
    logger.info('manual_royalty.created', {
      statementId: String(statement._id), authorId: String(author._id), actorId: String(actor._id || actor.id),
    });
    return this.repository.findById(statement._id);
  }

  async listAdmin(filters = {}) {
    const { page, limit, skip } = parsePage(filters);
    const query = {};
    if (filters.authorId) {
      if (!mongoose.isValidObjectId(filters.authorId)) throw serviceError('Invalid authorId');
      query.author = filters.authorId;
    }
    if (filters.status) {
      const status = String(filters.status).toUpperCase();
      if (!['RECORDED', 'VOID'].includes(status)) throw serviceError('status must be RECORDED or VOID');
      query.status = status;
    }
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = parseOptionalDate(filters.from, 'from');
      if (filters.to) query.createdAt.$lte = parseOptionalDate(filters.to, 'to');
      if (query.createdAt.$gte && query.createdAt.$lte && query.createdAt.$gte > query.createdAt.$lte) {
        throw serviceError('from must be before or equal to to', 400, 'MANUAL_ROYALTY_INVALID_DATE_RANGE');
      }
    }
    const result = await this.repository.list(query, { skip, limit });
    return { data: result.data, pagination: { total: result.total, page, limit, pages: Math.ceil(result.total / limit) } };
  }

  async listForAuthor(authorId, filters = {}) {
    const { page, limit, skip } = parsePage(filters);
    const result = await this.repository.listForAuthor(authorId, { skip, limit });
    return { data: result.data, pagination: { total: result.total, page, limit, pages: Math.ceil(result.total / limit) } };
  }

  async getStatement(id) {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Manual royalty statement not found', 404, 'MANUAL_ROYALTY_NOT_FOUND');
    const statement = await this.repository.findById(id);
    if (!statement) throw serviceError('Manual royalty statement not found', 404, 'MANUAL_ROYALTY_NOT_FOUND');
    return statement;
  }

  async voidStatement(id, reason, actor) {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Manual royalty statement not found', 404);
    const normalizedReason = String(reason || '').trim();
    if (!normalizedReason) throw serviceError('reason is required');
    const existing = await this.repository.findById(id);
    if (!existing) throw serviceError('Manual royalty statement not found', 404);
    if (existing.status === 'VOID') throw serviceError('Manual royalty statement is already void', 409);
    const statement = await this.repository.voidRecorded(id, {
      voidReason: normalizedReason,
      voidedAt: new Date(),
      voidedBy: actor._id || actor.id,
    });
    if (!statement) throw serviceError('Manual royalty statement could not be voided', 409);
    logger.info('manual_royalty.voided', {
      statementId: String(statement._id), actorId: String(actor._id || actor.id),
    });
    return statement;
  }
}

module.exports = new ManualRoyaltyService();
module.exports.ManualRoyaltyService = ManualRoyaltyService;
