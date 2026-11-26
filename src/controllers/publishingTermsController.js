const publishingTermsService = require('../services/publishingTermsService');

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  ...(error.code ? { error: error.code } : {}),
  message: error.message
});

const getCurrentTerms = async (req, res) => {
  try {
    res.json({ success: true, data: await publishingTermsService.getPublicTerms() });
  } catch (error) {
    sendError(res, error);
  }
};

const getMyTermsStatus = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: await publishingTermsService.getStatus(req.user) });
  } catch (error) {
    sendError(res, error);
  }
};

const acceptCurrentTerms = async (req, res) => {
  try {
    const data = await publishingTermsService.accept(req.user, req.body, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = { getCurrentTerms, getMyTermsStatus, acceptCurrentTerms };
