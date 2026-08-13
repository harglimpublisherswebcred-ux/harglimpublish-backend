const royaltySettlementRepository = require('../repositories/royaltySettlementRepository');
const User = require('../models/User');
const { SETTLEMENT_STATUS } = require('../models/RoyaltySettlement');
const { PAYOUT_STATUS } = require('../models/RoyaltyPayout');

const serviceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const roundMoney = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

class RoyaltySettlementService {
  constructor(repository = royaltySettlementRepository) {
    this.repository = repository;
  }

  async previewSettlement(authorId, { from, to } = {}) {
    const author = await User.findById(authorId);
    if (!author || author.role !== 'author') {
      throw serviceError('Author not found', 404);
    }

    const { eligibleItems, excludedItems } = await this.repository.findEligibleOrderItemsForAuthor(authorId, { from, to });

    const totalGross = eligibleItems.reduce((sum, item) => sum + item.grossBookRevenue, 0);
    const totalRoyalty = eligibleItems.reduce((sum, item) => sum + item.royaltyAmount, 0);

    return {
      author: {
        _id: author._id,
        name: author.name,
        email: author.email
      },
      period: {
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null
      },
      eligible: {
        itemCount: eligibleItems.length,
        grossBookRevenue: roundMoney(totalGross),
        totalRoyalty: roundMoney(totalRoyalty),
        items: eligibleItems
      },
      excluded: excludedItems
    };
  }

  async createDraftSettlement(adminUser, { authorId, periodStart, periodEnd } = {}) {
    if (!authorId || !periodStart || !periodEnd) {
      throw serviceError('authorId, periodStart, and periodEnd are required', 400);
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      throw serviceError('Invalid period date range', 400);
    }

    const preview = await this.previewSettlement(authorId, { from: start, to: end });

    if (preview.eligible.itemCount === 0) {
      throw serviceError('No eligible sales found for the specified period', 400);
    }

    const dateTag = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 8);
    const randomTag = Math.floor(1000 + Math.random() * 9000);
    const settlementNumber = `SETTLE-${dateTag}-${randomTag}`;

    const settlementData = {
      settlementNumber,
      author: authorId,
      periodStart: start,
      periodEnd: end,
      currency: 'INR',
      status: SETTLEMENT_STATUS.DRAFT,
      grossBookRevenue: preview.eligible.grossBookRevenue,
      totalRoyalty: preview.eligible.totalRoyalty,
      itemCount: preview.eligible.itemCount,
      items: preview.eligible.items,
      createdBy: adminUser._id || adminUser.id,
      statusHistory: [
        {
          status: SETTLEMENT_STATUS.DRAFT,
          changedBy: adminUser._id || adminUser.id,
          reason: 'Created draft settlement batch'
        }
      ]
    };

    return this.repository.createSettlement(settlementData);
  }

  async approveSettlement(adminUser, settlementId) {
    const settlement = await this.repository.findSettlementById(settlementId);
    if (!settlement) {
      throw serviceError('Settlement not found', 404);
    }

    if (![SETTLEMENT_STATUS.DRAFT, SETTLEMENT_STATUS.READY_FOR_APPROVAL].includes(settlement.status)) {
      throw serviceError(`Settlement cannot be approved in its current state (${settlement.status})`, 400);
    }

    // Atomically claim source keys at DB level
    await this.repository.claimSourceKeys(settlement._id, settlement.author._id || settlement.author, settlement.items);

    const now = new Date();
    settlement.status = SETTLEMENT_STATUS.APPROVED;
    settlement.approvedBy = adminUser._id || adminUser.id;
    settlement.approvedAt = now;
    settlement.finalizedAt = now;
    settlement.statusHistory.push({
      status: SETTLEMENT_STATUS.APPROVED,
      changedBy: adminUser._id || adminUser.id,
      reason: 'Approved and finalized settlement batch'
    });

    await settlement.save();
    return settlement;
  }

  async markPaid(adminUser, settlementId, { paymentMethod = 'MANUAL_BANK_TRANSFER', transactionReference, notes, paidAt } = {}) {
    if (!transactionReference || typeof transactionReference !== 'string' || !transactionReference.trim()) {
      throw serviceError('Transaction reference is required to mark settlement as paid', 400);
    }

    const settlement = await this.repository.findSettlementById(settlementId);
    if (!settlement) {
      throw serviceError('Settlement not found', 404);
    }

    if (settlement.status === SETTLEMENT_STATUS.PAID) {
      throw serviceError('Settlement has already been paid', 400);
    }

    if (![SETTLEMENT_STATUS.APPROVED, SETTLEMENT_STATUS.PAYMENT_PENDING].includes(settlement.status)) {
      throw serviceError(`Settlement must be APPROVED before marking paid (current: ${settlement.status})`, 400);
    }

    const existingPayout = await this.repository.findPayoutBySettlementId(settlement._id);
    if (existingPayout && existingPayout.status === PAYOUT_STATUS.PAID) {
      throw serviceError('Payout has already been recorded for this settlement', 400);
    }

    const now = paidAt ? new Date(paidAt) : new Date();
    const dateTag = now.toISOString().replace(/[-:T.]/g, '').slice(0, 8);
    const randomTag = Math.floor(1000 + Math.random() * 9000);
    const payoutNumber = `POUT-${dateTag}-${randomTag}`;

    // Server-owned totalRoyalty amount
    const payoutData = {
      payoutNumber,
      settlement: settlement._id,
      author: settlement.author._id || settlement.author,
      amount: settlement.totalRoyalty,
      currency: settlement.currency || 'INR',
      status: PAYOUT_STATUS.PAID,
      paymentMethod,
      transactionReference: transactionReference.trim(),
      paidAt: now,
      recordedBy: adminUser._id || adminUser.id,
      notes: notes ? notes.trim() : ''
    };

    const payout = await this.repository.createPayout(payoutData);

    settlement.status = SETTLEMENT_STATUS.PAID;
    settlement.paidAt = now;
    settlement.statusHistory.push({
      status: SETTLEMENT_STATUS.PAID,
      changedBy: adminUser._id || adminUser.id,
      reason: `Recorded manual payout completion (Ref: ${transactionReference.trim()})`
    });

    await settlement.save();

    return { settlement, payout };
  }

  async cancelSettlement(adminUser, settlementId, { reason = 'Cancelled by admin' } = {}) {
    const settlement = await this.repository.findSettlementById(settlementId);
    if (!settlement) {
      throw serviceError('Settlement not found', 404);
    }

    if (settlement.status === SETTLEMENT_STATUS.PAID) {
      throw serviceError('Financial history cannot be deleted or cancelled once paid', 400);
    }

    if ([SETTLEMENT_STATUS.APPROVED, SETTLEMENT_STATUS.PAYMENT_PENDING].includes(settlement.status)) {
      await this.repository.removeClaimsForSettlement(settlement._id);
    }

    settlement.status = SETTLEMENT_STATUS.CANCELLED;
    settlement.cancelledBy = adminUser._id || adminUser.id;
    settlement.cancelledAt = new Date();
    settlement.cancellationReason = reason;
    settlement.statusHistory.push({
      status: SETTLEMENT_STATUS.CANCELLED,
      changedBy: adminUser._id || adminUser.id,
      reason
    });

    await settlement.save();
    return settlement;
  }

  async getSettlementDetail(settlementId, actor) {
    const settlement = await this.repository.findSettlementById(settlementId);
    if (!settlement) {
      throw serviceError('Settlement not found', 404);
    }

    const actorId = String(actor._id || actor.id);
    const authorId = String(settlement.author._id || settlement.author);

    if (actorId !== authorId && actor.role !== 'admin') {
      throw serviceError('Not authorized to view this settlement', 403);
    }

    let payout = null;
    if (settlement.status === SETTLEMENT_STATUS.PAID) {
      payout = await this.repository.findPayoutBySettlementId(settlement._id);
    }

    return { settlement, payout };
  }

  async getAuthorSettlements(authorId, actor, { page = 1, limit = 10 } = {}) {
    const actorId = String(actor._id || actor.id);
    if (actorId !== String(authorId) && actor.role !== 'admin') {
      throw serviceError('Not authorized to access settlement history for this author', 403);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter = { author: authorId };
    const { data, total } = await this.repository.findSettlements(filter, { skip, limit: limitNum });

    return {
      data,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    };
  }

  async listSettlementsForAdmin(query = {}) {
    const { page = 1, limit = 10, authorId, status } = query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (authorId) filter.author = authorId;
    if (status) filter.status = status;

    const { data, total } = await this.repository.findSettlements(filter, { skip, limit: limitNum });

    return {
      data,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    };
  }

  async reconcileSettlements() {
    const { data: allSettlements } = await this.repository.findSettlements({}, { limit: 10000 });
    const discrepancies = [];

    for (const s of allSettlements) {
      const calculatedTotal = roundMoney(s.items.reduce((sum, i) => sum + (i.royaltyAmount || 0), 0));
      if (calculatedTotal !== s.totalRoyalty) {
        discrepancies.push({
          type: 'SETTLEMENT_TOTAL_MISMATCH',
          settlementId: s._id,
          settlementNumber: s.settlementNumber,
          recordedTotal: s.totalRoyalty,
          calculatedTotal
        });
      }

      if (s.status === SETTLEMENT_STATUS.PAID) {
        const payout = await this.repository.findPayoutBySettlementId(s._id);
        if (!payout) {
          discrepancies.push({
            type: 'MISSING_PAYOUT_RECORD',
            settlementId: s._id,
            settlementNumber: s.settlementNumber
          });
        } else if (payout.amount !== s.totalRoyalty) {
          discrepancies.push({
            type: 'PAYOUT_AMOUNT_MISMATCH',
            settlementId: s._id,
            settlementNumber: s.settlementNumber,
            settlementTotal: s.totalRoyalty,
            payoutAmount: payout.amount
          });
        }
      }
    }

    return {
      totalEvaluated: allSettlements.length,
      discrepancyCount: discrepancies.length,
      discrepancies
    };
  }
}

module.exports = new RoyaltySettlementService();
module.exports.RoyaltySettlementService = RoyaltySettlementService;
