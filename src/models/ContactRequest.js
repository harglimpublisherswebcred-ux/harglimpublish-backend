const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please add a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Website contact request'
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'website'
    },
    status: {
      type: String,
      enum: ['NEW', 'REVIEWED', 'CLOSED'],
      default: 'NEW',
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

contactRequestSchema.index({ createdAt: -1 });
contactRequestSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
