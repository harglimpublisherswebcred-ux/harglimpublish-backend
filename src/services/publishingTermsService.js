const crypto = require('crypto');
const publishingTermsRepository = require('../repositories/publishingTermsRepository');
const contentRepository = require('../repositories/contentRepository');
const logger = require('../utils/logger');

class PublishingTermsError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'PublishingTermsError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const cleanVersion = () => String(process.env.PUBLISHING_TERMS_VERSION || '').trim() || null;

class PublishingTermsService {
  constructor({ repository = publishingTermsRepository, contents = contentRepository, serviceLogger = logger } = {}) {
    this.repository = repository;
    this.contentRepository = contents;
    this.logger = serviceLogger;
  }

  isEnforcementEnabled() {
    return parseBoolean(process.env.PUBLISHING_TERMS_ENFORCEMENT_ENABLED, false);
  }

  getConfiguration() {
    const version = cleanVersion();
    return {
      version,
      effectiveAt: process.env.PUBLISHING_TERMS_EFFECTIVE_AT || null,
      enforcementEnabled: this.isEnforcementEnabled()
    };
  }

  async getPublicTerms() {
    const configuration = this.getConfiguration();
    return {
      currentVersion: configuration.version,
      effectiveAt: configuration.effectiveAt,
      enforcementEnabled: configuration.enforcementEnabled
    };
  }

  async getStatus(user) {
    const configuration = this.getConfiguration();
    const latest = await this.repository.findLatestByUser(user._id || user.id);
    const current = configuration.version
      ? await this.repository.findByUserAndVersion(user._id || user.id, configuration.version)
      : null;
    const termsHash = configuration.version ? await this.getCurrentTermsHash() : null;
    const accepted = Boolean(current && current.termsHash === termsHash);

    return {
      currentVersion: configuration.version,
      effectiveAt: configuration.effectiveAt,
      enforcementEnabled: configuration.enforcementEnabled,
      accepted,
      requiresAcceptance: configuration.enforcementEnabled && !accepted,
      acceptedVersion: current?.version || latest?.version || null,
      acceptedAt: current?.acceptedAt || latest?.acceptedAt || null
    };
  }

  async accept(user, payload = {}, context = {}, options = {}) {
    const configuration = this.getConfiguration();
    if (!configuration.version) {
      throw new PublishingTermsError(
        'Publishing terms version is not configured',
        'PUBLISHING_TERMS_NOT_CONFIGURED',
        503
      );
    }
    if (String(payload.version || '').trim() !== configuration.version) {
      throw new PublishingTermsError(
        'Publishing terms version is outdated. Refresh the terms and accept the current version.',
        'PUBLISHING_TERMS_VERSION_MISMATCH',
        409
      );
    }

    const userId = user._id || user.id;
    const termsHash = await this.getCurrentTermsHash();
    const existing = await this.repository.findByUserAndVersion(userId, configuration.version, {
      session: options.session,
      lean: true
    });
    if (existing) {
      if (existing.termsHash !== termsHash) {
        throw new PublishingTermsError(
          'Publishing terms content changed without a version change',
          'PUBLISHING_TERMS_VERSION_CONFLICT',
          409
        );
      }
      return existing;
    }

    try {
      const acceptance = await this.repository.create({
        user: userId,
        version: configuration.version,
        termsHash,
        acceptedAt: new Date(),
        ipAddress: context.ipAddress ? String(context.ipAddress).slice(0, 100) : undefined,
        userAgent: context.userAgent ? String(context.userAgent).slice(0, 500) : undefined
      }, options);
      this.logger.info('publishing_terms.accepted', {
        userId: String(userId),
        version: configuration.version
      });
      return acceptance;
    } catch (error) {
      if (error?.code === 11000) {
        return this.repository.findByUserAndVersion(userId, configuration.version, {
          session: options.session,
          lean: true
        });
      }
      throw error;
    }
  }

  async assertAccepted(user, options = {}) {
    if (!this.isEnforcementEnabled() || user.role === 'admin') return null;
    const version = cleanVersion();
    if (!version) {
      throw new PublishingTermsError(
        'Publishing terms enforcement is enabled without a configured version',
        'PUBLISHING_TERMS_NOT_CONFIGURED',
        503
      );
    }
    const acceptance = await this.repository.findByUserAndVersion(user._id || user.id, version, {
      session: options.session,
      lean: true
    });
    const termsHash = await this.getCurrentTermsHash();
    if (!acceptance || acceptance.termsHash !== termsHash) {
      throw new PublishingTermsError(
        'Accept the current publishing terms before submitting a manuscript',
        'PUBLISHING_TERMS_ACCEPTANCE_REQUIRED',
        403
      );
    }
    return acceptance;
  }

  async getCurrentTermsHash() {
    const content = await this.contentRepository.findGlobal();
    const payload = {
      termsSectionsJson: content?.termsSectionsJson || '[]',
      nestedTermsSectionsJson: content?.siteSettings?.siteContent?.termsSectionsJson || null,
      authorGuidelinesText: content?.authorGuidelinesText || ''
    };
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }
}

module.exports = new PublishingTermsService();
module.exports.PublishingTermsService = PublishingTermsService;
module.exports.PublishingTermsError = PublishingTermsError;
