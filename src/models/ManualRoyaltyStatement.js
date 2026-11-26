const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  bookTitle: { type: String, required: true, trim: true },
  royaltyPerBook: { type: Number, required: true, min: 0 },
  unitsSold: { type: Number, required: true, min: 1 },
  totalRoyalty: { type: Number, required: true, min: 0 },
}, { _id: true });

const manualRoyaltyStatementSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idempotencyKey: { type: String, trim: true, maxlength: 128, immutable: true, select: false },
  requestHash: { type: String, select: false, immutable: true },
  replacementFor: { type: mongoose.Schema.Types.ObjectId, ref: 'ManualRoyaltyStatement', immutable: true },
  periodStart: Date,
  periodEnd: Date,
  note: { type: String, trim: true, maxlength: 2000 },
  items: {
    type: [itemSchema],
    required: true,
    validate: {
      validator: (items) => items.length >= 1 && items.length <= 100,
      message: 'items must contain between 1 and 100 entries',
    },
  },
  totalUnits: { type: Number, required: true, min: 1 },
  totalRoyalty: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', enum: ['INR'] },
  status: { type: String, default: 'RECORDED', enum: ['RECORDED', 'VOID'], index: true },
  voidReason: { type: String, trim: true, maxlength: 500 },
  voidedAt: Date,
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

manualRoyaltyStatementSchema.index({ author: 1, status: 1, createdAt: -1 });
manualRoyaltyStatementSchema.index({ createdAt: -1 });
manualRoyaltyStatementSchema.index({ periodStart: 1, periodEnd: 1 });
manualRoyaltyStatementSchema.index(
  { createdBy: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
manualRoyaltyStatementSchema.index({ replacementFor: 1 }, { sparse: true });

module.exports = mongoose.model('ManualRoyaltyStatement', manualRoyaltyStatementSchema);
