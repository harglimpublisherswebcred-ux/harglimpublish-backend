const adminCoreRepository = require('../repositories/adminCoreRepository');
const { sendPublishRequestUpdate } = require('../utils/emailService');

const notFound = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const serviceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const pageMeta = (page, limit) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const allowedRoles = new Set(['visitor', 'reader', 'author', 'admin']);
const orderStatusMap = {
  Processing: 'PROCESSING',
  Shipped: 'SHIPPED',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED',
};

const normalizeFrontendRole = (role) => (role === 'user' ? 'reader' : role);
const normalizeFrontendActive = (status) => {
  if (status === undefined) return undefined;
  if (typeof status === 'boolean') return status;
  if (status === 'Active') return true;
  if (status === 'Suspended') return false;
  return undefined;
};
const normalizeOrderStatus = (status) => orderStatusMap[status] || status;
const hasValue = (value) => value !== undefined && value !== null;
const normalizeBookPricingInput = (payload = {}) => {
  const data = { ...payload };
  const hasMrp = hasValue(data.mrp);
  const hasPrice = hasValue(data.price);

  if (hasMrp && hasPrice && Number(data.mrp) !== Number(data.price)) {
    throw serviceError('MRP and legacy price must match');
  }

  if (hasMrp && !hasPrice) data.price = data.mrp;
  if (!hasMrp && hasPrice) data.mrp = data.price;

  return data;
};

class AdminCoreService {
  constructor(repository = adminCoreRepository) {
    this.repository = repository;
  }

  async getAnalytics() {
    const revenueAgg = await this.repository.getRevenueAggregation();
    const booksSoldAgg = await this.repository.getBooksSoldAggregation();
    return {
      totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0,
      totalOrders: await this.repository.countOrders(),
      totalBooksSold: booksSoldAgg.length > 0 ? booksSoldAgg[0].totalBooksSold : 0,
      totalBooks: await this.repository.countBooks(),
      totalUsers: await this.repository.countUsers()
    };
  }

  async listUsers(filters = {}) {
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = String(filters.isActive) === 'true';
    if (filters.search || filters.q) {
      const regex = new RegExp(escapeRegex(filters.search || filters.q), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }
    const [data, total] = await Promise.all([
      this.repository.listUsers(query, { skip, limit: limitNum }),
      this.repository.countUsersByQuery(query)
    ]);
    return { data, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } };
  }

  async getUser(id) {
    const user = await this.repository.findUserById(id);
    if (!user) throw notFound('User not found');
    return user;
  }

  async updateUserRole(id, role) {
    role = normalizeFrontendRole(role);
    if (!allowedRoles.has(role)) throw serviceError('Invalid user role');
    const user = await this.repository.updateUser(id, { role });
    if (!user) throw notFound('User not found');
    return user;
  }

  async updateUserStatus(id, isActive) {
    isActive = normalizeFrontendActive(isActive);
    if (isActive === undefined) throw serviceError('isActive is required');
    const user = await this.repository.updateUser(id, { isActive });
    if (!user) throw notFound('User not found');
    return user;
  }


  async updateUser(id, updates = {}) {
    const data = {};
    if (updates.role !== undefined) {
      const role = normalizeFrontendRole(updates.role);
      if (!allowedRoles.has(role)) throw serviceError('Invalid user role');
      data.role = role;
    }
    if (updates.isActive !== undefined || updates.status !== undefined) {
      const isActive = normalizeFrontendActive(updates.isActive !== undefined ? updates.isActive : updates.status);
      if (isActive === undefined) throw serviceError('Invalid user status');
      data.isActive = isActive;
    }
    if (Object.keys(data).length === 0) throw serviceError('No supported user fields provided');
    const user = await this.repository.updateUser(id, data);
    if (!user) throw notFound('User not found');
    return user;
  }
  async resetUserPassword(id, password) {
    if (!password || String(password).length < 6) throw serviceError('Password must be at least 6 characters');
    const user = await this.repository.findUserById(id);
    if (!user) throw notFound('User not found');
    user.password = password;
    await this.repository.saveUser(user);
    return { _id: user._id, email: user.email, role: user.role };
  }

  createBook(data, actor) {
    return this.repository.createBook({
      ...normalizeBookPricingInput(data),
      author: data.author || actor._id
    });
  }

  async updateBook(id, data) {
    const book = await this.repository.updateBook(id, normalizeBookPricingInput(data));
    if (!book) throw notFound('Book not found');
    return book;
  }

  async deleteBook(id) {
    const book = await this.repository.deleteBook(id);
    if (!book) throw notFound('Book not found');
    return { success: true, message: 'Book removed' };
  }

  listOrders() {
    return this.repository.listOrders();
  }

  async updateOrderStatus(id, status) {
    status = normalizeOrderStatus(status);
    const order = await this.repository.findOrderById(id);
    if (!order) throw notFound('Order not found');
    order.status = status;
    order.trackingUpdates.push({
      status,
      description: `Order status updated to ${status}`
    });
    return this.repository.saveOrder(order);
  }

  listPublishRequests() {
    return this.repository.listPublishRequests();
  }

  async updatePublishRequestStatus(id, status) {
    const request = await this.repository.updatePublishRequestStatus(id, status);
    if (!request) throw notFound('Request not found');
    if (request.user) sendPublishRequestUpdate(request.user, request, status);
    return request;
  }

  async requestChangesOnPublishRequest(adminUser, id, reason = 'Changes requested by editor') {
    const request = await this.repository.findPublishRequestById(id);
    if (!request) throw notFound('Publish request not found');

    const updated = await this.repository.updatePublishRequestDetails(id, {
      status: 'CHANGES_REQUESTED',
      adminNotes: reason,
      reviewedBy: adminUser._id,
      reviewedAt: new Date()
    });

    if (updated.user) sendPublishRequestUpdate(updated.user, updated, 'CHANGES_REQUESTED');
    return updated;
  }

  async rejectPublishRequest(adminUser, id, reason = 'Publish request rejected') {
    const request = await this.repository.findPublishRequestById(id);
    if (!request) throw notFound('Publish request not found');

    const updated = await this.repository.updatePublishRequestDetails(id, {
      status: 'REJECTED',
      adminNotes: reason,
      reviewedBy: adminUser._id,
      reviewedAt: new Date()
    });

    if (updated.user) sendPublishRequestUpdate(updated.user, updated, 'REJECTED');
    return updated;
  }

  async approveAndPublishBook(adminUser, id, notes = 'Approved and published') {
    const request = await this.repository.findPublishRequestById(id);
    if (!request) throw notFound('Publish request not found');

    const updated = await this.repository.updatePublishRequestDetails(id, {
      status: 'APPROVED',
      adminNotes: notes,
      reviewedBy: adminUser._id,
      reviewedAt: new Date()
    });

    if (request.book) {
      const bookId = request.book._id || request.book;
      await this.repository.updateBook(bookId, { status: 'published' });
    }

    if (updated.user) sendPublishRequestUpdate(updated.user, updated, 'APPROVED');
    return updated;
  }

  async getAdminDashboardOverview() {
    const AuthorApplication = require('../models/AuthorApplication');
    const PublishRequest = require('../models/PublishRequest');
    const Payment = require('../models/Payment');
    const Order = require('../models/Order');
    const Book = require('../models/Book');
    const User = require('../models/User');
    const RoyaltySettlement = require('../models/RoyaltySettlement');

    const [
      pendingAuthorApplications,
      pendingPublishRequests,
      paymentsAwaitingVerification,
      orderPaymentsAwaitingVerification,
      authorAccessPaymentsAwaitingVerification,
      ordersRequiringAction,
      activeAuthors,
      publishedBooks,
      royaltySettlementsAwaitingApproval,
      royaltySettlementsAwaitingPayment
    ] = await Promise.all([
      AuthorApplication.countDocuments({ status: { $in: ['pending', 'PENDING'] } }),
      PublishRequest.countDocuments({ status: { $in: ['pending', 'PENDING', 'submitted', 'SUBMITTED', 'under_review', 'UNDER_REVIEW'] } }),
      Payment.countDocuments({ status: { $in: ['VERIFICATION_PENDING', 'SUBMITTED'] } }),
      Payment.countDocuments({ purpose: 'ORDER_PURCHASE', status: { $in: ['VERIFICATION_PENDING', 'SUBMITTED'] } }),
      Payment.countDocuments({ purpose: 'AUTHOR_ACCESS', status: { $in: ['VERIFICATION_PENDING', 'SUBMITTED'] } }),
      Order.countDocuments({ status: { $in: ['PENDING', 'PROCESSING'] } }),
      User.countDocuments({ role: 'author' }),
      Book.countDocuments({ status: 'published' }),
      RoyaltySettlement.countDocuments({ status: { $in: ['DRAFT', 'READY_FOR_APPROVAL'] } }),
      RoyaltySettlement.countDocuments({ status: { $in: ['APPROVED', 'PAYMENT_PENDING'] } })
    ]);

    return {
      operationalCounts: {
        pendingAuthorApplications,
        pendingPublishRequests,
        paymentsAwaitingVerification,
        orderPaymentsAwaitingVerification,
        authorAccessPaymentsAwaitingVerification,
        ordersRequiringAction,
        activeAuthors,
        publishedBooks,
        royaltySettlementsAwaitingApproval,
        royaltySettlementsAwaitingPayment
      }
    };
  }

  async getAdminAuthorDetail(authorId) {
    const User = require('../models/User');
    const AuthorApplication = require('../models/AuthorApplication');
    const AuthorAccessEntitlement = require('../models/AuthorAccessEntitlement');
    const Book = require('../models/Book');
    const PublishRequest = require('../models/PublishRequest');
    const authorDashboardService = require('./authorDashboardService');

    const user = await User.findById(authorId).select('-password').lean();
    if (!user || user.role !== 'author') {
      throw notFound('Author not found');
    }

    const [application, entitlement, publishedBookCount, draftBookCount, publishRequestCount, dashboardSummary] = await Promise.all([
      AuthorApplication.findOne({ user: authorId }).sort('-createdAt').lean(),
      AuthorAccessEntitlement.findOne({ user: authorId }).lean(),
      Book.countDocuments({ author: authorId, status: 'published' }),
      Book.countDocuments({ author: authorId, status: { $ne: 'published' } }),
      PublishRequest.countDocuments({ user: authorId }),
      authorDashboardService.getDashboardSummary(authorId, { role: 'admin' })
    ]);

    return {
      author: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        authorApprovalStatus: user.authorApprovalStatus || 'approved',
        createdAt: user.createdAt
      },
      application: application ? {
        id: application._id.toString(),
        status: application.status,
        submittedAt: application.createdAt,
        reviewedAt: application.reviewedAt || null
      } : null,
      entitlement: entitlement ? {
        id: entitlement._id.toString(),
        status: entitlement.status,
        grantedAt: entitlement.grantedAt,
        source: entitlement.source
      } : null,
      bookCounts: {
        published: publishedBookCount,
        drafts: draftBookCount,
        total: publishedBookCount + draftBookCount
      },
      publishRequestCount,
      royalties: dashboardSummary.royalties
    };
  }
}

module.exports = new AdminCoreService();
module.exports.AdminCoreService = AdminCoreService;
