const userService = require('../services/userService');

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message
});

const updateAuthorProfile = async (req, res) => {
  try {
    const data = await userService.updateAuthorProfile(req.params.id, req.user, req.body);
    res.json({
      success: true,
      message: 'Author profile updated successfully',
      data
    });
  } catch (error) {
    sendError(res, error);
  }
};

const updateAuthorPaymentDetails = async (req, res) => {
  try {
    const data = await userService.updateAuthorPaymentDetails(req.params.id, req.user, req.body);
    res.json({
      success: true,
      message: 'Payment and payout details saved securely',
      data
    });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  updateAuthorProfile,
  updateAuthorPaymentDetails
};
