const mongoose = require('mongoose');

const publishingTermsAcceptanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true
    },
    version: {
      type: String,
      required: true,
      trim: true,
      immutable: true
    },
    termsHash: {
      type: String,
      required: true,
      immutable: true
    },
    acceptedAt: {
      type: Date,
      required: true,
      immutable: true
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
      immutable: true
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      immutable: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

publishingTermsAcceptanceSchema.index({ user: 1, version: 1 }, { unique: true });
publishingTermsAcceptanceSchema.index({ version: 1, acceptedAt: -1 });

module.exports = mongoose.model('PublishingTermsAcceptance', publishingTermsAcceptanceSchema);
