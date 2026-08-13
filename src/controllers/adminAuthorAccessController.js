const authorAccessService = require('../services/authorAccessService');
const authorAccessRepository = require('../repositories/authorAccessRepository');

exports.listPlans = async (req, res, next) => {
  try {
    const plans = await authorAccessRepository.findPlans();
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await authorAccessService.adminConfigurePlan(req.user, req.body);
    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await authorAccessService.adminConfigurePlan(req.user, { id: req.params.id, ...req.body });
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

exports.activatePlan = async (req, res, next) => {
  try {
    const plan = await authorAccessService.adminConfigurePlan(req.user, { id: req.params.id, status: 'ACTIVE' });
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

exports.archivePlan = async (req, res, next) => {
  try {
    const plan = await authorAccessService.adminConfigurePlan(req.user, { id: req.params.id, status: 'ARCHIVED' });
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

exports.listPurchases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;

    const result = await authorAccessRepository.findPurchases(filter, { page, limit });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.listEntitlements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;

    const result = await authorAccessRepository.findEntitlements(filter, { page, limit });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.grantEntitlement = async (req, res, next) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID',
        message: 'userId is required'
      });
    }

    const entitlement = await authorAccessService.adminGrantEntitlement(req.user, userId, reason);
    res.status(200).json({
      success: true,
      data: entitlement
    });
  } catch (error) {
    next(error);
  }
};

exports.revokeEntitlement = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const { reason } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID',
        message: 'userId is required'
      });
    }

    const entitlement = await authorAccessService.adminRevokeEntitlement(req.user, userId, reason);
    res.status(200).json({
      success: true,
      data: entitlement
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreEntitlement = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const { reason } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID',
        message: 'userId is required'
      });
    }

    const entitlement = await authorAccessService.adminRestoreEntitlement(req.user, userId, reason);
    res.status(200).json({
      success: true,
      data: entitlement
    });
  } catch (error) {
    next(error);
  }
};
