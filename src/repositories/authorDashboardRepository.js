const mongoose = require('mongoose');
const Book = require('../models/Book');
const Order = require('../models/Order');

class AuthorDashboardRepository {
  async getBookCountsByAuthor(authorId) {
    const authorObjectId = new mongoose.Types.ObjectId(authorId.toString());
    const counts = await Book.aggregate([
      { $match: { author: authorObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {
      published: 0,
      draft: 0,
      archived: 0
    };

    counts.forEach((item) => {
      if (item._id && statusMap.hasOwnProperty(item._id)) {
        statusMap[item._id] = item.count;
      }
    });

    const total = counts.reduce((acc, curr) => acc + curr.count, 0);

    return {
      total,
      published: statusMap.published,
      draft: statusMap.draft,
      archived: statusMap.archived
    };
  }

  async findVerifiedOrdersForAuthor(authorId) {
    const authorObjectId = new mongoose.Types.ObjectId(authorId.toString());
    
    // Find all books owned by author to match legacy orders without item.author snapshot
    const authorBooks = await Book.find({ author: authorObjectId }).select('_id title coverImage status royaltyPercentage');
    const authorBookMap = new Map();
    authorBooks.forEach((b) => authorBookMap.set(b._id.toString(), b));

    const bookIds = authorBooks.map((b) => b._id);

    // Verified sales invariant: isPaid = true OR status in ['PROCESSING', 'SHIPPED', 'DELIVERED']
    const orders = await Order.find({
      $or: [
        { 'items.author': authorObjectId },
        { 'items.book': { $in: bookIds } }
      ],
      $and: [
        { status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        { isPaid: true }
      ]
    }).populate('items.book', 'title coverImage status royaltyPercentage author').sort('-createdAt');

    return { orders, authorBookMap };
  }

  async getAuthorSalesTimeseries(authorId, { startDate, endDate }) {
    const authorObjectId = new mongoose.Types.ObjectId(authorId.toString());
    const authorBooks = await Book.find({ author: authorObjectId }).select('_id royaltyPercentage');
    const authorBookIds = authorBooks.map((b) => b._id);
    const bookRoyaltyMap = new Map();
    authorBooks.forEach((b) => bookRoyaltyMap.set(b._id.toString(), b.royaltyPercentage || 0));

    const matchStage = {
      $match: {
        $or: [
          { 'items.author': authorObjectId },
          { 'items.book': { $in: authorBookIds } }
        ],
        status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        isPaid: true,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    };

    const pipeline = [
      matchStage,
      { $unwind: '$items' },
      {
        $match: {
          $or: [
            { 'items.author': authorObjectId },
            { 'items.book': { $in: authorBookIds } }
          ]
        }
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          quantity: '$items.quantity',
          price: '$items.price',
          revenue: { $multiply: ['$items.price', '$items.quantity'] },
          royaltyPct: {
            $ifNull: ['$items.royaltyPercentage', 0]
          }
        }
      },
      {
        $group: {
          _id: '$date',
          units: { $sum: '$quantity' },
          revenue: { $sum: '$revenue' },
          // royalty calculated in JS service to handle legacy fallback safely
        }
      },
      { $sort: { _id: 1 } }
    ];

    return Order.aggregate(pipeline);
  }
}

module.exports = new AuthorDashboardRepository();
module.exports.AuthorDashboardRepository = AuthorDashboardRepository;
