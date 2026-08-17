const authorAccessService = require('../services/authorAccessService');

const sendAuthorAccessError = (res, error) => res.status(error.statusCode || error.status || 500).json({
  success: false,
  ...(error.code && { error: error.code }),
  message: error.message || 'Internal Server Error'
});

exports.getDashboardAccessStatus = async (req, res) => {
  try {
    const status = await authorAccessService.getAuthorDashboardStatus(req.user);
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    sendAuthorAccessError(res, error);
  }
};

exports.initiatePurchase = async (req, res) => {
  try {
    const result = await authorAccessService.createDashboardAccessPurchase(req.user);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    sendAuthorAccessError(res, error);
  }
};

exports.submitPurchaseUTR = async (req, res) => {
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
    sendAuthorAccessError(res, error);
  }
};
