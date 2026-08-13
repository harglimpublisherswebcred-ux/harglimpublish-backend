const express = require('express');
const router = express.Router();
const {
  getAdminAnalytics,
  getAdminDashboardOverview,
  createBook,
  updateBook,
  deleteBook,
  getOrders,
  updateOrderStatus,
  getPublishRequests,
  updatePublishRequestStatus,
  requestChangesOnPublishRequest,
  rejectPublishRequest,
  approveAndPublishBook,
  listUsers,
  getUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  getAdminAuthorDashboard,
  getAdminAuthorRoyalties,
  getAdminAuthorDetail
} = require('../controllers/adminController');
const adminOperationsController = require('../controllers/adminOperationsController');
const adminInvoiceController = require('../controllers/adminInvoiceController');
const adminNotificationController = require('../controllers/adminNotificationController');
const adminShipmentController = require('../controllers/adminShipmentController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const categoryController = require('../controllers/categoryController');
const { updateContent } = require('../controllers/contentController');
const { listReviews, moderateReview, deleteReview } = require('../controllers/reviewController');
const { listAuthorApplications, updateAuthorApplicationStatus } = require('../controllers/authorApplicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboardOverview);
router.get('/analytics', getAdminAnalytics);
router.get('/stats', getAdminAnalytics);
router.get('/analytics/dashboard', adminAnalyticsController.dashboard);
router.get('/analytics/revenue', adminAnalyticsController.revenue);
router.get('/analytics/books', adminAnalyticsController.books);
router.get('/analytics/payments', adminAnalyticsController.payments);
router.get('/analytics/inventory', adminAnalyticsController.inventory);
router.get('/analytics/shipments', adminAnalyticsController.shipments);
router.get('/analytics/customers', adminAnalyticsController.customers);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/role', updateUserRole);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);
router.put('/content', updateContent);
router.get('/author-applications', listAuthorApplications);
router.put('/author-applications/:id/status', updateAuthorApplicationStatus);
router.get('/reviews', listReviews);
router.patch('/reviews/:reviewId/status', moderateReview);
router.delete('/reviews/:id', deleteReview);
router.get('/categories', categoryController.listAdminCategories);
router.get('/categories/:id', categoryController.getAdminCategory);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.patch('/categories/:id/status', categoryController.updateCategoryStatus);
router.delete('/categories/:id', categoryController.deleteCategory);
router.get('/operations/dashboard', adminOperationsController.dashboardSummary);
router.get('/operations/search', adminOperationsController.globalSearch);
router.get('/operations/payments', adminOperationsController.listPayments);
router.get('/operations/payments/:id', adminOperationsController.getPaymentDetail);
router.post('/operations/payments/:id/approve', adminOperationsController.approvePayment);
router.post('/operations/payments/:id/reject', adminOperationsController.rejectPayment);
router.post('/operations/payments/:id/cancel', adminOperationsController.cancelPaymentIntent);
router.post('/operations/payments/:id/expire', adminOperationsController.expirePayment);
router.post('/operations/payments/:id/retry-verification', adminOperationsController.retryVerification);
router.post('/operations/payments/:id/recreate-qr', adminOperationsController.recreateQR);
router.get('/operations/inventory/reservations', adminOperationsController.listReservations);
router.get('/operations/inventory/low-stock', adminOperationsController.listLowStock);
router.get('/operations/ledger/payments', adminOperationsController.listPaymentLedger);
router.get('/operations/ledger/inventory', adminOperationsController.listInventoryLedger);
router.get('/operations/ledger/timeline', adminOperationsController.combinedTimeline);
router.get('/invoices/search', adminInvoiceController.searchInvoices);
router.get('/invoices', adminInvoiceController.listInvoices);
router.get('/invoices/:id/download', adminInvoiceController.downloadInvoice);
router.get('/invoices/:id', adminInvoiceController.getInvoice);
router.get('/notifications/search', adminNotificationController.searchNotifications);
router.get('/notifications', adminNotificationController.listNotifications);
router.get('/notifications/:id', adminNotificationController.getNotification);
router.post('/notifications/:id/retry', adminNotificationController.retryNotification);
router.get('/shipments/search', adminShipmentController.searchShipments);
router.get('/shipments', adminShipmentController.listShipments);
router.get('/shipments/:id/tracking', adminShipmentController.getTracking);
router.get('/shipments/:id', adminShipmentController.getShipment);
router.post('/shipments/:id/assign-courier', adminShipmentController.assignCourier);
router.post('/shipments/:id/update-status', adminShipmentController.updateStatus);
router.post('/shipments/:id/cancel', adminShipmentController.cancelShipment);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/publish-requests', getPublishRequests);
router.put('/publish-requests/:id/status', updatePublishRequestStatus);
router.post('/publish-requests/:id/request-changes', requestChangesOnPublishRequest);
router.post('/publish-requests/:id/reject', rejectPublishRequest);
router.post('/publish-requests/:id/approve', approveAndPublishBook);
router.route('/books').post(createBook);
router.route('/books/:id').put(updateBook).delete(deleteBook);

const adminAuthorAccessController = require('../controllers/adminAuthorAccessController');

router.get('/author-access/plans', adminAuthorAccessController.listPlans);
router.post('/author-access/plans', adminAuthorAccessController.createPlan);
router.put('/author-access/plans/:id', adminAuthorAccessController.updatePlan);
router.post('/author-access/plans/:id/activate', adminAuthorAccessController.activatePlan);
router.post('/author-access/plans/:id/archive', adminAuthorAccessController.archivePlan);
router.get('/author-access/purchases', adminAuthorAccessController.listPurchases);
router.get('/author-access/entitlements', adminAuthorAccessController.listEntitlements);
router.post('/author-access/entitlements/grant', adminAuthorAccessController.grantEntitlement);
router.post('/author-access/entitlements/:userId/revoke', adminAuthorAccessController.revokeEntitlement);
router.post('/author-access/entitlements/:userId/restore', adminAuthorAccessController.restoreEntitlement);

router.get('/authors/:authorId', getAdminAuthorDetail);
router.get('/authors/:authorId/dashboard', getAdminAuthorDashboard);
router.get('/authors/:authorId/royalties', getAdminAuthorRoyalties);

const royaltySettlementController = require('../controllers/royaltySettlementController');

router.get('/royalty-settlements/reconcile', royaltySettlementController.reconcileSettlements);
router.post('/royalty-settlements/preview', royaltySettlementController.previewSettlement);
router.post('/royalty-settlements', royaltySettlementController.createDraftSettlement);
router.get('/royalty-settlements', royaltySettlementController.listSettlementsForAdmin);
router.get('/royalty-settlements/:id', royaltySettlementController.getSettlementDetailForAdmin);
router.post('/royalty-settlements/:id/approve', royaltySettlementController.approveSettlement);
router.post('/royalty-settlements/:id/mark-paid', royaltySettlementController.markPaid);
router.post('/royalty-settlements/:id/cancel', royaltySettlementController.cancelSettlement);

module.exports = router;



