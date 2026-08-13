const authorAccessService = require('../services/authorAccessService');

exports.getDashboardAccessStatus = async (req, res, next) => {
  try {
    const status = await authorAccessService.getAuthorDashboardStatus(req.user);
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

exports.initiatePurchase = async (req, res, next) => {
  try {
    const result = await authorAccessService.createDashboardAccessPurchase(req.user);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.submitPurchaseUTR = async (req, res, next) => {
  try {
    const { utr } = req.body;
    const { purchaseId } = req.params;
    if (!utr) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_UTR',
        message: 'UTR is required'
      });
    }

    const result = await authorAccessService.submitPurchaseUTR(req.user, purchaseId, utr);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
