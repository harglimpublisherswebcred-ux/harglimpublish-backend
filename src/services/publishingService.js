const publishingRepository = require('../repositories/publishingRepository');
const mongoose = require('mongoose');

const serviceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseBoolean = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw serviceError(`${fieldName} must be a boolean`);
};

class PublishingService {
  constructor(repository = publishingRepository) {
    this.repository = repository;
  }

  createPublishRequest(user, payload) {
    const { title, genre, wordCount, packageId, fileUrl } = payload;
    if (!title || !genre || !wordCount || !packageId || !fileUrl) {
      const error = new Error('All fields are required');
      error.statusCode = 400;
      throw error;
    }

    return this.repository.createPublishRequest({
      user: user._id,
      title,
      genre,
      wordCount,
      packageId,
      fileUrl
    });
  }

  listActivePackages() {
    return this.repository.listActivePackages();
  }

  listPackages(filters = {}) {
    return this.repository.listPackages({
      page: filters.page,
      limit: filters.limit,
      search: String(filters.search || filters.q || '').trim(),
      sort: filters.sort,
      isActive: parseBoolean(filters.isActive, 'isActive')
    });
  }

  async getPackage(id) {
    this.validateId(id);
    const publishPackage = await this.repository.findPackageById(id);
    if (!publishPackage) throw serviceError('Publish package not found', 404);
    return publishPackage;
  }

  async createPackage(payload = {}) {
    const data = this.preparePackagePayload(payload, true);
    const duplicate = await this.repository.findPackageByName(data.name);
    if (duplicate) throw serviceError('Publish package name already exists', 409);
    return this.repository.createPackage(data);
  }

  async updatePackage(id, payload = {}) {
    this.validateId(id);
    const current = await this.repository.findPackageById(id);
    if (!current) throw serviceError('Publish package not found', 404);

    const data = this.preparePackagePayload(payload, false);
    if (data.name) {
      const duplicate = await this.repository.findPackageByName(data.name, current._id);
      if (duplicate) throw serviceError('Publish package name already exists', 409);
    }

    return this.repository.updatePackage(current._id, data);
  }

  archivePackage(id) {
    return this.updatePackage(id, { isActive: false });
  }

  validateId(id) {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Invalid publish package id');
  }

  preparePackagePayload(payload, requireAll) {
    const allowed = ['name', 'description', 'price', 'features', 'isActive'];
    const hasRecognizedField = allowed.some((field) => payload[field] !== undefined);
    if (!hasRecognizedField) throw serviceError('At least one publish package field is required');

    if (requireAll && (!String(payload.name || '').trim() || !String(payload.description || '').trim() || payload.price === undefined)) {
      throw serviceError('name, description and price are required');
    }

    const data = {};
    if (payload.name !== undefined) {
      data.name = String(payload.name).trim();
      if (!data.name) throw serviceError('name is required');
    }
    if (payload.description !== undefined) {
      data.description = String(payload.description).trim();
      if (!data.description) throw serviceError('description is required');
    }
    if (payload.price !== undefined) {
      if (String(payload.price).trim() === '') throw serviceError('price must be a non-negative number');
      data.price = Number(payload.price);
      if (!Number.isFinite(data.price) || data.price < 0) throw serviceError('price must be a non-negative number');
    }
    if (payload.features !== undefined) {
      if (!Array.isArray(payload.features)) throw serviceError('features must be an array of strings');
      if (payload.features.some((feature) => typeof feature !== 'string')) {
        throw serviceError('features must be an array of strings');
      }
      data.features = payload.features.map((feature) => feature.trim()).filter(Boolean);
    }
    if (payload.isActive !== undefined) data.isActive = parseBoolean(payload.isActive, 'isActive');
    return data;
  }
}

module.exports = new PublishingService();
module.exports.PublishingService = PublishingService;
