const mongoose = require('mongoose');

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
    about: { type: localizedTextSchema, default: () => ({}) },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
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
    },
    homeTitle: { type: String, default: '' },
    homeSubtitle: { type: String, default: '' },
    publishTitle: { type: String, default: '' },
    publishSubtitle: { type: String, default: '' },
    packagesJson: { type: String, default: '' },
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