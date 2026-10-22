const contentService = require('../services/contentService');

const sendContent = (res, content) => res.json({ success: true, data: content, ...content });

const getContent = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache');
    sendContent(res, await contentService.getGlobalContent());
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAdminContent = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache');
    sendContent(res, await contentService.getAdminContent());
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const updateContent = async (req, res) => {
  try {
    sendContent(res, await contentService.updateGlobalContent(req.body, req.user));
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getContent,
  getAdminContent,
  updateContent,
};
