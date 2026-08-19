const { URL } = require('url');
const repository = require('../repositories/authorApplicationRepository');

class AuthorApplicationError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

const allowedStatuses = new Set(['pending', 'approved', 'rejected']);

const optionalString = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const validatePortfolioUrl = (url) => {
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw new AuthorApplicationError('portfolioUrl must be a valid URL', 400);
  }
};

class AuthorApplicationService {
  constructor(repo = repository) {
    this.repository = repo;
  }

  async submit(user, payload = {}) {
    const existing = await this.repository.findByUser(user._id);
    if (existing && ['pending', 'approved'].includes(existing.status)) {
      throw new AuthorApplicationError('Author application already exists', 409);
    }

    const data = this.normalizePayload(payload);
    if (existing && existing.status === 'rejected') {
      return this.repository.updateById(existing._id, {
        ...data,
        status: 'pending',
        reviewedBy: undefined,
        reviewedAt: undefined
      });
    }

    return this.repository.create({
      ...data,
      user: user._id,
      status: 'pending'
    });
  }

  async getMyApplication(user) {
    const application = await this.repository.findByUser(user._id);
    if (!application) {
      throw new AuthorApplicationError('Author application not found', 404);
    }
    return application;
  }

  async list(filters = {}) {
    if (filters.status && !allowedStatuses.has(filters.status)) {
      throw new AuthorApplicationError('Invalid application status', 400);
    }
    return this.repository.list(filters);
  }

  async updateStatus(applicationId, status, admin) {
    if (!allowedStatuses.has(status) || status === 'pending') {
      throw new AuthorApplicationError('Status must be approved or rejected', 400);
    }

    const application = await this.repository.findById(applicationId);
    if (!application) {
      throw new AuthorApplicationError('Author application not found', 404);
    }

    const updated = await this.repository.updateById(applicationId, {
      status,
      reviewedBy: admin._id,
      reviewedAt: new Date()
    });

    if (status === 'approved') {
      await this.repository.updateUserRole(application.user._id, 'author');
    } else if (status === 'rejected' && application.user.role === 'author') {
      await this.repository.updateUserRole(application.user._id, 'reader');
    }

    return this.repository.findById(updated._id);
  }

  normalizePayload(payload = {}) {
    const data = {
      penName: optionalString(payload.penName),
      bio: optionalString(payload.bio),
      portfolioUrl: optionalString(payload.portfolioUrl),
      experience: optionalString(payload.experience)
    };
    validatePortfolioUrl(data.portfolioUrl);
    return data;
  }
}

module.exports = new AuthorApplicationService();
module.exports.AuthorApplicationService = AuthorApplicationService;
module.exports.AuthorApplicationError = AuthorApplicationError;

