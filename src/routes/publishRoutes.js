const express = require('express');
const router = express.Router();
const { 
  createPublishRequest,
  getPublishPackages
} = require('../controllers/publishController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getCurrentTerms,
  getMyTermsStatus,
  acceptCurrentTerms
} = require('../controllers/publishingTermsController');

router.get('/publishing-terms', getCurrentTerms);
router.get('/authors/me/publishing-terms', protect, authorize('author', 'admin'), getMyTermsStatus);
router.post('/authors/me/publishing-terms/accept', protect, authorize('author', 'admin'), acceptCurrentTerms);
router.post('/publish-requests', protect, authorize('author', 'admin'), createPublishRequest);
router.get('/publish-packages', getPublishPackages);

module.exports = router;
