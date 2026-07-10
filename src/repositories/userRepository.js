const User = require('../models/User');
const Order = require('../models/Order');

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
