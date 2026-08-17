const User = require('../models/User');
const AuthorApplication = require('../models/AuthorApplication');
const AuthorAccessEntitlement = require('../models/AuthorAccessEntitlement');
const AuthorAccessPurchase = require('../models/AuthorAccessPurchase');
const { getFeatureFlags, isPaidAuthorDashboardAccessEnabled } = require('../config/features');

class UserContextService {
  async getUserContext(actor) {
    const userId = actor.id || actor._id;
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isAuthorRole = user.role === 'author';
    const isAdminRole = user.role === 'admin';
    const isApprovedAuthor = isAuthorRole;
    const paidAuthorDashboardAccessEnabled = isPaidAuthorDashboardAccessEnabled();

    let authorApplicationStatus = 'NOT_APPLIED';
    if (isAuthorRole || user.role === 'reader') {
      const application = await AuthorApplication.findOne({ user: user._id }).sort('-createdAt').lean();
      if (application) {
        authorApplicationStatus = application.status.toUpperCase();
      }
    } else if (isAdminRole) {
      authorApplicationStatus = 'NOT_APPLICABLE';
    }

    let dashboardAccessStatus = 'NOT_AUTHOR';
    let hasActiveEntitlement = false;

    if (isAdminRole) {
      dashboardAccessStatus = 'ACTIVE';
      hasActiveEntitlement = true;
    } else if (isAuthorRole) {
      const entitlement = await AuthorAccessEntitlement.findOne({ user: user._id }).lean();
      if (entitlement) {
        if (entitlement.status === 'ACTIVE') {
          dashboardAccessStatus = 'ACTIVE';
          hasActiveEntitlement = true;
        } else if (entitlement.status === 'REVOKED') {
          dashboardAccessStatus = 'REVOKED';
        }
      } else {
        const latestPurchase = await AuthorAccessPurchase.findOne({ user: user._id }).sort('-createdAt').lean();
        if (latestPurchase) {
          if (latestPurchase.status === 'VERIFICATION_PENDING') {
            dashboardAccessStatus = 'VERIFICATION_PENDING';
          } else if (latestPurchase.status === 'PAYMENT_PENDING') {
            dashboardAccessStatus = 'PAYMENT_PENDING';
          } else {
            dashboardAccessStatus = 'NOT_PURCHASED';
          }
        } else {
          dashboardAccessStatus = 'NOT_PURCHASED';
        }
      }
    }

    const capabilities = {
      canPublish: isAdminRole || isApprovedAuthor,
      canAccessAuthorDashboard: isAdminRole || (isApprovedAuthor && !paidAuthorDashboardAccessEnabled) || hasActiveEntitlement,
      canAdminister: isAdminRole
    };

    const states = {
      authorApplicationStatus,
      dashboardAccessStatus,
      publishingStatus: isAdminRole ? 'NOT_APPLICABLE' : isApprovedAuthor ? 'APPROVED' : 'NOT_APPROVED'
    };

    return {
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture || null,
        createdAt: user.createdAt
      },
      capabilities,
      states,
      features: getFeatureFlags()
    };
  }
}

module.exports = new UserContextService();
module.exports.UserContextService = UserContextService;
