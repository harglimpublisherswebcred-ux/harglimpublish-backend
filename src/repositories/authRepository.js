const User = require('../models/User');

class AuthRepository {
  findUserByEmail(email, options = {}) {
    const query = User.findOne({ email });
    if (options.includePassword) query.select('+password');
    return query;
  }

  createUser(userData) {
    return User.create(userData);
  }

  findUserById(id) {
    return User.findById(id);
  }
}

module.exports = new AuthRepository();
module.exports.AuthRepository = AuthRepository;
