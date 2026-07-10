const Order = require('../models/Order');

class OrderRepository {
  findByOrderNumber(orderNumber) {
    return Order.findOne({ orderNumber }).populate('items.book', 'title coverImage');
  }

  findById(id, options = {}) {
    const query = Order.findById(id);
    if (options.lean) query.lean();
    if (options.session) query.session(options.session);
    return query;
  }

  save(order, options = {}) {
    return order.save({ session: options.session });
  }
}

module.exports = new OrderRepository();
module.exports.OrderRepository = OrderRepository;
