const logger = require('../utils/logger');

// @desc    Upload an image
// @route   POST /api/uploads/image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    logger.info('upload.completed', {
      requestId: req.id,
      type: 'image',
      path: req.originalUrl,
      durationMs: req.uploadStartedAt ? Date.now() - req.uploadStartedAt : undefined,
      bytes: req.file.size,
      url: req.file.path
    });
    
    res.status(200).json({
      success: true,
      data: {
        url: req.file.path // Cloudinary returns the secure URL in path
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload a document/manuscript
// @route   POST /api/uploads/document
// @access  Private (Author/Admin)
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document file' });
    }

    logger.info('upload.completed', {
      requestId: req.id,
      type: 'document',
      path: req.originalUrl,
      durationMs: req.uploadStartedAt ? Date.now() - req.uploadStartedAt : undefined,
      bytes: req.file.size,
      url: req.file.path
    });
    
    res.status(200).json({
      success: true,
      data: {
        url: req.file.path // Cloudinary returns the secure URL in path
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadImage,
  uploadDocument
};
