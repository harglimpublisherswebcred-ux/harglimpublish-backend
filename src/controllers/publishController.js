const publishingService = require('../services/publishingService');

// @desc    Submit a manuscript publish request
// @route   POST /api/publish-requests
// @access  Private (Author)
const createPublishRequest = async (req, res) => {
  try {
    const publishRequest = await publishingService.createPublishRequest(req.user, req.body);

    res.status(201).json({
      success: true,
      data: {
        publishRequest
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get all publish packages
// @route   GET /api/publish-packages
// @access  Public
const getPublishPackages = async (req, res) => {
  try {
    const packages = await publishingService.listActivePackages();
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listAdminPublishPackages = async (req, res) => {
  try {
    const result = await publishingService.listPackages(req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAdminPublishPackage = async (req, res) => {
  try {
    res.json({ success: true, data: await publishingService.getPackage(req.params.id) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const createPublishPackage = async (req, res) => {
  try {
    res.status(201).json({ success: true, data: await publishingService.createPackage(req.body) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const updatePublishPackage = async (req, res) => {
  try {
    res.json({ success: true, data: await publishingService.updatePackage(req.params.id, req.body) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const archivePublishPackage = async (req, res) => {
  try {
    res.json({ success: true, data: await publishingService.archivePackage(req.params.id) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPublishRequest,
  getPublishPackages,
  listAdminPublishPackages,
  getAdminPublishPackage,
  createPublishPackage,
  updatePublishPackage,
  archivePublishPackage
};
