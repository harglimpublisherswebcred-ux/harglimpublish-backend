const authorAccessRepository = require('../repositories/authorAccessRepository');
const paymentRepository = require('../repositories/paymentRepository');
const paymentService = require('./paymentService');
const User = require('../models/User');
const logger = require('../utils/logger');
const { getFeatureFlags, isPaidAuthorDashboardAccessEnabled } = require('../config/features');

const maskReference = (value) => {
  if (!value) return undefined;
  const normalized = String(value);
  if (normalized.length <= 4) return '****';
  return `${'*'.repeat(Math.max(normalized.length - 4, 4))}${normalized.slice(-4)}`;
};

class AuthorAccessError extends Error {
  constructor(message, code = 'AUTHOR_ACCESS_ERROR', status = 400, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.statusCode = status;
    this.details = details;
  }
}

class AuthorAccessPlanNotFoundError extends AuthorAccessError {
  constructor(message = 'Author access plan not found', details = {}) {
    super(message, 'AUTHOR_ACCESS_PLAN_NOT_FOUND', 404, details);
  }
}

class AuthorAccessPlanNotActiveError extends AuthorAccessError {
  constructor(message = 'No active author access plan available', details = {}) {
    super(message, 'AUTHOR_ACCESS_PLAN_NOT_ACTIVE', 400, details);
  }
}

class AuthorAccessAlreadyHasEntitlementError extends AuthorAccessError {
  constructor(message = 'Author already has active dashboard access entitlement', details = {}) {
    super(message, 'AUTHOR_DASHBOARD_ALREADY_ACTIVE', 400, details);
  }
}

class AuthorAccessRevokedError extends AuthorAccessError {
  constructor(message = 'Author dashboard access was administratively revoked', details = {}) {
    super(message, 'AUTHOR_DASHBOARD_ACCESS_REVOKED', 403, details);
  }
}

class AuthorAccessInvalidPaymentError extends AuthorAccessError {
  constructor(message = 'Invalid payment for author access purchase', details = {}) {
    super(message, 'INVALID_AUTHOR_ACCESS_PAYMENT', 400, details);
  }
}

class AuthorAccessUnauthorizedError extends AuthorAccessError {
  constructor(message = 'Unauthorized author access operation', details = {}) {
    super(message, 'AUTHOR_ACCESS_UNAUTHORIZED', 403, details);
  }
}

class AuthorDashboardPaidAccessDisabledError extends AuthorAccessError {
  constructor(message = 'Paid author dashboard access is currently disabled', details = {}) {
    super(message, 'AUTHOR_DASHBOARD_PAID_ACCESS_DISABLED', 409, details);
  }
}

class AuthorAccessService {
  constructor({
    repository = authorAccessRepository,
    paymentRepo = paymentRepository,
    paymentSvc = paymentService,
    userModel = User
  } = {}) {
    this.authorAccessRepository = repository;
    this.paymentRepository = paymentRepo;
    this.paymentService = paymentSvc;
    this.User = userModel;
  }

  async getAuthorDashboardStatus(user) {
    if (!user || user.role !== 'author') {
      return {
        author: false,
        dashboardAccess: {
          status: 'NOT_AUTHOR',
          hasAccess: false
        },
        features: getFeatureFlags()
      };
    }

    const entitlement = await this.authorAccessRepository.findEntitlementByUserId(user._id);
    const paidAccessEnabled = isPaidAuthorDashboardAccessEnabled();
    if (entitlement) {
      if (entitlement.status === 'ACTIVE') {
        return {
          author: true,
          dashboardAccess: {
            status: 'ACTIVE',
            hasAccess: true,
            grantedAt: entitlement.grantedAt,
            source: entitlement.source
          },
          features: getFeatureFlags()
        };
      }

      if (entitlement.status === 'REVOKED') {
        return {
          author: true,
          dashboardAccess: {
            status: 'REVOKED',
            hasAccess: !paidAccessEnabled,
            revokedAt: entitlement.revokedAt,
            reason: entitlement.revocationReason
          },
          features: getFeatureFlags()
        };
      }
    }

    const pendingPurchase = await this.authorAccessRepository.findPendingPurchaseForUser(user._id);
    if (pendingPurchase) {
      let paymentState = 'PAYMENT_PENDING';
      let paymentDoc = null;
      if (pendingPurchase.payment) {
        paymentDoc = await this.paymentRepository.findById(pendingPurchase.payment);
        if (paymentDoc) {
          if (
            paymentDoc.status === 'PAYMENT_SUBMITTED' ||
            paymentDoc.status === 'VERIFICATION_PENDING' ||
            paymentDoc.status === 'SUBMITTED' ||
            Boolean(paymentDoc.utr)
          ) {
            paymentState = 'VERIFICATION_PENDING';
          } else if (paymentDoc.status === 'PAYMENT_VERIFIED') {
            // Reconcile if payment is already verified but entitlement was missing
            await this.grantEntitlementOnVerifiedPayment(paymentDoc._id);
            return this.getAuthorDashboardStatus(user);
          }
        }
      }

      return {
        author: true,
        dashboardAccess: {
          status: paymentState,
          hasAccess: !paidAccessEnabled,
          purchaseId: pendingPurchase._id,
          paymentId: pendingPurchase.payment
        },
        plan: {
          id: pendingPurchase.plan,
          name: pendingPurchase.planNameSnapshot,
            amount: pendingPurchase.amount,
            currency: pendingPurchase.currency
        },
        features: getFeatureFlags()
      };
    }

    const activePlan = await this.authorAccessRepository.findActivePlan();
    return {
      author: true,
      dashboardAccess: {
        status: 'APPROVED_AUTHOR_NO_PLAN',
        hasAccess: !paidAccessEnabled
      },
      plan: activePlan
        ? {
            id: activePlan._id,
            name: activePlan.name,
            amount: activePlan.amount,
            currency: activePlan.currency
          }
        : null,
      features: getFeatureFlags()
    };
  }

  async createDashboardAccessPurchase(user, options = {}) {
    if (!user || user.role !== 'author') {
      throw new AuthorAccessUnauthorizedError('Only approved authors can purchase dashboard access');
    }

    if (!isPaidAuthorDashboardAccessEnabled()) {
      throw new AuthorDashboardPaidAccessDisabledError();
    }

    const existingEntitlement = await this.authorAccessRepository.findEntitlementByUserId(user._id);
    if (existingEntitlement) {
      if (existingEntitlement.status === 'ACTIVE') {
        throw new AuthorAccessAlreadyHasEntitlementError('Author already has active dashboard access entitlement');
      }
      if (existingEntitlement.status === 'REVOKED') {
        throw new AuthorAccessRevokedError('Author dashboard access was administratively revoked. Please contact support.');
      }
    }

    const existingPending = await this.authorAccessRepository.findPendingPurchaseForUser(user._id);
    if (existingPending && existingPending.payment) {
      const existingPayment = await this.paymentRepository.findById(existingPending.payment);
      if (existingPayment && (existingPayment.status === 'INTENT_CREATED' || existingPayment.status === 'PAYMENT_SUBMITTED')) {
        const qrResponse = await this.paymentService.toQRCodeResponse(existingPayment);
        return {
          purchase: existingPending,
          payment: qrResponse,
          isExistingPending: true
        };
      }
    }

    const activePlan = await this.authorAccessRepository.findActivePlan();
    if (!activePlan) {
      throw new AuthorAccessPlanNotActiveError('No active author dashboard plan is currently configured by admin');
    }

    const purchase = await this.authorAccessRepository.createPurchase(
      {
        user: user._id,
        plan: activePlan._id,
        planVersion: activePlan.version || 1,
        planNameSnapshot: activePlan.name,
        amount: activePlan.amount,
        currency: activePlan.currency || 'INR',
        status: 'PENDING'
      },
      options
    );

    const payment = await this.paymentService.createPaymentIntent(
      {
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_ACCESS_PURCHASE',
        subjectId: purchase._id,
        user: user._id,
        amount: purchase.amount,
        currency: purchase.currency,
        provider: 'manual_upi'
      },
      options
    );

    purchase.payment = payment._id;
    await purchase.save(options);

    const qr = await this.paymentService.generateQRCode(payment._id, {
      userId: user._id,
      amount: purchase.amount,
      orderReference: `AUTH-${purchase._id.toString().slice(-6)}`,
      transactionNote: `Author Access Plan ${purchase.planNameSnapshot}`,
      actor: { userId: user._id },
      actorType: 'CUSTOMER'
    });

    const qrResponse = await this.paymentService.toQRCodeResponse(payment, qr);

    logger.info('author_access.purchase_created', {
      service: 'hm-backend',
      userId: user._id.toString(),
      purchaseId: purchase._id.toString(),
      paymentId: payment._id.toString(),
      amount: purchase.amount
    });

    return {
      purchase,
      payment: qrResponse
    };
  }

  async submitPurchaseUTR(user, purchaseId, utr, options = {}) {
    const purchase = await this.authorAccessRepository.findPurchaseById(purchaseId);
    if (!purchase || String(purchase.user) !== String(user._id)) {
      throw new AuthorAccessUnauthorizedError('Purchase not found or unauthorized');
    }

    if (!purchase.payment) {
      throw new AuthorAccessInvalidPaymentError('Purchase has no associated payment');
    }

    const updatedPayment = await this.paymentService.submitUTR(purchase.payment, utr, { userId: user._id }, options);

    logger.info('author_access.utr_submitted', {
      service: 'hm-backend',
      purchaseId: purchase._id.toString(),
      paymentId: purchase.payment.toString(),
      maskedUtr: maskReference(utr)
    });

    return {
      purchase,
      payment: updatedPayment
    };
  }

  async grantEntitlementOnVerifiedPayment(paymentId, options = {}) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new AuthorAccessInvalidPaymentError(`Payment not found: ${paymentId}`);
    }

    if (payment.purpose !== 'AUTHOR_ACCESS' || payment.subjectType !== 'AUTHOR_ACCESS_PURCHASE') {
      logger.info('author_access.subscriber_ignored_non_author_payment', {
        service: 'hm-backend',
        paymentId: payment._id.toString(),
        purpose: payment.purpose,
        subjectType: payment.subjectType
      });
      return { granted: false, reason: 'NOT_AUTHOR_ACCESS_PURCHASE' };
    }

    if (payment.status !== 'PAYMENT_VERIFIED') {
      logger.warn('author_access.subscriber_unverified_payment', {
        service: 'hm-backend',
        paymentId: payment._id.toString(),
        status: payment.status
      });
      return { granted: false, reason: 'PAYMENT_NOT_VERIFIED' };
    }

    const purchase = await this.authorAccessRepository.findPurchaseById(payment.subjectId);
    if (!purchase) {
      logger.error('author_access.purchase_not_found_for_payment', {
        service: 'hm-backend',
        paymentId: payment._id.toString(),
        subjectId: payment.subjectId
      });
      return { granted: false, reason: 'PURCHASE_NOT_FOUND' };
    }

    if (String(purchase.user) !== String(payment.user) || purchase.amount !== payment.amount) {
      logger.error('author_access.invariant_violation', {
        service: 'hm-backend',
        paymentId: payment._id.toString(),
        purchaseId: purchase._id.toString()
      });
      throw new AuthorAccessInvalidPaymentError('Payment invariants do not match purchase');
    }

    if (purchase.status !== 'PAID') {
      purchase.status = 'PAID';
      purchase.paidAt = new Date();
      await purchase.save(options);
    }

    const existingEntitlement = await this.authorAccessRepository.findEntitlementByUserId(payment.user);
    if (existingEntitlement) {
      // SECURITY RULE: If entitlement is REVOKED by admin, replayed PaymentVerified MUST NOT override revocation!
      if (existingEntitlement.status === 'REVOKED') {
        logger.warn('author_access.replayed_payment_ignored_for_revoked_entitlement', {
          service: 'hm-backend',
          userId: payment.user.toString(),
          paymentId: payment._id.toString()
        });
        return { granted: false, reason: 'ENTITLEMENT_REVOKED_BY_ADMIN' };
      }

      if (existingEntitlement.status !== 'ACTIVE') {
        existingEntitlement.status = 'ACTIVE';
        existingEntitlement.grantedAt = new Date();
        existingEntitlement.source = 'PURCHASE';
        existingEntitlement.purchase = purchase._id;
        await existingEntitlement.save(options);
      }

      return { granted: true, entitlement: existingEntitlement };
    }

    const newEntitlement = await this.authorAccessRepository.createEntitlement(
      {
        user: payment.user,
        feature: 'AUTHOR_DASHBOARD',
        status: 'ACTIVE',
        source: 'PURCHASE',
        purchase: purchase._id,
        grantedAt: new Date()
      },
      options
    );

    logger.info('author_access.entitlement_granted', {
      service: 'hm-backend',
      userId: payment.user.toString(),
      purchaseId: purchase._id.toString(),
      entitlementId: newEntitlement._id.toString()
    });

    return { granted: true, entitlement: newEntitlement };
  }

  async adminGrantEntitlement(adminUser, targetUserId, reason = 'Admin manual grant', options = {}) {
    const targetUser = await this.User.findById(targetUserId);
    if (!targetUser || targetUser.role !== 'author') {
      throw new AuthorAccessUnauthorizedError('Target user must be an approved author');
    }

    const existingEntitlement = await this.authorAccessRepository.findEntitlementByUserId(targetUserId);
    if (existingEntitlement) {
      existingEntitlement.status = 'ACTIVE';
      existingEntitlement.source = 'ADMIN_GRANT';
      existingEntitlement.grantedAt = new Date();
      existingEntitlement.grantedBy = adminUser._id;
      existingEntitlement.restoredAt = new Date();
      existingEntitlement.restoredBy = adminUser._id;
      await existingEntitlement.save(options);
      return existingEntitlement;
    }

    const entitlement = await this.authorAccessRepository.createEntitlement(
      {
        user: targetUserId,
        feature: 'AUTHOR_DASHBOARD',
        status: 'ACTIVE',
        source: 'ADMIN_GRANT',
        grantedAt: new Date(),
        grantedBy: adminUser._id
      },
      options
    );

    logger.info('author_access.admin_grant', {
      service: 'hm-backend',
      adminId: adminUser._id.toString(),
      targetUserId: targetUserId.toString(),
      reason
    });

    return entitlement;
  }

  async adminRevokeEntitlement(adminUser, targetUserId, reason = 'Administratively revoked', options = {}) {
    const entitlement = await this.authorAccessRepository.findEntitlementByUserId(targetUserId);
    if (!entitlement) {
      throw new AuthorAccessError('No entitlement found for author', 'ENTITLEMENT_NOT_FOUND', 404);
    }

    entitlement.status = 'REVOKED';
    entitlement.revokedAt = new Date();
    entitlement.revokedBy = adminUser._id;
    entitlement.revocationReason = reason;
    await entitlement.save(options);

    logger.info('author_access.admin_revoke', {
      service: 'hm-backend',
      adminId: adminUser._id.toString(),
      targetUserId: targetUserId.toString(),
      reason
    });

    return entitlement;
  }

  async adminRestoreEntitlement(adminUser, targetUserId, reason = 'Administratively restored', options = {}) {
    const entitlement = await this.authorAccessRepository.findEntitlementByUserId(targetUserId);
    if (!entitlement) {
      throw new AuthorAccessError('No entitlement found for author', 'ENTITLEMENT_NOT_FOUND', 404);
    }

    entitlement.status = 'ACTIVE';
    entitlement.restoredAt = new Date();
    entitlement.restoredBy = adminUser._id;
    await entitlement.save(options);

    logger.info('author_access.admin_restore', {
      service: 'hm-backend',
      adminId: adminUser._id.toString(),
      targetUserId: targetUserId.toString(),
      reason
    });

    return entitlement;
  }

  async adminConfigurePlan(adminUser, planData, options = {}) {
    if (planData.status === 'ACTIVE') {
      await this.authorAccessRepository.deactivateAllActivePlans(options);
    }

    if (planData.id) {
      const existing = await this.authorAccessRepository.findPlanById(planData.id);
      if (!existing) {
        throw new AuthorAccessPlanNotFoundError();
      }
      const updated = await this.authorAccessRepository.updatePlan(
        planData.id,
        {
          ...planData,
          updatedBy: adminUser._id,
          activatedAt: planData.status === 'ACTIVE' ? new Date() : existing.activatedAt,
          activatedBy: planData.status === 'ACTIVE' ? adminUser._id : existing.activatedBy
        },
        options
      );
      return updated;
    }

    const activePlan = await this.authorAccessRepository.findActivePlan();
    const nextVersion = activePlan ? (activePlan.version || 1) + 1 : 1;

    const plan = await this.authorAccessRepository.createPlan(
      {
        name: planData.name || 'Author Dashboard Access',
        description: planData.description || 'One-time author dashboard operational access plan',
        amount: planData.amount,
        currency: planData.currency || 'INR',
        status: planData.status || 'ACTIVE',
        version: nextVersion,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
        activatedAt: planData.status === 'ACTIVE' ? new Date() : undefined,
        activatedBy: planData.status === 'ACTIVE' ? adminUser._id : undefined
      },
      options
    );

    logger.info('author_access.plan_configured', {
      service: 'hm-backend',
      adminId: adminUser._id.toString(),
      planId: plan._id.toString(),
      amount: plan.amount,
      status: plan.status
    });

    return plan;
  }
}

module.exports = new AuthorAccessService();
module.exports.AuthorAccessService = AuthorAccessService;
module.exports.AuthorAccessError = AuthorAccessError;
module.exports.AuthorAccessPlanNotFoundError = AuthorAccessPlanNotFoundError;
module.exports.AuthorAccessPlanNotActiveError = AuthorAccessPlanNotActiveError;
module.exports.AuthorAccessAlreadyHasEntitlementError = AuthorAccessAlreadyHasEntitlementError;
module.exports.AuthorAccessRevokedError = AuthorAccessRevokedError;
module.exports.AuthorAccessInvalidPaymentError = AuthorAccessInvalidPaymentError;
module.exports.AuthorAccessUnauthorizedError = AuthorAccessUnauthorizedError;
module.exports.AuthorDashboardPaidAccessDisabledError = AuthorDashboardPaidAccessDisabledError;
