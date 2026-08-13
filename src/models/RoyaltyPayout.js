const mongoose = require('mongoose');

const PAYOUT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
});

const royaltyPayoutSchema = new mongoose.Schema(
  {
    payoutNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    settlement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoyaltySettlement',
      required: true,
      unique: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: Object.values(PAYOUT_STATUS),
      default: PAYOUT_STATUS.PENDING,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['MANUAL_BANK_TRANSFER', 'MANUAL_UPI', 'CHEQUE', 'OTHER'],
      default: 'MANUAL_BANK_TRANSFER'
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true
    },
    paidAt: {
      type: Date,
      required: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

royaltyPayoutSchema.index({ author: 1, createdAt: -1 });

const RoyaltyPayout = mongoose.model('RoyaltyPayout', royaltyPayoutSchema);

module.exports = RoyaltyPayout;
module.exports.PAYOUT_STATUS = PAYOUT_STATUS;
