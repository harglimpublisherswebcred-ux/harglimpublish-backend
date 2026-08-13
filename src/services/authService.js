const crypto = require('crypto');
const authRepository = require('../repositories/authRepository');
const googleIdentityProvider = require('./googleIdentityProvider');
const { sendWelcomeEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

const REFRESH_TOKEN_BYTES = 48;
const DEFAULT_REFRESH_DAYS = 30;

const toAuthUser = (user) => ({
  _id: user.id || user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const serviceError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const refreshExpiry = () => {
  const days = Math.max(parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS, 10) || DEFAULT_REFRESH_DAYS, 1);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

class AuthService {
  constructor(repository = authRepository, googleProvider = googleIdentityProvider) {
    this.repository = repository;
    this.googleProvider = googleProvider;
  }

  async issueTokens(user, context = {}) {
    const refreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const session = await this.repository.createSession({
      user: user._id,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt: refreshExpiry(),
      lastUsedAt: new Date()
    });

    return {
      user: toAuthUser(user),
      token: generateToken(user._id),
      refreshToken,
      refreshTokenExpiresAt: session.expiresAt
    };
  }

  async register({ name, email, password }, context = {}) {
    const existing = await this.repository.findUserByEmail(email);
    if (existing) throw serviceError('User already exists', 400);

    const user = await this.repository.createUser({
      name,
      email,
      password,
      role: 'reader'
    });

    if (!user) throw serviceError('Invalid user data', 400);

    sendWelcomeEmail(user);

    return this.issueTokens(user, context);
  }

  async login({ email, password }, context = {}) {
    const user = await this.repository.findUserByEmail(email, { includePassword: true });
    if (!user || !(await user.matchPassword(password))) {
      throw serviceError('Invalid credentials', 401);
    }

    if (user.isActive === false) throw serviceError('User account is inactive', 403);

    return this.issueTokens(user, context);
  }

  async loginWithGoogle({ credential }, context = {}) {
    const identity = await this.googleProvider.verifyCredential(credential);

    let authIdentity = await this.repository.findAuthIdentity(identity.provider, identity.providerSubject, { populateUser: true });
    if (authIdentity) {
      const user = authIdentity.user;
      if (!user) throw serviceError('Linked account was not found', 404, 'GOOGLE_IDENTITY_USER_NOT_FOUND');
      if (user.isActive === false) throw serviceError('User account is inactive', 403, 'USER_INACTIVE');

      await this.repository.updateAuthIdentity(authIdentity._id, {
        providerEmail: identity.email,
        emailVerified: identity.emailVerified,
        profilePicture: identity.picture,
        lastLoginAt: new Date()
      });

      logger.info('auth.google_login_success', {
        provider: identity.provider,
        userId: user._id,
        isNewUser: false
      });
      return this.issueTokens(user, context);
    }

    const existingEmailUser = await this.repository.findUserByEmail(identity.email);
    if (existingEmailUser) {
      throw serviceError(
        'An HM account already exists for this email. Sign in to the existing account before linking Google.',
        409,
        'ACCOUNT_LINK_REQUIRED'
      );
    }

    try {
      const user = await this.repository.createUser({
        name: identity.name,
        email: identity.email,
        profilePicture: identity.picture,
        role: 'reader'
      });

      await this.repository.createAuthIdentity({
        user: user._id,
        provider: identity.provider,
        providerSubject: identity.providerSubject,
        providerEmail: identity.email,
        emailVerified: identity.emailVerified,
        profilePicture: identity.picture,
        lastLoginAt: new Date()
      });

      sendWelcomeEmail(user);
      logger.info('auth.google_login_success', {
        provider: identity.provider,
        userId: user._id,
        isNewUser: true
      });
      return this.issueTokens(user, context);
    } catch (error) {
      if (error && error.code === 11000) {
        authIdentity = await this.repository.findAuthIdentity(identity.provider, identity.providerSubject, { populateUser: true });
        if (authIdentity && authIdentity.user) {
          if (authIdentity.user.isActive === false) throw serviceError('User account is inactive', 403, 'USER_INACTIVE');
          return this.issueTokens(authIdentity.user, context);
        }
        throw serviceError(
          'An HM account already exists for this email. Sign in to the existing account before linking Google.',
          409,
          'ACCOUNT_LINK_REQUIRED'
        );
      }
      throw error;
    }
  }

  async refresh({ userId, refreshToken }, context = {}) {
    if (refreshToken) {
      const session = await this.repository.findSessionByRefreshTokenHash(hashToken(refreshToken));
      if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
        throw serviceError('Invalid or expired refresh token', 401);
      }

      const user = await this.repository.findUserById(session.user);
      if (!user || user.isActive === false) throw serviceError('User not found', 404);

      const rotated = await this.issueTokens(user, context);
      const replacement = await this.repository.findSessionByRefreshTokenHash(hashToken(rotated.refreshToken));
      await this.repository.markSessionReplaced(session._id, replacement && replacement._id);
      return rotated;
    }

    const user = await this.repository.findUserById(userId);
    if (!user) throw serviceError('User not found', 404);
    return this.issueTokens(user, context);
  }

  async logout({ userId, refreshToken, all = false } = {}) {
    if (all && userId) {
      await this.repository.revokeUserSessions(userId);
      return { message: 'Logged out from all sessions' };
    }

    if (refreshToken) {
      const session = await this.repository.findSessionByRefreshTokenHash(hashToken(refreshToken));
      if (session) await this.repository.revokeSession(session._id);
    }

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) return { message: 'If an account exists, a reset token has been generated' };
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await this.repository.saveUser(user);
    return {
      message: 'Password reset token generated',
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    };
  }

  async resetPassword(token, password, context = {}) {
    if (!password || String(password).length < 6) throw serviceError('Password must be at least 6 characters', 400);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.repository.findUserByResetToken(tokenHash);
    if (!user) throw serviceError('Invalid or expired reset token', 400);
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await this.repository.saveUser(user);
    await this.repository.revokeUserSessions(user._id);
    return this.issueTokens(user, context);
  }

  async changePassword(userId, currentPassword, nextPassword, context = {}) {
    if (!nextPassword || String(nextPassword).length < 6) throw serviceError('Password must be at least 6 characters', 400);
    const user = await this.repository.findUserById(userId).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) throw serviceError('Invalid current password', 401);
    user.password = nextPassword;
    await this.repository.saveUser(user);
    await this.repository.revokeUserSessions(user._id);
    return this.issueTokens(user, context);
  }

  getCurrentUser(userId) {
    return this.repository.findUserById(userId);
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;
