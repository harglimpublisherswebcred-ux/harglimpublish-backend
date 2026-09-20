const express = require('express');
const router = express.Router();
const { uploadImage, uploadDocument } = require('../controllers/uploadController');
const { upload, logUploadStart, requireCloudinaryConfig, handleUploadError } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/image', protect, requireCloudinaryConfig, logUploadStart, upload.single('image'), handleUploadError, uploadImage);
router.post('/document', protect, requireCloudinaryConfig, logUploadStart, upload.single('document'), handleUploadError, uploadDocument);

router.post('/publishing-document', protect, authorize('author', 'admin'), requireCloudinaryConfig, logUploadStart, upload.single('document'), handleUploadError, uploadDocument);
router.post('/publishing-image', protect, authorize('author', 'admin'), requireCloudinaryConfig, logUploadStart, upload.single('image'), handleUploadError, uploadImage);

module.exports = router;
