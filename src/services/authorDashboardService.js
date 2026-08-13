const authorDashboardRepository = require('../repositories/authorDashboardRepository');
const User = require('../models/User');

const serviceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const roundMoney = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const authorizeAuthorOrAdmin = (authorId, actor) => {
  const actorId = String(actor._id || actor.id);
  if (actorId !== String(authorId) && actor.role !== 'admin') {
    throw serviceError('Not authorized to access this author dashboard', 403);
  }
};

class AuthorDashboardService {
  constructor(repository = authorDashboardRepository) {
    this.repository = repository;
  }

  async getDashboardSummary(authorId, actor) {
    authorizeAuthorOrAdmin(authorId, actor);

    const [bookCounts, { orders, authorBookMap }] = await Promise.all([
      this.repository.getBookCountsByAuthor(authorId),
      this.repository.findVerifiedOrdersForAuthor(authorId)
    ]);

    let totalUnitsSold = 0;
    let totalGrossRevenue = 0;
    let totalAccruedKnown = 0;
    let unresolvedLegacySales = 0;

    const bookStatsMap = new Map();
    authorBookMap.forEach((book, id) => {
      bookStatsMap.set(id, {
        bookId: book._id,
        title: book.title,
        coverImage: book.coverImage || '',
        status: book.status,
        unitsSold: 0,
        grossBookRevenue: 0,
        knownAccruedRoyalty: 0,
        unresolvedLegacySales: 0,
        currentRoyaltyPercentage: typeof book.royaltyPercentage === 'number' ? book.royaltyPercentage : 0
      });
    });

    const recentSales = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemBookId = item.book ? (item.book._id || item.book).toString() : null;
        const itemAuthorId = item.author ? item.author.toString() : (item.book && item.book.author ? item.book.author.toString() : null);

        const isAuthorBook = itemAuthorId === String(authorId) || (itemBookId && authorBookMap.has(itemBookId));

        if (isAuthorBook) {
          const qty = item.quantity || 0;
          const unitPrice = item.price || 0;
          const lineGross = qty * unitPrice;

          totalUnitsSold += qty;
          totalGrossRevenue += lineGross;

          let pct = null;
          let lineRoyalty = null;
          let royaltyStatus = 'HISTORICAL_RATE_UNAVAILABLE';

          if (typeof item.royaltyPercentage === 'number') {
            pct = item.royaltyPercentage;
            lineRoyalty = roundMoney((lineGross * pct) / 100);
            royaltyStatus = 'CALCULATED';
            totalAccruedKnown += lineRoyalty;
          } else {
            unresolvedLegacySales += 1;
          }

          if (itemBookId && bookStatsMap.has(itemBookId)) {
            const bStat = bookStatsMap.get(itemBookId);
            bStat.unitsSold += qty;
            bStat.grossBookRevenue += lineGross;
            if (lineRoyalty !== null) {
              bStat.knownAccruedRoyalty += lineRoyalty;
            } else {
              bStat.unresolvedLegacySales += 1;
            }
          }

          if (recentSales.length < 10) {
            recentSales.push({
              orderNumber: order.orderNumber,
              bookId: itemBookId,
              bookTitle: item.book ? item.book.title : 'Book',
              quantity: qty,
              unitPrice,
              grossRevenue: roundMoney(lineGross),
              royaltyPercentageSnapshot: pct,
              accruedRoyalty: lineRoyalty,
              royaltyStatus,
              saleDate: order.createdAt,
              status: order.status
            });
          }
        }
      });
    });

    const topBooks = Array.from(bookStatsMap.values())
      .map((b) => ({
        ...b,
        grossBookRevenue: roundMoney(b.grossBookRevenue),
        knownAccruedRoyalty: roundMoney(b.knownAccruedRoyalty)
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const dataStatus = unresolvedLegacySales > 0 ? 'PARTIAL' : 'COMPLETE';

    const royaltySettlementRepository = require('../repositories/royaltySettlementRepository');
    const [{ eligibleItems }, settlementMetrics] = await Promise.all([
      royaltySettlementRepository.findEligibleOrderItemsForAuthor(authorId),
      royaltySettlementRepository.getAuthorSettlementMetrics(authorId)
    ]);

    const eligibleUnsettled = eligibleItems.reduce((sum, item) => sum + item.royaltyAmount, 0);

    return {
      books: bookCounts,
      sales: {
        unitsSold: totalUnitsSold,
        grossBookRevenue: roundMoney(totalGrossRevenue)
      },
      royalties: {
        accruedKnown: roundMoney(totalAccruedKnown),
        accrued: roundMoney(totalAccruedKnown),
        eligibleUnsettled: roundMoney(eligibleUnsettled),
        settledPendingPayment: settlementMetrics.settledPendingPayment,
        paidLifetime: settlementMetrics.paidLifetime,
        currency: 'INR',
        dataStatus,
        unresolvedLegacySales
      },
      topBooks,
      recentSales
    };
  }

  async getAuthorAnalytics(authorId, actor, { range = '30d', from, to } = {}) {
    authorizeAuthorOrAdmin(authorId, actor);

    let endDate = new Date();
    let startDate = new Date();

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      const days = parseInt(range, 10) || (range === '7d' ? 7 : range === '90d' ? 90 : 30);
      startDate.setDate(endDate.getDate() - days);
    }

    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      throw serviceError('Custom date range cannot exceed 365 days', 400);
    }

    const { orders, authorBookMap } = await this.repository.findVerifiedOrdersForAuthor(authorId);

    const timeMap = new Map();

    orders.forEach((order) => {
      const orderDate = order.createdAt;
      if (orderDate >= startDate && orderDate <= endDate) {
        const dateStr = orderDate.toISOString().split('T')[0];

        if (!timeMap.has(dateStr)) {
          timeMap.set(dateStr, { date: dateStr, units: 0, revenue: 0, knownRoyalty: 0, unresolvedLegacyCount: 0 });
        }

        const bucket = timeMap.get(dateStr);

        order.items.forEach((item) => {
          const itemBookId = item.book ? (item.book._id || item.book).toString() : null;
          const itemAuthorId = item.author ? item.author.toString() : (item.book && item.book.author ? item.book.author.toString() : null);

          if (itemAuthorId === String(authorId) || (itemBookId && authorBookMap.has(itemBookId))) {
            const qty = item.quantity || 0;
            const unitPrice = item.price || 0;
            const gross = qty * unitPrice;

            bucket.units += qty;
            bucket.revenue += gross;

            if (typeof item.royaltyPercentage === 'number') {
              const rVal = (gross * item.royaltyPercentage) / 100;
              bucket.knownRoyalty += rVal;
            } else {
              bucket.unresolvedLegacyCount += 1;
            }
          }
        });
      }
    });

    const series = Array.from(timeMap.values())
      .map((item) => ({
        date: item.date,
        units: item.units,
        revenue: roundMoney(item.revenue),
        knownRoyalty: roundMoney(item.knownRoyalty),
        unresolvedLegacyCount: item.unresolvedLegacyCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: range,
      startDate,
      endDate,
      series
    };
  }

  async getAuthorBookPerformance(authorId, actor) {
    authorizeAuthorOrAdmin(authorId, actor);
    const summary = await this.getDashboardSummary(authorId, actor);
    return summary.topBooks;
  }

  async getAuthorRoyaltyHistory(authorId, actor, { page = 1, limit = 10, bookId, from, to } = {}) {
    authorizeAuthorOrAdmin(authorId, actor);

    const { orders, authorBookMap } = await this.repository.findVerifiedOrdersForAuthor(authorId);
    const user = await User.findById(authorId);

    const allTransactions = [];

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    orders.forEach((order) => {
      const orderDate = order.createdAt;
      if ((fromDate && orderDate < fromDate) || (toDate && orderDate > toDate)) {
        return;
      }

      order.items.forEach((item) => {
        const itemBookId = item.book ? (item.book._id || item.book).toString() : null;
        const itemAuthorId = item.author ? item.author.toString() : (item.book && item.book.author ? item.book.author.toString() : null);

        if (bookId && itemBookId !== String(bookId)) {
          return;
        }

        if (itemAuthorId === String(authorId) || (itemBookId && authorBookMap.has(itemBookId))) {
          const qty = item.quantity || 0;
          const unitPrice = item.price || 0;
          const gross = qty * unitPrice;

          let pct = null;
          let lineRoyalty = null;
          let royaltyStatus = 'HISTORICAL_RATE_UNAVAILABLE';

          if (typeof item.royaltyPercentage === 'number') {
            pct = item.royaltyPercentage;
            lineRoyalty = roundMoney((gross * pct) / 100);
            royaltyStatus = 'CALCULATED';
          }

          allTransactions.push({
            orderNumber: order.orderNumber,
            bookId: itemBookId,
            bookTitle: item.book ? item.book.title : 'Book',
            quantity: qty,
            unitPrice,
            grossBookRevenue: roundMoney(gross),
            royaltyPercentageSnapshot: pct,
            royaltyAmount: lineRoyalty,
            royaltyStatus,
            saleDate: order.createdAt,
            status: 'ACCRUED'
          });
        }
      });
    });

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = allTransactions.length;
    const paginatedHistory = allTransactions.slice(skip, skip + limitNum);

    const knownAccruedTotal = allTransactions.reduce((acc, curr) => acc + (curr.royaltyAmount !== null ? curr.royaltyAmount : 0), 0);
    const unresolvedCount = allTransactions.filter((curr) => curr.royaltyStatus === 'HISTORICAL_RATE_UNAVAILABLE').length;
    const dataStatus = unresolvedCount > 0 ? 'PARTIAL' : 'COMPLETE';

    return {
      balance: roundMoney(user ? user.royaltiesBalance || knownAccruedTotal : knownAccruedTotal),
      accruedKnown: roundMoney(knownAccruedTotal),
      accruedTotal: roundMoney(knownAccruedTotal),
      currency: 'INR',
      dataStatus,
      unresolvedLegacySales: unresolvedCount,
      history: paginatedHistory,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    };
  }
}

module.exports = new AuthorDashboardService();
module.exports.AuthorDashboardService = AuthorDashboardService;
