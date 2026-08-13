const mongoose = require('mongoose');

const SETTLEMENT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  READY_FOR_APPROVAL: 'READY_FOR_APPROVAL',
  APPROVED: 'APPROVED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
});

const royaltySettlementItemSchema = new mongoose.Schema(
  {
    royaltySourceKey: {
      type: String,
      required: true
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
    orderNumber: {
      type: String,
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    bookTitleSnapshot: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPriceSnapshot: {
      type: Number,
      required: true,
      min: 0
    },
    grossBookRevenue: {
      type: Number,
      required: true,
      min: 0
    },
    royaltyPercentageSnapshot: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    royaltyAmount: {
      type: Number,
      required: true,
      min: 0
    },
    saleDate: {
      type: Date,
      required: true
    },
    eligibilityStatus: {
      type: String,
      default: 'SETTLEMENT_ELIGIBLE'
    }
  },
  { _id: true }
);

const settlementStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const royaltySettlementSchema = new mongoose.Schema(
  {
    settlementNumber: {
      type: String,
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
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: Object.values(SETTLEMENT_STATUS),
      default: SETTLEMENT_STATUS.DRAFT,
      index: true
    },
    grossBookRevenue: {
      type: Number,
      required: true,
      min: 0
    },
    totalRoyalty: {
      type: Number,
      required: true,
      min: 0
    },
    itemCount: {
      type: Number,
      required: true,
      min: 0
    },
    items: [royaltySettlementItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    finalizedAt: {
      type: Date
    },
    paidAt: {
      type: Date
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    },
    statusHistory: [settlementStatusHistorySchema]
  },
  {
    timestamps: true
  }
);

royaltySettlementSchema.index({ author: 1, status: 1, createdAt: -1 });

const RoyaltySettlement = mongoose.model('RoyaltySettlement', royaltySettlementSchema);

module.exports = RoyaltySettlement;
module.exports.SETTLEMENT_STATUS = SETTLEMENT_STATUS;
