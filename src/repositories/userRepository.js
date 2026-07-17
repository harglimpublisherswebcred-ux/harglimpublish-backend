const User = require('../models/User');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');

class UserRepository {
  findById(id) {
    return User.findById(id);
  }

  countOrders(userId) {
    return Order.countDocuments({ user: userId });
  }

  findOrders(query, { skip, limit }) {
    return Order.find(query)
      .populate('items.book', 'title coverImage price')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
  }

  countOrdersByQuery(query) {
    return Order.countDocuments(query);
  }

  findInvoices(query, { skip, limit }) {
    return Invoice.find(query)
      .populate('order', 'orderNumber status totalPrice')
      .populate('payment', 'status amount paymentMethod provider verifiedAt')
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  countInvoices(query) {
    return Invoice.countDocuments(query);
  }

  findInvoiceById(id) {
    return Invoice.findById(id)
      .populate('order', 'orderNumber status totalPrice')
      .populate('payment', 'status amount paymentMethod provider verifiedAt')
      .populate('items.book', 'title slug isbn');
  }

  findInvoiceDocumentById(id) {
    return Invoice.findById(id).select('+document.data');
  }

  findNotifications(query, { skip, limit }) {
    return Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  countNotifications(query) {
    return Notification.countDocuments(query);
  }

  findNotificationById(notificationId) {
    return Notification.findById(notificationId);
  }

  markNotificationRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { readAt: new Date() } },
      { returnDocument: 'after' }
    );
  }

  markAllNotificationsRead(userId) {
    return Notification.updateMany({ user: userId, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
  }

  archiveNotification(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { status: 'SKIPPED', readAt: new Date() } },
      { returnDocument: 'after', runValidators: true }
    );
  }

  findPayments(query, { skip, limit }, options = {}) {
    let q = Payment.find(query)
      .populate('order', 'orderNumber status totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (options.includeQR) q = q.select('+qrPayload +qrCodeDataUrl');
    return q;
  }

  countPayments(query) {
    return Payment.countDocuments(query);
  }

  findPaymentById(id, options = {}) {
    let q = Payment.findById(id).populate('order', 'orderNumber status totalPrice');
    if (options.includeQR) q = q.select('+qrPayload +qrCodeDataUrl');
    return q;
  }

  findShipments(query, { skip, limit }) {
    return Shipment.find(query)
      .populate('order', 'orderNumber status totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  countShipments(query) {
    return Shipment.countDocuments(query);
  }

  findShipmentById(id) {
    return Shipment.findById(id).populate('order', 'orderNumber status totalPrice');
  }

  findWithWishlist(id) {
    return User.findById(id).populate({
      path: 'wishlist',
      select: 'title coverImage price discountPrice author ratings reviewCount',
      populate: { path: 'author', select: 'name' }
    });
  }

  findWithLibrary(id) {
    return User.findById(id).populate({
      path: 'library',
      select: 'title coverImage format'
    });
  }

  save(user) {
    return user.save();
  }
}

module.exports = new UserRepository();
module.exports.UserRepository = UserRepository;
