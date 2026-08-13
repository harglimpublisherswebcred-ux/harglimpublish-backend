const mongoose = require('mongoose');

const authorAccessEntitlementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    feature: {
      type: String,
      enum: ['AUTHOR_DASHBOARD'],
      default: 'AUTHOR_DASHBOARD',
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      required: true,
      index: true
    },
    source: {
      type: String,
      enum: ['PURCHASE', 'ADMIN_GRANT'],
      required: true
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthorAccessPurchase'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revokedAt: {
      type: Date
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revocationReason: {
      type: String,
      default: ''
    },
    restoredAt: {
      type: Date
    },
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

authorAccessEntitlementSchema.index({ user: 1, feature: 1 }, { unique: true });

module.exports = mongoose.model('AuthorAccessEntitlement', authorAccessEntitlementSchema);
