const AuthorApplication = require('../models/AuthorApplication');
const User = require('../models/User');

class AuthorApplicationRepository {
  constructor({ applicationModel = AuthorApplication, userModel = User } = {}) {
    this.Application = applicationModel;
    this.User = userModel;
  }

  create(data) {
    return this.Application.create(data);
  }

  findByUser(userId) {
    return this.Application.findOne({ user: userId }).populate('user', 'name email role');
  }

  findById(id) {
    return this.Application.findById(id).populate('user', 'name email role');
  }

  updateById(id, update) {
    return this.Application.findByIdAndUpdate(id, update, {
      returnDocument: 'after',
      runValidators: true
    }).populate('user', 'name email role');
  }

  list(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    return this.Application.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  updateUserRole(userId, role) {
    return this.User.findByIdAndUpdate(userId, { role }, {
      returnDocument: 'after',
      runValidators: true
    }).select('-password');
  }
}

module.exports = new AuthorApplicationRepository();
module.exports.AuthorApplicationRepository = AuthorApplicationRepository;
