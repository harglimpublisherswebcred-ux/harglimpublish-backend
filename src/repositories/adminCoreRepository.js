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

  listUsers(query = {}, { skip = 0, limit = 20 } = {}) {
    return User.find(query).select('-password').sort('-createdAt').skip(skip).limit(limit);
  }

  countUsersByQuery(query = {}) {
    return User.countDocuments(query);
  }

  findUserById(id) {
    return User.findById(id).select('-password');
  }

  updateUser(id, data) {
    return User.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).select('-password');
  }

  saveUser(user) {
    return user.save();
  }

  createBook(data) {
    const book = new Book(data);
    return book.save();
  }

  findBookBySlug(slug) {
    return Book.findOne({ slug });
  }

  updateBook(id, data) {
    return Book.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
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
    return PublishRequest.find()
      .populate('user', 'name email')
      .populate('book', 'title status coverImage mrp')
      .populate('packageId', 'name')
      .sort('-createdAt');
  }

  findPublishRequestById(id) {
    return PublishRequest.findById(id)
      .populate('user', 'name email')
      .populate('book')
      .populate('packageId', 'name');
  }

  updatePublishRequestStatus(id, status) {
    return PublishRequest.findByIdAndUpdate(id, { status }, { returnDocument: 'after' }).populate('user');
  }

  updatePublishRequestDetails(id, data) {
    return PublishRequest.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .populate('user', 'name email')
      .populate('book')
      .populate('packageId', 'name');
  }
}

module.exports = new AdminCoreRepository();
module.exports.AdminCoreRepository = AdminCoreRepository;


