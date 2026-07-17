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
    if (!allowedRoles.has(role)) throw serviceError('Invalid user role');
    const user = await this.repository.updateUser(id, { role });
    if (!user) throw notFound('User not found');
    return user;
  }

  async updateUserStatus(id, isActive) {
    if (isActive === undefined) throw serviceError('isActive is required');
    const user = await this.repository.updateUser(id, { isActive: Boolean(isActive) });
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
      ...data,
      author: data.author || actor._id
    });
  }

  async updateBook(id, data) {
    const book = await this.repository.updateBook(id, data);
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
}

module.exports = new AdminCoreService();
module.exports.AdminCoreService = AdminCoreService;
