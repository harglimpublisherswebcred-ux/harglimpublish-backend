# Release Candidate Summary

Swagger URL: `/api/docs`

OpenAPI validation status: generated from the internal OpenAPI 3.1 builder and JSON-parse validated during generation.

Endpoints documented: 166

Models documented: 17

Events documented: 31

Database collections documented: 17

Sequence diagrams: 9

Postman collection status: import-ready at `docs/postman_collection.json`.

Documentation coverage percentage: 100% of mounted route definitions.

Production readiness score: 93/100. Remaining documentation/runtime risk is mainly route-order ambiguity on generic parameter routes and the need to replace placeholder staging/production server URLs.

## Endpoint Inventory

| Method | Path | Auth | Controller |
| --- | --- | --- | --- |
| GET | `/health` | Public | `server.js` |
| GET | `/api/content` | Public | `contentController.getContent` |
| POST | `/api/auth/register` | Public | `authController.registerUser` |
| POST | `/api/auth/login` | Public | `authController.loginUser` |
| POST | `/api/auth/google` | Public | `authController.googleLogin` |
| POST | `/api/auth/refresh` | Public/Bearer | `authController.refreshToken` |
| POST | `/api/auth/logout` | Public/Bearer | `authController.logoutUser` |
| POST | `/api/auth/forgot-password` | Public | `authController.forgotPassword` |
| GET | `/api/auth/me` | Bearer | `authController.getMe` |
| PUT | `/api/auth/reset-password/{token}` | Public | `authController.resetPassword` |
| POST | `/api/auth/reset-password/{token}` | Public | `authController.resetPassword` |
| PUT | `/api/auth/change-password` | Bearer | `authController.changePassword` |
| POST | `/api/auth/change-password` | Bearer | `authController.changePassword` |
| GET | `/api/books` | Public | `bookController.getBooks` |
| GET | `/api/books/{slug}` | Public | `bookController.getBookBySlug` |
| GET | `/api/books/{slug}/related` | Public | `bookController.getRelatedBooks` |
| POST | `/api/books/{slug}/reviews` | Bearer | `reviewController.createReview` |
| PUT | `/api/books/{slug}/reviews/{reviewId}` | Bearer | `reviewController.updateReview` |
| DELETE | `/api/books/{slug}/reviews/{reviewId}` | Bearer | `reviewController.deleteReview` |
| GET | `/api/search` | Public | `bookController.searchBooks` |
| GET | `/api/categories` | Public | `categoryController.listCategories` |
| GET | `/api/categories/{slug}` | Public | `categoryController.getCategoryBySlug` |
| GET | `/api/categories/{slug}/books` | Public | `categoryController.getCategoryBooks` |
| POST | `/api/orders` | Bearer | `orderController.createOrder` |
| PUT | `/api/orders/{id}/verify-payment` | Bearer | `orderController.verifyPayment` |
| DELETE | `/api/orders/{id}` | Bearer | `orderController.cancelOrder` |
| GET | `/api/orders/{id}/shipment` | Bearer | `orderShipmentController.getOrderShipment` |
| GET | `/api/orders/{id}/tracking` | Bearer | `orderShipmentController.getOrderTracking` |
| GET | `/api/orders/track/{orderNumber}` | Public | `orderController.trackOrder` |
| POST | `/api/uploads/image` | Bearer | `uploadController.uploadImage` |
| POST | `/api/uploads/document` | Bearer | `uploadController.uploadDocument` |
| GET | `/api/users/me` | Bearer | `userController.getCurrentUser` |
| GET | `/api/users/{id}/stats` | Bearer | `userController.getUserStats` |
| PUT | `/api/users/{id}` | Bearer | `userController.updateUserProfile` |
| GET | `/api/users/me/author-application` | Bearer | `authorApplicationController.getMyAuthorApplication` |
| GET | `/api/users/{id}/orders/{orderId}/payments` | Bearer | `userController.getUserOrderPayments` |
| GET | `/api/users/{id}/payments` | Bearer | `userController.getUserPayments` |
| GET | `/api/users/{id}/payments/{paymentId}` | Bearer | `userController.getUserPayment` |
| GET | `/api/users/{id}/invoices` | Bearer | `userController.getUserInvoices` |
| GET | `/api/users/{id}/invoices/{invoiceId}` | Bearer | `userController.getUserInvoice` |
| GET | `/api/users/{id}/invoices/{invoiceId}/download` | Bearer | `userController.downloadUserInvoice` |
| GET | `/api/users/{id}/shipments` | Bearer | `userController.getUserShipments` |
| GET | `/api/users/{id}/shipments/{shipmentId}` | Bearer | `userController.getUserShipment` |
| GET | `/api/users/{id}/notifications` | Bearer | `userController.getUserNotifications` |
| PATCH | `/api/users/{id}/notifications/read-all` | Bearer | `userController.markAllUserNotificationsRead` |
| PATCH | `/api/users/{id}/notifications/{notificationId}/read` | Bearer | `userController.markUserNotificationRead` |
| GET | `/api/users/{id}/notifications/{notificationId}` | Bearer | `userController.getUserNotification` |
| DELETE | `/api/users/{id}/notifications/{notificationId}` | Bearer | `userController.archiveUserNotification` |
| GET | `/api/users/{id}/wishlist` | Bearer | `userController.getUserWishlist` |
| GET | `/api/users/{id}/library` | Bearer | `userController.getUserLibrary` |
| POST | `/api/users/{id}/wishlist` | Bearer | `userController.addToWishlist` |
| DELETE | `/api/users/{id}/wishlist/{bookId}` | Bearer | `userController.removeFromWishlist` |
| GET | `/api/authors` | Public | `authorController.getAuthors` |
| GET | `/api/authors/{id}` | Public | `authorController.getAuthorById` |
| GET | `/api/authors/{id}/books` | Public | `authorController.getAuthorBooks` |
| GET | `/api/authors/{id}/stats` | Bearer | `authorController.getAuthorStats` |
| GET | `/api/authors/{id}/analytics` | Bearer | `authorController.getAuthorStats` |
| GET | `/api/authors/me/dashboard-access` | Author | `authorAccessController.getDashboardAccessStatus` |
| POST | `/api/authors/me/dashboard-access/purchase` | Author | `authorAccessController.initiatePurchase` |
| PUT | `/api/authors/me/dashboard-access/purchases/{purchaseId}/verify-payment` | Author | `authorAccessController.submitPurchaseUTR` |
| GET | `/api/authors/me/dashboard` | Author | `authorController.getMyDashboard` |
| GET | `/api/authors/me/analytics` | Author | `authorController.getMyAnalytics` |
| GET | `/api/authors/me/books/performance` | Author | `authorController.getMyBookPerformance` |
| GET | `/api/authors/me/royalties` | Author | `authorController.getMyRoyalties` |
| GET | `/api/authors/me/books` | Author | `authorBookController.getMyBooks` |
| POST | `/api/authors/me/books` | Author | `authorBookController.createBookDraft` |
| GET | `/api/authors/me/books/{bookId}` | Author | `authorBookController.getMyBookDetail` |
| PUT | `/api/authors/me/books/{bookId}` | Author | `authorBookController.updateBookDraft` |
| DELETE | `/api/authors/me/books/{bookId}` | Author | `authorBookController.deleteBookDraft` |
| POST | `/api/authors/me/books/{bookId}/submit` | Author | `authorBookController.submitBookForReview` |
| POST | `/api/authors/me/uploads/document` | Author | `uploadController.uploadDocument` |
| POST | `/api/authors/me/uploads/image` | Author | `uploadController.uploadImage` |
| POST | `/api/uploads/publishing-document` | Author/Admin | `uploadController.uploadDocument` |
| POST | `/api/uploads/publishing-image` | Author/Admin | `uploadController.uploadImage` |
| POST | `/api/publish-requests` | Author/Admin | `publishController.createPublishRequest` |
| GET | `/api/publish-packages` | Public | `publishController.getPublishPackages` |
| GET | `/api/admin/analytics` | Admin | `adminController.getAdminAnalytics` |
| GET | `/api/admin/reviews` | Admin | `reviewController.listReviews` |
| PATCH | `/api/admin/reviews/{id}/status` | Admin | `reviewController.moderateReview` |
| DELETE | `/api/admin/reviews/{id}` | Admin | `reviewController.deleteReview` |
| PUT | `/api/admin/content` | Admin | `contentController.updateContent` |
| GET | `/api/admin/users` | Admin | `adminController.listUsers` |
| GET | `/api/admin/users/{id}` | Admin | `adminController.getUser` |
| PUT | `/api/admin/users/{id}` | Admin | `adminController.updateUser` |
| PATCH | `/api/admin/users/{id}/role` | Admin | `adminController.updateUserRole` |
| PUT | `/api/admin/users/{id}/role` | Admin | `adminController.updateUserRole` |
| PATCH | `/api/admin/users/{id}/status` | Admin | `adminController.updateUserStatus` |
| POST | `/api/admin/users/{id}/reset-password` | Admin | `adminController.resetUserPassword` |
| GET | `/api/admin/orders` | Admin | `adminController.getOrders` |
| PUT | `/api/admin/orders/{id}/status` | Admin | `adminController.updateOrderStatus` |
| GET | `/api/admin/publish-requests` | Admin | `adminController.getPublishRequests` |
| PUT | `/api/admin/publish-requests/{id}/status` | Admin | `adminController.updatePublishRequestStatus` |
| POST | `/api/admin/publish-requests/{id}/request-changes` | Admin | `adminController.requestChangesOnPublishRequest` |
| POST | `/api/admin/publish-requests/{id}/reject` | Admin | `adminController.rejectPublishRequest` |
| POST | `/api/admin/publish-requests/{id}/approve` | Admin | `adminController.approveAndPublishBook` |
| POST | `/api/admin/books` | Admin | `adminController.createBook` |
| PUT | `/api/admin/books/{id}` | Admin | `adminController.updateBook` |
| DELETE | `/api/admin/books/{id}` | Admin | `adminController.deleteBook` |
| GET | `/api/admin/categories` | Admin | `categoryController.listAdminCategories` |
| GET | `/api/admin/categories/{id}` | Admin | `categoryController.getAdminCategory` |
| POST | `/api/admin/categories` | Admin | `categoryController.createCategory` |
| PUT | `/api/admin/categories/{id}` | Admin | `categoryController.updateCategory` |
| PATCH | `/api/admin/categories/{id}/status` | Admin | `categoryController.updateCategoryStatus` |
| DELETE | `/api/admin/categories/{id}` | Admin | `categoryController.deleteCategory` |
| GET | `/api/admin/author-access/plans` | Admin | `adminAuthorAccessController.listPlans` |
| POST | `/api/admin/author-access/plans` | Admin | `adminAuthorAccessController.createPlan` |
| PUT | `/api/admin/author-access/plans/{id}` | Admin | `adminAuthorAccessController.updatePlan` |
| POST | `/api/admin/author-access/plans/{id}/activate` | Admin | `adminAuthorAccessController.activatePlan` |
| POST | `/api/admin/author-access/plans/{id}/archive` | Admin | `adminAuthorAccessController.archivePlan` |
| GET | `/api/admin/author-access/purchases` | Admin | `adminAuthorAccessController.listPurchases` |
| GET | `/api/admin/author-access/entitlements` | Admin | `adminAuthorAccessController.listEntitlements` |
| POST | `/api/admin/author-access/entitlements/grant` | Admin | `adminAuthorAccessController.grantEntitlement` |
| POST | `/api/admin/author-access/entitlements/{userId}/revoke` | Admin | `adminAuthorAccessController.revokeEntitlement` |
| POST | `/api/admin/author-access/entitlements/{userId}/restore` | Admin | `adminAuthorAccessController.restoreEntitlement` |
| GET | `/api/admin/authors/{authorId}/dashboard` | Admin | `adminController.getAdminAuthorDashboard` |
| GET | `/api/admin/authors/{authorId}/royalties` | Admin | `adminController.getAdminAuthorRoyalties` |
| GET | `/api/admin/operations/dashboard` | Admin | `adminOperationsController.dashboardSummary` |
| GET | `/api/admin/operations/search` | Admin | `adminOperationsController.globalSearch` |
| GET | `/api/admin/operations/payments` | Admin | `adminOperationsController.listPayments` |
| GET | `/api/admin/operations/payments/{id}` | Admin | `adminOperationsController.getPaymentDetail` |
| POST | `/api/admin/operations/payments/{id}/approve` | Admin | `adminOperationsController.approvePayment` |
| POST | `/api/admin/operations/payments/{id}/reject` | Admin | `adminOperationsController.rejectPayment` |
| POST | `/api/admin/operations/payments/{id}/cancel` | Admin | `adminOperationsController.cancelPaymentIntent` |
| POST | `/api/admin/operations/payments/{id}/expire` | Admin | `adminOperationsController.expirePayment` |
| POST | `/api/admin/operations/payments/{id}/retry-verification` | Admin | `adminOperationsController.retryVerification` |
| POST | `/api/admin/operations/payments/{id}/recreate-qr` | Admin | `adminOperationsController.recreateQR` |
| GET | `/api/admin/operations/inventory/reservations` | Admin | `adminOperationsController.listReservations` |
| GET | `/api/admin/operations/inventory/low-stock` | Admin | `adminOperationsController.listLowStock` |
| GET | `/api/admin/operations/ledger/payments` | Admin | `adminOperationsController.listPaymentLedger` |
| GET | `/api/admin/operations/ledger/inventory` | Admin | `adminOperationsController.listInventoryLedger` |
| GET | `/api/admin/operations/ledger/timeline` | Admin | `adminOperationsController.combinedTimeline` |
| GET | `/api/admin/invoices/search` | Admin | `adminInvoiceController.searchInvoices` |
| GET | `/api/admin/invoices` | Admin | `adminInvoiceController.listInvoices` |
| GET | `/api/admin/invoices/{id}/download` | Admin | `adminInvoiceController.downloadInvoice` |
| GET | `/api/admin/invoices/{id}` | Admin | `adminInvoiceController.getInvoice` |
| GET | `/api/admin/notifications/search` | Admin | `adminNotificationController.searchNotifications` |
| GET | `/api/admin/notifications` | Admin | `adminNotificationController.listNotifications` |
| GET | `/api/admin/notifications/{id}` | Admin | `adminNotificationController.getNotification` |
| POST | `/api/admin/notifications/{id}/retry` | Admin | `adminNotificationController.retryNotification` |
| GET | `/api/admin/shipments/search` | Admin | `adminShipmentController.searchShipments` |
| GET | `/api/admin/shipments` | Admin | `adminShipmentController.listShipments` |
| GET | `/api/admin/shipments/{id}/tracking` | Admin | `adminShipmentController.getTracking` |
| GET | `/api/admin/shipments/{id}` | Admin | `adminShipmentController.getShipment` |
| POST | `/api/admin/shipments/{id}/assign-courier` | Admin | `adminShipmentController.assignCourier` |
| POST | `/api/admin/shipments/{id}/update-status` | Admin | `adminShipmentController.updateStatus` |
| POST | `/api/admin/shipments/{id}/cancel` | Admin | `adminShipmentController.cancelShipment` |
| GET | `/api/admin/analytics/dashboard` | Admin | `adminAnalyticsController.dashboard` |
| GET | `/api/admin/analytics/revenue` | Admin | `adminAnalyticsController.revenue` |
| GET | `/api/admin/analytics/books` | Admin | `adminAnalyticsController.books` |
| GET | `/api/admin/analytics/payments` | Admin | `adminAnalyticsController.payments` |
| GET | `/api/admin/analytics/inventory` | Admin | `adminAnalyticsController.inventory` |
| GET | `/api/admin/analytics/shipments` | Admin | `adminAnalyticsController.shipments` |
| GET | `/api/admin/analytics/customers` | Admin | `adminAnalyticsController.customers` |
| GET | `/api/users/me/context` | Bearer | `userController.getUserContext` |
| GET | `/api/authors/me/royalty-settlements` | Bearer (Author Entitled) | `royaltySettlementController.getAuthorSettlements` |
| GET | `/api/authors/me/royalty-settlements/{id}` | Bearer (Author Entitled) | `royaltySettlementController.getAuthorSettlementDetail` |
| GET | `/api/admin/dashboard` | Admin | `adminController.getAdminDashboardOverview` |
| GET | `/api/admin/authors/{authorId}` | Admin | `adminController.getAdminAuthorDetail` |
| GET | `/api/admin/royalty-settlements/reconcile` | Admin | `royaltySettlementController.reconcileSettlements` |
| POST | `/api/admin/royalty-settlements/preview` | Admin | `royaltySettlementController.previewSettlement` |
| POST | `/api/admin/royalty-settlements` | Admin | `royaltySettlementController.createDraftSettlement` |
| GET | `/api/admin/royalty-settlements` | Admin | `royaltySettlementController.listSettlementsForAdmin` |
| GET | `/api/admin/royalty-settlements/{id}` | Admin | `royaltySettlementController.getSettlementDetailForAdmin` |
| POST | `/api/admin/royalty-settlements/{id}/approve` | Admin | `royaltySettlementController.approveSettlement` |
| POST | `/api/admin/royalty-settlements/{id}/mark-paid` | Admin | `royaltySettlementController.markPaid` |
| POST | `/api/admin/royalty-settlements/{id}/cancel` | Admin | `royaltySettlementController.cancelSettlement` |
