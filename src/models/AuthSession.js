const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    lastUsedAt: {
      type: Date
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthSession'
    }
  },
  { timestamps: true }
);

authSessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthSession', authSessionSchema);

