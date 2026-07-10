const adminCoreRepository = require('../repositories/adminCoreRepository');
const { sendPublishRequestUpdate } = require('../utils/emailService');

const notFound = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
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
