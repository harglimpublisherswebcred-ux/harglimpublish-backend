const mongoose = require('mongoose');

const AUTH_PROVIDERS = Object.freeze({
  GOOGLE: 'GOOGLE'
});

const authIdentitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      required: true,
      uppercase: true
    },
    providerSubject: {
      type: String,
      required: true,
      trim: true
    },
    providerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    profilePicture: {
      type: String,
      default: ''
    },
    metadata: {
      type: Object,
      default: {}
    },
    lastLoginAt: {
      type: Date
    }
  },
  { timestamps: true }
);

authIdentitySchema.index({ provider: 1, providerSubject: 1 }, { unique: true });
authIdentitySchema.index({ user: 1, provider: 1 });

module.exports = mongoose.model('AuthIdentity', authIdentitySchema);
module.exports.AUTH_PROVIDERS = AUTH_PROVIDERS;
