const express = require('express');
const router = express.Router();
const {
  getUserContext,
  getCurrentUser,
  getMyAddresses,
  replaceMyAddresses,
  getUserStats,
  updateUserProfile,
  updateCurrentUserProfile,
  getUserOrders,
  getUserWishlist,
  getUserLibrary,
  addToWishlist,
  removeFromWishlist,
  getUserInvoices,
  getUserInvoice,
  downloadUserInvoice,
  getUserNotifications,
  markUserNotificationRead,
  getUserPayments,
  getUserPayment,
  getUserOrderPayments,
  getUserShipments,
  getUserShipment,
  getUserNotification,
  markAllUserNotificationsRead,
  archiveUserNotification
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { getMyAuthorApplication } = require('../controllers/authorApplicationController');
const { listUsers } = require('../controllers/adminController');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', authorize('admin'), listUsers);
router.get('/me/context', getUserContext);
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUserProfile);
router.patch('/me', updateCurrentUserProfile);
router.get('/me/addresses', getMyAddresses);
router.put('/me/addresses', replaceMyAddresses);

router.get('/me/author-application', getMyAuthorApplication);

router.get('/:id/stats', getUserStats);
router.put('/:id', updateUserProfile);
router.get('/:id/orders', getUserOrders);
router.get('/:id/orders/:orderId/payments', getUserOrderPayments);
router.get('/:id/payments', getUserPayments);
router.get('/:id/payments/:paymentId', getUserPayment);
router.get('/:id/invoices', getUserInvoices);
router.get('/:id/invoices/:invoiceId/download', downloadUserInvoice);
router.get('/:id/invoices/:invoiceId', getUserInvoice);
router.get('/:id/shipments', getUserShipments);
router.get('/:id/shipments/:shipmentId', getUserShipment);
router.get('/:id/notifications', getUserNotifications);
router.patch('/:id/notifications/read-all', markAllUserNotificationsRead);
router.patch('/:id/notifications/:notificationId/read', markUserNotificationRead);
router.get('/:id/notifications/:notificationId', getUserNotification);
router.delete('/:id/notifications/:notificationId', archiveUserNotification);
router.get('/:id/wishlist', getUserWishlist);
router.get('/:id/library', getUserLibrary);
router.post('/:id/wishlist', addToWishlist);
router.delete('/:id/wishlist/:bookId', removeFromWishlist);

module.exports = router;
