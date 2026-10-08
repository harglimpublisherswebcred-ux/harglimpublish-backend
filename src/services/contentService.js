const contentRepository = require('../repositories/contentRepository');
const logger = require('../utils/logger');

const defaultContent = {
  key: 'global',
  hero: {
    title: 'You write, we print. You dream, we publish',
    subtitle: 'Explore inspiring books from talented authors.',
    body: '',
  },
  about: { title: 'About Harglim Publishers', subtitle: '', body: '', mission: '', vision: '' },
  contact: { email: '', phone: '', address: '', hours: '' },
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
  authorGuidelinesText: '',
  royaltySummary: '',
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
  'authorGuidelinesText',
  'royaltySummary',
]);

const parseFaqCompatibility = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch {
    const validationError = new Error('faqsJson must contain a valid JSON array');
    validationError.statusCode = 400;
    throw validationError;
  }
};

const normalizeCompatibilityFields = (payload = {}, current = defaultContent) => {
  const normalized = { ...payload };
  const aliases = {
    about: {
      aboutTitle: 'title',
      aboutSubtitle: 'subtitle',
      aboutStory: 'body',
      aboutMission: 'mission',
      aboutVision: 'vision',
    },
    contact: {
      contactEmail: 'email',
      contactPhone: 'phone',
      contactAddress: 'address',
      contactHours: 'hours',
    },
  };

  Object.entries(aliases).forEach(([group, groupAliases]) => {
    const supplied = Object.entries(groupAliases).filter(([alias]) => payload[alias] !== undefined);
    if (payload[group] === undefined && supplied.length === 0) return;
    normalized[group] = { ...(current[group] || {}), ...(payload[group] || {}) };
    supplied.forEach(([alias, field]) => {
      normalized[group][field] = payload[alias];
    });
  });

  ['hero', 'footer', 'socialLinks', 'seo', 'siteSettings'].forEach((group) => {
    if (payload[group] !== undefined) normalized[group] = { ...(current[group] || {}), ...payload[group] };
  });

  if (payload.faqsJson !== undefined) normalized.faq = parseFaqCompatibility(payload.faqsJson);
  return normalized;
};

const withCompatibilityFields = (content) => ({
  ...content,
  aboutTitle: content.about?.title || '',
  aboutSubtitle: content.about?.subtitle || '',
  aboutStory: content.about?.body || '',
  aboutMission: content.about?.mission || '',
  aboutVision: content.about?.vision || '',
  contactEmail: content.contact?.email || '',
  contactPhone: content.contact?.phone || '',
  contactAddress: content.contact?.address || '',
  contactHours: content.contact?.hours || '',
  faqsJson: JSON.stringify(content.faq || []),
});

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
    return withCompatibilityFields(content || defaultContent);
  }

  async updateGlobalContent(payload, actor) {
    const current = (await this.repository.findGlobal()) || defaultContent;
    const update = sanitizeContentUpdate(normalizeCompatibilityFields(payload, current));
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
    return withCompatibilityFields(content);
  }
}

module.exports = new ContentService();
module.exports.ContentService = ContentService;
