const userRepository = require('../repositories/userRepository');

const authorizeUser = (requestedId, actor, adminAllowed = true) => {
  if (String(actor.id || actor._id) !== String(requestedId) && (!adminAllowed || actor.role !== 'admin')) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
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
    authorizeUser(userId, actor);
    const user = await this.repository.findById(userId);
    if (!user) throw userNotFound();
    return {
      totalOrders: await this.repository.countOrders(user._id),
      wishlistCount: user.wishlist.length,
      libraryCount: user.library.length
    };
  }

  async updateProfile(userId, actor, updates = {}) {
    authorizeUser(userId, actor);
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
    authorizeUser(userId, actor);
    const { pageNum, limitNum, skip } = pageMeta(filters.page, filters.limit);
    const query = { user: userId };
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    const data = await this.repository.findOrders(query, { skip, limit: limitNum });
    const total = await this.repository.countOrdersByQuery(query);
    return { data, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } };
  }

  async getWishlist(userId, actor) {
    authorizeUser(userId, actor);
    const user = await this.repository.findWithWishlist(userId);
    return user.wishlist;
  }

  async getLibrary(userId, actor) {
    authorizeUser(userId, actor);
    const user = await this.repository.findWithLibrary(userId);
    return user.library;
  }

  async addToWishlist(userId, actor, bookId) {
    authorizeUser(userId, actor, false);
    const user = await this.repository.findById(userId);
    if (!user.wishlist.includes(bookId)) {
      user.wishlist.push(bookId);
      await this.repository.save(user);
    }
    return user.wishlist;
  }

  async removeFromWishlist(userId, actor, bookId) {
    authorizeUser(userId, actor, false);
    const user = await this.repository.findById(userId);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== bookId);
    await this.repository.save(user);
    return user.wishlist;
  }
}

module.exports = new UserService();
module.exports.UserService = UserService;
