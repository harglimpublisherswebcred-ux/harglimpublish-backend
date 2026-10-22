const mongoose = require('mongoose');
const manualRoyaltyRepository = require('../repositories/manualRoyaltyRepository');
const logger = require('../utils/logger');
const { roundMoney } = require('../utils/royaltyCalculation');

const serviceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

  async createStatement(payload = {}, actor) {
    if (!mongoose.isValidObjectId(payload.authorId)) throw serviceError('Invalid authorId');
    const author = await this.repository.findAuthorById(payload.authorId);
    if (!author) throw serviceError('Author not found', 404);
    if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 100) {
      throw serviceError('items must contain between 1 and 100 entries');
    }

    const periodStart = payload.periodStart ? new Date(payload.periodStart) : undefined;
    const periodEnd = payload.periodEnd ? new Date(payload.periodEnd) : undefined;
    if (periodStart && Number.isNaN(periodStart.getTime())) throw serviceError('periodStart must be a valid date');
    if (periodEnd && Number.isNaN(periodEnd.getTime())) throw serviceError('periodEnd must be a valid date');
    if (periodStart && periodEnd && periodStart > periodEnd) {
      throw serviceError('periodStart must be before or equal to periodEnd');
    }

    const items = [];
    for (let index = 0; index < payload.items.length; index += 1) {
      const input = payload.items[index] || {};
      const royaltyPerBook = Number(input.royaltyPerBook);
      const unitsSold = Number(input.unitsSold);
      if (!Number.isFinite(royaltyPerBook) || royaltyPerBook <= 0) {
        throw serviceError(`items[${index}].royaltyPerBook must be greater than 0`);
      }
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
        totalRoyalty: roundMoney(royaltyPerBook * unitsSold),
      });
    }

    const statement = await this.repository.create({
      author: author._id,
      createdBy: actor._id || actor.id,
      periodStart,
      periodEnd,
      note: payload.note ? String(payload.note).trim() : undefined,
      items,
      totalUnits: items.reduce((sum, item) => sum + item.unitsSold, 0),
      totalRoyalty: roundMoney(items.reduce((sum, item) => sum + item.totalRoyalty, 0)),
      currency: 'INR',
      status: 'RECORDED',
    });
    logger.info('manual_royalty.created', {
      statementId: String(statement._id), authorId: String(author._id), actorId: String(actor._id || actor.id),
    });
    return statement;
  }

  async listAdmin(filters = {}) {
    const { page, limit, skip } = parsePage(filters);
    const query = {};
    if (filters.authorId) {
      if (!mongoose.isValidObjectId(filters.authorId)) throw serviceError('Invalid authorId');
      query.author = filters.authorId;
    }
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }
    const result = await this.repository.list(query, { skip, limit });
    return { data: result.data, pagination: { total: result.total, page, limit, pages: Math.ceil(result.total / limit) } };
  }

  async listForAuthor(authorId, filters = {}) {
    const { page, limit, skip } = parsePage(filters);
    const result = await this.repository.list({ author: authorId, status: 'RECORDED' }, { skip, limit });
    return { data: result.data, pagination: { total: result.total, page, limit, pages: Math.ceil(result.total / limit) } };
  }

  async getStatement(id) {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Manual royalty statement not found', 404);
    const statement = await this.repository.findById(id);
    if (!statement) throw serviceError('Manual royalty statement not found', 404);
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
