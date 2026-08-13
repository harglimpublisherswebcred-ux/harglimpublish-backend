const mongoose = require('mongoose');

const authorAccessPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthorAccessPlan',
      required: true
    },
    planVersion: {
      type: Number,
      required: true
    },
    planNameSnapshot: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'INR'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

authorAccessPurchaseSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('AuthorAccessPurchase', authorAccessPurchaseSchema);
