const contentRepository = require('../repositories/contentRepository');
const logger = require('../utils/logger');

const PAGE_SECTION_JSON_FIELDS = [
  'homeWhyChooseJson', 'aboutValuesJson', 'aboutTeamJson', 'publishServicesJson',
  'publishStepsJson', 'guidelinesSectionsJson', 'guidelinesStepsJson',
  'royaltyScheduleJson', 'royaltyExamplesJson', 'royaltyFaqsJson', 'returnsStepsJson',
  'returnsEligibleJson', 'returnsNotEligibleJson', 'returnsFaqsJson',
  'privacySectionsJson', 'termsSectionsJson', 'careersBenefitsJson',
];
const JSON_LIST_FIELDS = ['packagesJson', 'faqsJson', ...PAGE_SECTION_JSON_FIELDS];
const MAX_JSON_FIELD_BYTES = 100 * 1024;
const FLAT_STRING_FIELDS = [
  'homeTitle', 'homeSubtitle', 'homeHeroCtaText', 'homeFeaturedTitle',
  'homeBestsellerTitle', 'homeCtaHeading', 'homeCtaSubtitle', 'homeCtaButtonText',
  'contactPhone', 'contactEmail', 'contactSupportEmail', 'contactAddressLine1',
  'contactAddressLine2', 'contactAddress', 'contactHours', 'careersEmail',
  'socialFacebook', 'socialTwitter', 'socialInstagram', 'socialLinkedin',
  'publishTitle', 'publishSubtitle', 'royaltySummary', 'authorGuidelinesText',
  'aboutTitle', 'aboutSubtitle', 'aboutStory', 'aboutMission', 'aboutVision',
  'announcementText', 'adminProfileImage',
];

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
  announcementActive: false,
  announcementText: '',
  homeTitle: 'You write, we print.\nYou dream, we publish',
  homeSubtitle: 'Explore inspiring books from talented authors.',
  homeHeroCtaText: '',
  homeFeaturedTitle: '',
  homeBestsellerTitle: '',
  homeCtaHeading: '',
  homeCtaSubtitle: '',
  homeCtaButtonText: '',
  contactSupportEmail: '',
  contactAddressLine1: '',
  contactAddressLine2: '',
  careersEmail: '',
  socialFacebook: '',
  socialTwitter: '',
  socialInstagram: '',
  socialLinkedin: '',
  publishTitle: 'Publish Your Book With Us',
  publishSubtitle: 'Transform your manuscript into a published book.',
  packagesJson: '[]',
  authorGuidelinesText: '',
  royaltySummary: '',
  ...Object.fromEntries(PAGE_SECTION_JSON_FIELDS.map((field) => [field, '[]'])),
  adminProfileImage: '',
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
  'announcementActive',
  ...FLAT_STRING_FIELDS,
  ...PAGE_SECTION_JSON_FIELDS,
  'faqsJson',
]);

const parseJsonList = (field, value) => {
  if (value === undefined) return undefined;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_JSON_FIELD_BYTES) {
    const sizeError = new Error(`${field} must not exceed 100 KB`);
    sizeError.statusCode = 400;
    throw sizeError;
  }
  try {
    const parsed = Array.isArray(value) ? value : JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return { parsed, serialized: JSON.stringify(parsed) };
  } catch {
    const validationError = new Error(`${field} must contain a valid JSON array`);
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

  if (payload.siteSettings?.siteContent !== undefined) {
    normalized.siteSettings.siteContent = {
      ...(current.siteSettings?.siteContent || {}),
      ...(payload.siteSettings.siteContent || {}),
    };
  }

  JSON_LIST_FIELDS.forEach((field) => {
    if (payload[field] === undefined) return;
    const value = parseJsonList(field, payload[field]);
    normalized[field] = value.serialized;
    if (field === 'faqsJson') normalized.faq = value.parsed;
  });

  const socialAliases = {
    socialFacebook: 'facebook', socialTwitter: 'twitter',
    socialInstagram: 'instagram', socialLinkedin: 'linkedin',
  };
  const suppliedSocials = Object.entries(socialAliases).filter(([field]) => payload[field] !== undefined);
  if (suppliedSocials.length > 0) {
    normalized.socialLinks = { ...(current.socialLinks || {}), ...(normalized.socialLinks || {}) };
    suppliedSocials.forEach(([field, target]) => { normalized.socialLinks[target] = payload[field]; });
  }

  if (payload.contactSupportEmail !== undefined) {
    normalized.siteSettings = { ...(current.siteSettings || {}), ...(normalized.siteSettings || {}), supportEmail: payload.contactSupportEmail };
  }

  if (payload.announcementActive !== undefined || payload.announcementText !== undefined) {
    const active = payload.announcementActive !== undefined
      ? payload.announcementActive === true
      : Boolean(current.announcementActive);
    const message = payload.announcementText !== undefined
      ? String(payload.announcementText)
      : String(current.announcementText || '');
    normalized.announcements = message ? [{ title: 'Announcement', message, active }] : [];
  }
  return normalized;
};

const withCompatibilityFields = (content, { includeAdmin = false } = {}) => ({
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
  contactSupportEmail: content.contactSupportEmail || content.siteSettings?.supportEmail || '',
  socialFacebook: content.socialFacebook || content.socialLinks?.facebook || '',
  socialTwitter: content.socialTwitter || content.socialLinks?.twitter || '',
  socialInstagram: content.socialInstagram || content.socialLinks?.instagram || '',
  socialLinkedin: content.socialLinkedin || content.socialLinks?.linkedin || '',
  ...(!includeAdmin && { adminProfileImage: undefined }),
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

  async getAdminContent() {
    const content = await this.repository.findGlobal({ includeAdmin: true });
    return withCompatibilityFields(content || defaultContent, { includeAdmin: true });
  }

  async updateGlobalContent(payload, actor) {
    const current = (await this.repository.findGlobal({ includeAdmin: true })) || defaultContent;
    const update = sanitizeContentUpdate(normalizeCompatibilityFields(payload, current));
    if (Object.keys(update).length === 0) {
      const error = new Error('At least one content field is required');
      error.statusCode = 400;
      throw error;
    }

    if (actor?._id || actor?.id) update.updatedBy = actor._id || actor.id;
    const content = await this.repository.upsertGlobal(update);
    logger.info('content.updated', {
      actorId: update.updatedBy || 'content-seed',
      fields: Object.keys(update).filter((field) => field !== 'updatedBy'),
    });
    const stored = content && typeof content.toObject === 'function' ? content.toObject() : content;
    if (update.adminProfileImage !== undefined) stored.adminProfileImage = update.adminProfileImage;
    return withCompatibilityFields(stored, { includeAdmin: true });
  }
}

module.exports = new ContentService();
module.exports.ContentService = ContentService;
