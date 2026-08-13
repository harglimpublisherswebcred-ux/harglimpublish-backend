const Order = require('../models/Order');
const Book = require('../models/Book');
const RoyaltySettlement = require('../models/RoyaltySettlement');
const RoyaltySettlementClaim = require('../models/RoyaltySettlementClaim');
const RoyaltyPayout = require('../models/RoyaltyPayout');

const roundMoney = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

class RoyaltySettlementRepository {
  async getExistingClaimedSourceKeys(authorId) {
    const claims = await RoyaltySettlementClaim.find({ author: authorId }).select('royaltySourceKey').lean();
    return new Set(claims.map((c) => c.royaltySourceKey));
  }

  async findEligibleOrderItemsForAuthor(authorId, { from, to } = {}) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    const orderQuery = {
      isPaid: true,
      status: 'DELIVERED'
    };

    if (fromDate || toDate) {
      orderQuery.createdAt = {};
      if (fromDate) orderQuery.createdAt.$gte = fromDate;
      if (toDate) orderQuery.createdAt.$lte = toDate;
    }

    const [orders, claimedKeysSet, authorBooks] = await Promise.all([
      Order.find(orderQuery).populate('items.book').lean(),
      this.getExistingClaimedSourceKeys(authorId),
      Book.find({ author: authorId }).select('_id title royaltyPercentage').lean()
    ]);

    const authorBookMap = new Map();
    authorBooks.forEach((b) => authorBookMap.set(String(b._id), b));

    const eligibleItems = [];
    const excludedItems = {
      alreadySettled: 0,
      notDelivered: 0,
      legacyRateUnavailable: 0,
      unrelatedAuthor: 0
    };

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemBookId = item.book ? (item.book._id || item.book).toString() : null;
        const itemAuthorId = item.author ? item.author.toString() : (item.book && item.book.author ? item.book.author.toString() : null);

        const isAuthorBook = itemAuthorId === String(authorId) || (itemBookId && authorBookMap.has(itemBookId));

        if (!isAuthorBook) {
          excludedItems.unrelatedAuthor++;
          return;
        }

        const sourceKey = `${order._id}:${item._id}`;

        if (claimedKeysSet.has(sourceKey)) {
          excludedItems.alreadySettled++;
          return;
        }

        if (typeof item.royaltyPercentage !== 'number') {
          excludedItems.legacyRateUnavailable++;
          return;
        }

        const qty = item.quantity || 0;
        const price = item.price || 0;
        const gross = qty * price;
        const royalty = roundMoney((gross * item.royaltyPercentage) / 100);

        eligibleItems.push({
          royaltySourceKey: sourceKey,
          order: order._id,
          orderItem: item._id,
          orderNumber: order.orderNumber,
          book: itemBookId,
          bookTitleSnapshot: item.book ? item.book.title : 'Book',
          quantity: qty,
          unitPriceSnapshot: price,
          grossBookRevenue: roundMoney(gross),
          royaltyPercentageSnapshot: item.royaltyPercentage,
          royaltyAmount: royalty,
          saleDate: order.createdAt,
          eligibilityStatus: 'SETTLEMENT_ELIGIBLE'
        });
      });
    });

    return { eligibleItems, excludedItems };
  }

  async createSettlement(settlementData) {
    return RoyaltySettlement.create(settlementData);
  }

  async findSettlementById(id) {
    return RoyaltySettlement.findById(id).populate('author', 'name email').populate('createdBy', 'name email');
  }

  async findSettlements(filter = {}, { skip = 0, limit = 10, sort = '-createdAt' } = {}) {
    const [data, total] = await Promise.all([
      RoyaltySettlement.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .lean(),
      RoyaltySettlement.countDocuments(filter)
    ]);
    return { data, total };
  }

  async claimSourceKeys(settlementId, authorId, items) {
    const claims = items.map((item) => ({
      royaltySourceKey: item.royaltySourceKey,
      settlement: settlementId,
      author: authorId,
      order: item.order,
      orderItem: item.orderItem,
      status: 'CLAIMED'
    }));

    try {
      await RoyaltySettlementClaim.insertMany(claims, { ordered: true });
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        const error = new Error('SETTLEMENT_CONFLICT: One or more royalty sale lines have already been claimed by another finalized settlement.');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  async removeClaimsForSettlement(settlementId) {
    await RoyaltySettlementClaim.deleteMany({ settlement: settlementId });
  }

  async createPayout(payoutData) {
    return RoyaltyPayout.create(payoutData);
  }

  async findPayoutBySettlementId(settlementId) {
    return RoyaltyPayout.findOne({ settlement: settlementId });
  }

  async findPayoutsForAuthor(authorId, { skip = 0, limit = 10 } = {}) {
    const [data, total] = await Promise.all([
      RoyaltyPayout.find({ author: authorId }).sort('-createdAt').skip(skip).limit(limit).lean(),
      RoyaltyPayout.countDocuments({ author: authorId })
    ]);
    return { data, total };
  }

  async getAuthorSettlementMetrics(authorId) {
    const [settlements, payouts] = await Promise.all([
      RoyaltySettlement.find({ author: authorId, status: { $ne: 'CANCELLED' } }).lean(),
      RoyaltyPayout.find({ author: authorId, status: 'PAID' }).lean()
    ]);

    let settledPendingPayment = 0;
    let paidLifetime = 0;

    settlements.forEach((s) => {
      if (s.status === 'PAID') {
        // Paid
      } else if (['APPROVED', 'PAYMENT_PENDING', 'READY_FOR_APPROVAL'].includes(s.status)) {
        settledPendingPayment += s.totalRoyalty || 0;
      }
    });

    payouts.forEach((p) => {
      paidLifetime += p.amount || 0;
    });

    return {
      settledPendingPayment: roundMoney(settledPendingPayment),
      paidLifetime: roundMoney(paidLifetime)
    };
  }
}

module.exports = new RoyaltySettlementRepository();
module.exports.RoyaltySettlementRepository = RoyaltySettlementRepository;
