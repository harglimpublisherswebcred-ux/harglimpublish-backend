const contactService = require('../services/contactService');

const submitContactRequest = async (req, res) => {
  try {
    const data = await contactService.submit(req.body, {
      requestId: req.id,
      ip: req.ip
    });
    res.status(201).json({
      success: true,
      message: 'Contact request submitted successfully',
      data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  submitContactRequest
};
