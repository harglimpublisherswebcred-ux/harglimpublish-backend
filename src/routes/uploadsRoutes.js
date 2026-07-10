const express = require('express');
const router = express.Router();
const { uploadImage, uploadDocument } = require('../controllers/uploadController');
const { upload, requireCloudinaryConfig, handleUploadError } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

router.post('/image', protect, requireCloudinaryConfig, upload.single('image'), handleUploadError, uploadImage);
router.post('/document', protect, requireCloudinaryConfig, upload.single('document'), handleUploadError, uploadDocument);

module.exports = router;
