const mongoose = require('mongoose');

const pageSectionJsonFields = [
  'homeWhyChooseJson',
  'aboutValuesJson',
  'aboutTeamJson',
  'publishServicesJson',
  'publishStepsJson',
  'guidelinesSectionsJson',
  'guidelinesStepsJson',
  'royaltyScheduleJson',
  'royaltyExamplesJson',
  'royaltyFaqsJson',
  'returnsStepsJson',
  'returnsEligibleJson',
  'returnsNotEligibleJson',
  'returnsFaqsJson',
  'privacySectionsJson',
  'termsSectionsJson',
  'careersBenefitsJson',
];

const pageSectionSchemaFields = Object.fromEntries(
  pageSectionJsonFields.map((field) => [field, { type: String, default: '[]' }])
);

const localizedTextSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    body: { type: String, default: '' },
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
      immutable: true,
      index: true,
    },
    hero: { type: localizedTextSchema, default: () => ({}) },
    about: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      body: { type: String, default: '' },
      mission: { type: String, default: '' },
      vision: { type: String, default: '' },
    },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      hours: { type: String, default: '' },
    },
    faq: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    footer: { type: localizedTextSchema, default: () => ({}) },
    socialLinks: {
      website: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: [{ type: String }],
      image: { type: String, default: '' },
    },
    announcements: [
      {
        title: { type: String, required: true },
        message: { type: String, required: true },
        active: { type: Boolean, default: true },
        startsAt: { type: Date },
        endsAt: { type: Date },
      },
    ],
    siteSettings: {
      siteName: { type: String, default: 'Harglim Publishers' },
      supportEmail: { type: String, default: '' },
      maintenanceMode: { type: Boolean, default: false },
      siteContent: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    announcementActive: { type: Boolean, default: false },
    announcementText: { type: String, default: '' },
    homeTitle: { type: String, default: '' },
    homeSubtitle: { type: String, default: '' },
    homeHeroCtaText: { type: String, default: '' },
    homeFeaturedTitle: { type: String, default: '' },
    homeBestsellerTitle: { type: String, default: '' },
    homeCtaHeading: { type: String, default: '' },
    homeCtaSubtitle: { type: String, default: '' },
    homeCtaButtonText: { type: String, default: '' },
    contactSupportEmail: { type: String, default: '' },
    contactAddressLine1: { type: String, default: '' },
    contactAddressLine2: { type: String, default: '' },
    careersEmail: { type: String, default: '' },
    socialFacebook: { type: String, default: '' },
    socialTwitter: { type: String, default: '' },
    socialInstagram: { type: String, default: '' },
    socialLinkedin: { type: String, default: '' },
    publishTitle: { type: String, default: '' },
    publishSubtitle: { type: String, default: '' },
    packagesJson: { type: String, default: '' },
    authorGuidelinesText: { type: String, default: '' },
    royaltySummary: { type: String, default: '' },
    ...pageSectionSchemaFields,
    adminProfileImage: { type: String, default: '', select: false },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

module.exports = mongoose.model('Content', contentSchema);
module.exports.PAGE_SECTION_JSON_FIELDS = pageSectionJsonFields;
