const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AuthIdentity = require('../models/AuthIdentity');

class AuthRepository {
  findUserByEmail(email, options = {}) {
    const query = User.findOne({ email });
    if (options.includePassword) query.select('+password');
    return query;
  }

  createUser(userData) {
    return User.create(userData);
  }

  createAuthIdentity(identityData) {
    return AuthIdentity.create(identityData);
  }

  findAuthIdentity(provider, providerSubject, options = {}) {
    const query = AuthIdentity.findOne({ provider, providerSubject });
    if (options.populateUser) query.populate('user');
    return query;
  }

  findAuthIdentityByUserAndProvider(userId, provider) {
    return AuthIdentity.findOne({ user: userId, provider });
  }

  updateAuthIdentity(identityId, updates) {
    return AuthIdentity.findByIdAndUpdate(identityId, updates, { returnDocument: 'after' });
  }

  findUserById(id) {
    return User.findById(id);
  }

  findUserByResetToken(tokenHash) {
    return User.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: Date.now() } }).select('+password');
  }

  saveUser(user) {
    return user.save();
  }

  createSession(data) {
    return AuthSession.create(data);
  }

  findSessionByRefreshTokenHash(refreshTokenHash) {
    return AuthSession.findOne({ refreshTokenHash }).select('+refreshTokenHash');
  }

  revokeSession(sessionId, revokedAt = new Date()) {
    return AuthSession.findByIdAndUpdate(sessionId, { revokedAt }, { returnDocument: 'after' });
  }

  markSessionReplaced(sessionId, replacementId, revokedAt = new Date()) {
    return AuthSession.findByIdAndUpdate(sessionId, { revokedAt, replacedBy: replacementId }, { returnDocument: 'after' });
  }

  revokeUserSessions(userId, revokedAt = new Date()) {
    return AuthSession.updateMany({ user: userId, revokedAt: { $exists: false } }, { revokedAt });
  }
}

module.exports = new AuthRepository();
module.exports.AuthRepository = AuthRepository;
