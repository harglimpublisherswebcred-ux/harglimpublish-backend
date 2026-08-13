const mongoose = require('mongoose');

const authorAccessPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a plan name'],
      trim: true,
      default: 'Author Dashboard Access'
    },
    description: {
      type: String,
      trim: true,
      default: 'One-time author dashboard operational access plan'
    },
    amount: {
      type: Number,
      required: [true, 'Please add a plan amount'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      default: 'DRAFT'
    },
    version: {
      type: Number,
      default: 1
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    activatedAt: {
      type: Date
    },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

authorAccessPlanSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'active_plan_unique_idx' }
);

module.exports = mongoose.model('AuthorAccessPlan', authorAccessPlanSchema);
