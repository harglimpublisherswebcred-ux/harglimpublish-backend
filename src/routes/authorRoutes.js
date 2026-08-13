const express = require('express');
const router = express.Router();
const { 
  getAuthors, 
  getAuthorById, 
  getAuthorBooks, 
  getAuthorStats, 
  getAuthorRoyaltiesHistory,
  getMyDashboard,
  getMyAnalytics,
  getMyBookPerformance,
  getMyRoyalties
} = require('../controllers/authorController');
const {
  getDashboardAccessStatus,
  initiatePurchase,
  submitPurchaseUTR
} = require('../controllers/authorAccessController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireAuthorDashboardAccess } = require('../middleware/authorDashboardMiddleware');

const {
  getMyBooks,
  getMyBookDetail,
  createBookDraft,
  updateBookDraft,
  deleteBookDraft,
  submitBookForReview
} = require('../controllers/authorBookController');
const { uploadImage, uploadDocument } = require('../controllers/uploadController');
const { upload, requireCloudinaryConfig, handleUploadError } = require('../config/cloudinary');
const royaltySettlementController = require('../controllers/royaltySettlementController');

// Dashboard access purchase & status endpoints (for approved authors)
router.get('/me/dashboard-access', protect, authorize('author', 'admin'), getDashboardAccessStatus);
router.post('/me/dashboard-access/purchase', protect, authorize('author', 'admin'), initiatePurchase);
router.put('/me/dashboard-access/purchases/:purchaseId/verify-payment', protect, authorize('author', 'admin'), submitPurchaseUTR);

// Paid dashboard route must stay before /me/books/:bookId so "performance" is not treated as a book id.
router.get('/me/books/performance', protect, requireAuthorDashboardAccess, getMyBookPerformance);

// Level 1 Free Author Publishing & Book Management (NO PAID DASHBOARD ENTITLEMENT REQUIRED)
router.get('/me/books', protect, authorize('author', 'admin'), getMyBooks);
router.post('/me/books', protect, authorize('author', 'admin'), createBookDraft);
router.get('/me/books/:bookId', protect, authorize('author', 'admin'), getMyBookDetail);
router.put('/me/books/:bookId', protect, authorize('author', 'admin'), updateBookDraft);
router.delete('/me/books/:bookId', protect, authorize('author', 'admin'), deleteBookDraft);
router.post('/me/books/:bookId/submit', protect, authorize('author', 'admin'), submitBookForReview);

// Author publishing uploads (NO PAID DASHBOARD ENTITLEMENT REQUIRED)
router.post('/me/uploads/document', protect, authorize('author', 'admin'), requireCloudinaryConfig, upload.single('document'), handleUploadError, uploadDocument);
router.post('/me/uploads/image', protect, authorize('author', 'admin'), requireCloudinaryConfig, upload.single('image'), handleUploadError, uploadImage);

// Public author routes
router.get('/', getAuthors);
router.get('/:id', getAuthorById);
router.get('/:id/books', getAuthorBooks);

// Paid Dashboard routes (requires author role + ACTIVE entitlement, or admin)
router.get('/me/dashboard', protect, requireAuthorDashboardAccess, getMyDashboard);
router.get('/me/analytics', protect, requireAuthorDashboardAccess, getMyAnalytics);
router.get('/me/royalties', protect, requireAuthorDashboardAccess, getMyRoyalties);

// Royalty Settlements
router.get('/me/royalty-settlements', protect, requireAuthorDashboardAccess, royaltySettlementController.getAuthorSettlements);
router.get('/me/royalty-settlements/:id', protect, requireAuthorDashboardAccess, royaltySettlementController.getAuthorSettlementDetail);

router.get('/:id/stats', protect, requireAuthorDashboardAccess, getAuthorStats);
router.get('/:id/analytics', protect, requireAuthorDashboardAccess, getAuthorStats);
router.get('/:id/royalties/history', protect, requireAuthorDashboardAccess, getAuthorRoyaltiesHistory);

module.exports = router;
