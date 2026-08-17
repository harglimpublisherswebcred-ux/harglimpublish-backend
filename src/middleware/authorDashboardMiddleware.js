const authorAccessRepository = require('../repositories/authorAccessRepository');
const { isPaidAuthorDashboardAccessEnabled } = require('../config/features');

const requireAuthorDashboardAccess = (repository = authorAccessRepository) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      if (req.user.role === 'admin') {
        return next();
      }

      if (req.user.role !== 'author') {
        return res.status(403).json({
          success: false,
          error: 'AUTHOR_ROLE_REQUIRED',
          message: 'Author role required for this action'
        });
      }

      // Check ownership if route contains target author ID param
      const isMeRoute = req.originalUrl && req.originalUrl.includes('/me/');
      const targetAuthorId = req.params.authorId || (!isMeRoute ? req.params.id : null);
      if (targetAuthorId && String(targetAuthorId) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          error: 'AUTHOR_DASHBOARD_ACCESS_DENIED',
          message: 'Cannot access another author dashboard'
        });
      }

      if (!isPaidAuthorDashboardAccessEnabled()) {
        return next();
      }

      const entitlement = await repository.findEntitlementByUserId(req.user._id);

      if (!entitlement || entitlement.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          error: 'AUTHOR_DASHBOARD_ACCESS_REQUIRED',
          message: 'Author dashboard operational access required. Please purchase or request access entitlement.'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireAuthorDashboardAccess: requireAuthorDashboardAccess()
};
module.exports.createRequireAuthorDashboardAccess = requireAuthorDashboardAccess;
