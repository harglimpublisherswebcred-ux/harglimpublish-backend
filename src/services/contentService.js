const contentRepository = require('../repositories/contentRepository');
const logger = require('../utils/logger');

const defaultContent = {
  key: 'global',
  hero: {
    title: 'You write, we print. You dream, we publish',
    subtitle: 'Explore inspiring books from talented authors.',
    body: '',
  },
  about: { title: 'About Harglim Publishers', subtitle: '', body: '' },
  contact: { email: '', phone: '', address: '' },
  faq: [],
  footer: { title: 'Harglim Publishers', subtitle: '', body: '' },
  socialLinks: {},
  seo: { title: 'Harglim Publishers', description: '', keywords: [], image: '' },
  announcements: [],
  siteSettings: {
    siteName: 'Harglim Publishers',
    supportEmail: '',
    maintenanceMode: false,
  },
  homeTitle: 'You write, we print.\nYou dream, we publish',
  homeSubtitle: 'Explore inspiring books from talented authors.',
  publishTitle: 'Publish Your Book With Us',
  publishSubtitle: 'Transform your manuscript into a published book.',
  packagesJson: '[]',
};

const allowedTopLevelFields = new Set([
  'hero',
  'about',
  'contact',
  'faq',
  'footer',
  'socialLinks',
  'seo',
  'announcements',
  'siteSettings',
  'homeTitle',
  'homeSubtitle',
  'publishTitle',
  'publishSubtitle',
  'packagesJson',
]);

const sanitizeContentUpdate = (payload = {}) => {
  const sanitized = {};
  Object.keys(payload).forEach((key) => {
    if (allowedTopLevelFields.has(key)) sanitized[key] = payload[key];
  });
  return sanitized;
};

class ContentService {
  constructor(repository = contentRepository) {
    this.repository = repository;
  }

  async getGlobalContent() {
    const content = await this.repository.findGlobal();
    return content || defaultContent;
  }

  async updateGlobalContent(payload, actor) {
    const update = sanitizeContentUpdate(payload);
    if (Object.keys(update).length === 0) {
      const error = new Error('At least one content field is required');
      error.statusCode = 400;
      throw error;
    }

    update.updatedBy = actor?._id || actor?.id;
    const content = await this.repository.upsertGlobal(update);
    logger.info('content.updated', {
      actorId: update.updatedBy,
      fields: Object.keys(update).filter((field) => field !== 'updatedBy'),
    });
    return content;
  }
}

module.exports = new ContentService();
module.exports.ContentService = ContentService;