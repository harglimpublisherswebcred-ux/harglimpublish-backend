const mongoose = require('mongoose');
const spotlightRepository = require('../repositories/spotlightRepository');
const logger = require('../utils/logger');

const serviceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const pagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 24, 1), 60);
  return { page, limit, skip: (page - 1) * limit };
};

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (String(value).toLowerCase() === 'true') return true;
  if (String(value).toLowerCase() === 'false') return false;
  throw serviceError('isActive must be true or false');
};

class SpotlightService {
  constructor(repository = spotlightRepository) {
    this.repository = repository;
  }

  async listPublic(query = {}) {
    const pageInfo = pagination(query);
    const result = await this.repository.listPublic(pageInfo);
    return {
      data: result.data,
      pagination: {
        page: pageInfo.page,
        limit: pageInfo.limit,
        total: result.total,
        pages: Math.ceil(result.total / pageInfo.limit),
      },
    };
  }

  async listAdmin(filters = {}) {
    const pageInfo = pagination(filters);
    const query = {};
    const active = parseBoolean(filters.isActive);
    if (active !== undefined) query.isActive = active;
    if (filters.search || filters.q) {
      const escaped = String(filters.search || filters.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ author_name: regex }, { caption: regex }];
    }
    const result = await this.repository.listAdmin(query, pageInfo);
    return {
      data: result.data,
      pagination: {
        page: pageInfo.page,
        limit: pageInfo.limit,
        total: result.total,
        pages: Math.ceil(result.total / pageInfo.limit),
      },
    };
  }

  async normalizePayload(payload = {}, upload, { partial = false } = {}) {
    const data = {};
    if (!partial || payload.author_name !== undefined) {
      const name = String(payload.author_name || '').trim();
      if (!name) throw serviceError('author_name is required');
      if (name.length > 120) throw serviceError('author_name must not exceed 120 characters');
      data.author_name = name;
    }
    if (payload.caption !== undefined) {
      const caption = String(payload.caption || '').trim();
      if (caption.length > 500) throw serviceError('caption must not exceed 500 characters');
      data.caption = caption;
    }
    if (payload.sortOrder !== undefined) {
      const sortOrder = Number(payload.sortOrder);
      if (!Number.isFinite(sortOrder)) throw serviceError('sortOrder must be a finite number');
      data.sortOrder = sortOrder;
    }
    if (payload.isActive !== undefined) data.isActive = parseBoolean(payload.isActive);
    if (payload.authorId !== undefined) {
      if (!payload.authorId) {
        data.author = null;
      } else {
        if (!mongoose.isValidObjectId(payload.authorId)) throw serviceError('authorId is invalid');
        const author = await this.repository.findAuthorById(payload.authorId);
        if (!author) throw serviceError('Linked author was not found or is inactive', 404);
        data.author = author._id;
      }
    }
    if (upload) {
      data.image = upload.image;
      data.thumbnail = upload.thumbnail;
      data.imagePublicId = upload.publicId;
    }
    return data;
  }

  async create(payload, upload, actor) {
    if (!upload || !upload.image) throw serviceError('image is required');
    const data = await this.normalizePayload(payload, upload);
    const spotlight = await this.repository.create({ ...data, createdBy: actor._id || actor.id });
    logger.info('spotlight.created', { spotlightId: String(spotlight._id), actorId: String(actor._id || actor.id) });
    return spotlight;
  }

  async update(id, payload, upload, actor) {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Spotlight not found', 404);
    const existing = await this.repository.findById(id, { includePrivate: true });
    if (!existing) throw serviceError('Spotlight not found', 404);
    const data = await this.normalizePayload(payload, upload, { partial: true });
    if (Object.keys(data).length === 0) throw serviceError('At least one spotlight field is required');
    const updated = await this.repository.update(id, data);
    logger.info('spotlight.updated', { spotlightId: id, actorId: String(actor._id || actor.id) });
    return { spotlight: updated, replacedImagePublicId: upload ? existing.imagePublicId : null };
  }

  async archive(id, actor) {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Spotlight not found', 404);
    const updated = await this.repository.update(id, { isActive: false });
    if (!updated) throw serviceError('Spotlight not found', 404);
    logger.info('spotlight.archived', { spotlightId: id, actorId: String(actor._id || actor.id) });
    return updated;
  }
}

module.exports = new SpotlightService();
module.exports.SpotlightService = SpotlightService;
