const userRepository = require('../repositories/userRepository');

const resolveUserId = (requestedId, actor) => (requestedId === 'me' ? actor.id || actor._id : requestedId);

const authorizeUser = (requestedId, actor, adminAllowed = true) => {
  const resolvedId = resolveUserId(requestedId, actor);
  if (String(actor.id || actor._id) !== String(resolvedId) && (!adminAllowed || actor.role !== 'admin')) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
  return resolvedId;
};

const userNotFound = () => {
  const error = new Error('User not found');
  error.statusCode = 404;
  return error;
};

const pageMeta = (page, limit) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

class UserService {
  constructor(repository = userRepository) {
    this.repository = repository;
  }

  async getStats(userId, actor) {
    userId = authorizeUser(userId, actor);
    const user = await this.repository.findById(userId);
    if (!user) throw userNotFound();
    return {
      totalOrders: await this.repository.countOrders(user._id),
      wishlistCount: user.wishlist.length,
      libraryCount: user.library.length
    };
  }

  async updateProfile(userId, actor, updates = {}) {
    userId = authorizeUser(userId, actor);
    const user = await this.repository.findById(userId);
    if (!user) throw userNotFound();
    if (updates.name) user.name = updates.name;
    if (updates.profilePicture) user.profilePicture = updates.profilePicture;
    await this.repository.save(user);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    };
  }

  async getOrders(userId, actor, filters = {}) {
    userId = authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { user: userId };
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    const data = await this.repository.findOrders(query, { skip, limit: limitNum });
    const total = await this.repository.countOrdersByQuery(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getWishlist(userId, actor) {
    userId = authorizeUser(userId, actor);
    const user = await this.repository.findWithWishlist(userId);
    if (!user) throw userNotFound();
    return user.wishlist;
  }

  async getLibrary(userId, actor) {
    userId = authorizeUser(userId, actor);
    const user = await this.repository.findWithLibrary(userId);
    if (!user) throw userNotFound();
    return user.library;
  }

  async getInvoices(userId, actor, filters = {}) {
    userId = authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { customer: userId };
    if (filters.status) query.status = filters.status;
    const data = await this.repository.findInvoices(query, { skip, limit: limitNum });
    const total = await this.repository.countInvoices(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getInvoice(userId, actor, invoiceId) {
    userId = authorizeUser(userId, actor);
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice || String(invoice.customer) !== String(userId)) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }
    return invoice;
  }

  async getInvoiceDocument(userId, actor, invoiceId) {
    userId = authorizeUser(userId, actor);
    const invoice = await this.repository.findInvoiceDocumentById(invoiceId);
    if (!invoice || String(invoice.customer) !== String(userId) || !invoice.document || !invoice.document.data) {
      const error = new Error('Invoice document not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      buffer: invoice.document.data,
      contentType: invoice.document.contentType || 'application/pdf',
      fileName: invoice.document.fileName || `${invoice.invoiceNumber || 'invoice'}.pdf`
    };
  }

  async getNotifications(userId, actor, filters = {}) {
    userId = authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { user: userId };
    if (filters.status) query.status = filters.status;
    if (filters.unread === 'true') query.readAt = { $exists: false };
    const data = await this.repository.findNotifications(query, { skip, limit: limitNum });
    const total = await this.repository.countNotifications(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async markNotificationRead(userId, actor, notificationId) {
    userId = authorizeUser(userId, actor, false);
    const notification = await this.repository.markNotificationRead(notificationId, userId);
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }

  async getPaymentAttempts(userId, actor, filters = {}) {
    userId = authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { user: userId };
    if (filters.order) query.order = filters.order;
    if (filters.status) query.status = filters.status;
    const data = await this.repository.findPayments(query, { skip, limit: limitNum }, { includeQR: filters.includeQR === 'true' });
    const total = await this.repository.countPayments(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getPayment(userId, actor, paymentId) {
    userId = authorizeUser(userId, actor);
    const payment = await this.repository.findPaymentById(paymentId, { includeQR: true });
    if (!payment || String(payment.user) !== String(userId)) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }
    return payment;
  }

  async getOrderPayments(userId, actor, orderId, filters = {}) {
    userId = authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { user: userId, order: orderId };
    const data = await this.repository.findPayments(query, { skip, limit: limitNum }, { includeQR: true });
    const total = await this.repository.countPayments(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getShipments(userId, actor, filters = {}) {
    userId = authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { customer: userId };
    if (filters.status) query.status = String(filters.status).toUpperCase();
    const data = await this.repository.findShipments(query, { skip, limit: limitNum });
    const total = await this.repository.countShipments(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getShipment(userId, actor, shipmentId) {
    userId = authorizeUser(userId, actor);
    const shipment = await this.repository.findShipmentById(shipmentId);
    if (!shipment || String(shipment.customer) !== String(userId)) {
      const error = new Error('Shipment not found');
      error.statusCode = 404;
      throw error;
    }
    return shipment;
  }

  async getNotification(userId, actor, notificationId) {
    userId = authorizeUser(userId, actor, false);
    const notification = await this.repository.findNotificationById(notificationId);
    if (!notification || String(notification.user) !== String(userId)) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }

  async markAllNotificationsRead(userId, actor) {
    userId = authorizeUser(userId, actor, false);
    await this.repository.markAllNotificationsRead(userId);
    return { message: 'Notifications marked as read' };
  }

  async archiveNotification(userId, actor, notificationId) {
    userId = authorizeUser(userId, actor, false);
    const notification = await this.repository.archiveNotification(notificationId, userId);
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }
  async addToWishlist(userId, actor, bookId) {
    userId = authorizeUser(userId, actor, false);
    const user = await this.repository.findById(userId);
    if (!user) throw userNotFound();
    if (!user.wishlist.includes(bookId)) {
      user.wishlist.push(bookId);
      await this.repository.save(user);
    }
    return user.wishlist;
  }

  async removeFromWishlist(userId, actor, bookId) {
    userId = authorizeUser(userId, actor, false);
    const user = await this.repository.findById(userId);
    if (!user) throw userNotFound();
    user.wishlist = user.wishlist.filter((id) => id.toString() !== bookId);
    await this.repository.save(user);
    return user.wishlist;
  }
}

module.exports = new UserService();
module.exports.UserService = UserService;

