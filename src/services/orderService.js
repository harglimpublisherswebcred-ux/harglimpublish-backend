const mongoose = require('mongoose');
const orderRepository = require('../repositories/orderRepository');
const orderPaymentBridgeService = require('./orderPaymentBridgeService');
const eventBus = require('../events/eventBus');

const serviceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class OrderService {
  constructor(repository = orderRepository) {
    this.repository = repository;
  }

  async trackOrder(orderNumber) {
    const order = await this.repository.findByOrderNumber(orderNumber);
    if (!order) throw serviceError('Order not found', 404);
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      items: order.items,
      trackingUpdates: order.trackingUpdates,
      totalPrice: order.totalPrice
    };
  }

  async loadAuthorizedOrder(orderId, user) {
    const order = await this.repository.findById(orderId, { lean: true });
    if (!order) throw serviceError('Order not found', 404);
    if (String(order.user) !== String(user._id) && user.role !== 'admin') {
      throw serviceError('Not authorized', 403);
    }
    return order;
  }

  async cancelOrder(orderId, user) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const order = await this.repository.findById(orderId, { session });
      if (!order) throw serviceError('Order not found', 404);
      if (order.user.toString() !== user._id.toString() && user.role !== 'admin') {
        throw serviceError('Not authorized', 403);
      }
      if (order.status !== 'PENDING') {
        throw serviceError('Can only cancel pending orders', 400);
      }

      order.status = 'CANCELLED';
      order.trackingUpdates.push({
        status: 'Cancelled',
        description: 'Order cancelled by user'
      });

      await this.repository.save(order, { session });
      await orderPaymentBridgeService.releaseOrderInventory(order._id, {
        userId: user._id
      }, {
        session,
        actorType: user.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
        reason: 'Inventory reservation released after order cancellation'
      });

      await session.commitTransaction();
      await eventBus.flushSession(session);
      return order;
    } catch (error) {
      await session.abortTransaction();
      eventBus.discardSession(session);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new OrderService();
module.exports.OrderService = OrderService;
