const authorApplicationService = require('../services/authorApplicationService');

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message
});

const submitAuthorApplication = async (req, res) => {
  try {
    const application = await authorApplicationService.submit(req.user, req.body);
    res.status(201).json({ success: true, application });
  } catch (error) {
    sendError(res, error);
  }
};

const getMyAuthorApplication = async (req, res) => {
  try {
    const application = await authorApplicationService.getMyApplication(req.user);
    res.json({ success: true, application });
  } catch (error) {
    sendError(res, error);
  }
};

const listAuthorApplications = async (req, res) => {
  try {
    const applications = await authorApplicationService.list(req.query);
    res.json({ success: true, data: applications });
  } catch (error) {
    sendError(res, error);
  }
};

const updateAuthorApplicationStatus = async (req, res) => {
  try {
    const application = await authorApplicationService.updateStatus(req.params.id, req.body.status, req.user);
    res.json({ success: true, data: application });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  submitAuthorApplication,
  getMyAuthorApplication,
  listAuthorApplications,
  updateAuthorApplicationStatus
};
