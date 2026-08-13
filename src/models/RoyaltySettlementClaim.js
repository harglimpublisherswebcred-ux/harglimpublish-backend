const mongoose = require('mongoose');

const royaltySettlementClaimSchema = new mongoose.Schema(
  {
    royaltySourceKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    settlement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoyaltySettlement',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    claimedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['CLAIMED', 'PAID'],
      default: 'CLAIMED'
    }
  },
  {
    timestamps: true
  }
);

royaltySettlementClaimSchema.index({ author: 1, createdAt: -1 });

const RoyaltySettlementClaim = mongoose.model('RoyaltySettlementClaim', royaltySettlementClaimSchema);

module.exports = RoyaltySettlementClaim;
