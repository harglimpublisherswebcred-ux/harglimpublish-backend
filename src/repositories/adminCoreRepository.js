const Book = require('../models/Book');
const Order = require('../models/Order');
const User = require('../models/User');
const PublishRequest = require('../models/PublishRequest');

class AdminCoreRepository {
  getRevenueAggregation() {
    return Order.aggregate([
      { $match: { status: { $in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
  }

  countOrders() {
    return Order.countDocuments();
  }

  getBooksSoldAggregation() {
    return Order.aggregate([
      { $match: { status: { $in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] } } },
      { $unwind: '$items' },
      { $group: { _id: null, totalBooksSold: { $sum: '$items.quantity' } } }
    ]);
  }

  countBooks() {
    return Book.countDocuments();
  }

  countUsers() {
    return User.countDocuments();
  }

  createBook(data) {
    const book = new Book(data);
    return book.save();
  }

  updateBook(id, data) {
    return Book.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteBook(id) {
    return Book.findByIdAndDelete(id);
  }

  listOrders() {
    return Order.find().populate('user', 'name email').sort('-createdAt');
  }

  findOrderById(id) {
    return Order.findById(id);
  }

  saveOrder(order) {
    return order.save();
  }

  listPublishRequests() {
    return PublishRequest.find().populate('user', 'name email').populate('packageId', 'name').sort('-createdAt');
  }

  updatePublishRequestStatus(id, status) {
    return PublishRequest.findByIdAndUpdate(id, { status }, { new: true }).populate('user');
  }
}

module.exports = new AdminCoreRepository();
module.exports.AdminCoreRepository = AdminCoreRepository;
