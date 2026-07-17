# HM Backend API Documentation

Production API reference for the HM Backend Node.js + Express + MongoDB platform.

Generated from `src/docs/apiInventory.js` and aligned with Swagger/OpenAPI.

## Build Information

| Field | Value |
|---|---|
| Package | `hm_backend` |
| Version | `1.0.0` |
| API Inventory | `117` endpoints |
| OpenAPI | `/api/docs.json` |
| Swagger UI | `/api/docs` |
| Health Check | `/health` |

## Base URLs

| Environment | URL |
|---|---|
| Local | `http://localhost:5000` |
| Current deployment | Determined dynamically from request host in Swagger |

## Authentication

Most protected endpoints use a Bearer access token:

`Authorization: Bearer <accessToken>`

Login/register/reset-password responses include an access token and refresh token. Use `POST /api/auth/refresh` with `refreshToken` to rotate sessions. Use `POST /api/auth/logout` to revoke a refresh session, or send `all: true` with bearer auth to revoke all active sessions.

### Common Auth Payloads

`POST /api/auth/register`

```json
{
  "name": "Reader User",
  "email": "reader@example.com",
  "password": "StrongPass123!",
  "role": "reader"
}
```

`POST /api/auth/login`

```json
{
  "email": "reader@example.com",
  "password": "StrongPass123!"
}
```

`POST /api/auth/refresh`

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

`POST /api/auth/logout`

```json
{
  "refreshToken": "opaque-refresh-token",
  "all": false
}
```

## Core Frontend Flows

### Checkout And Manual UPI Payment

1. Create order: `POST /api/orders`.
2. Backend creates order, payment intent, reservation, and QR data.
3. Customer pays by UPI.
4. Customer submits UTR: `PUT /api/orders/{id}/verify-payment`.
5. Admin verifies payment through operations APIs.
6. Payment verification generates invoice, shipment, notifications, and analytics events asynchronously.

### Customer Account

Use `/api/users/me/...` or `/api/users/{id}/...` for account dashboards. Current APIs include orders, payments, invoices, shipments, notifications, wishlist, library, and author application status.

### Admin Operations

Admin APIs are mounted under `/api/admin` and require both Bearer auth and `admin` role. Admin operations cover users, reviews, categories, payment verification, inventory reservations, ledgers, invoices, notifications, shipments, analytics, books, orders, and publishing requests.

## Table Of Contents

- [System](#system)
- [Authentication](#authentication)
- [Books](#books)
- [Categories](#categories)
- [Orders](#orders)
- [Uploads](#uploads)
- [Users](#users)
- [Authors](#authors)
- [Publishing](#publishing)
- [Admin Core](#admin-core)
- [Admin Users](#admin-users)
- [Admin Categories](#admin-categories)
- [Admin Operations](#admin-operations)
- [Admin Invoices](#admin-invoices)
- [Admin Notifications](#admin-notifications)
- [Admin Shipments](#admin-shipments)
- [Admin Analytics](#admin-analytics)

## System

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/health` | Public | Health check | `server.js` | Returns server liveness only. |

## Authentication

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user | `authController.registerUser` | Body: `RegisterRequest`<br>Auth endpoints use a stricter 10 requests per 15 minutes limiter. |
| POST | `/api/auth/login` | Public | Login user | `authController.loginUser` | Body: `LoginRequest`<br>Auth endpoints use a stricter 10 requests per 15 minutes limiter and return a JWT token on success. |
| POST | `/api/auth/refresh` | Public/Bearer | Refresh access token using refresh token or bearer fallback | `authController.refreshToken` | Body: `RefreshTokenRequest` |
| POST | `/api/auth/logout` | Public/Bearer | Logout and revoke refresh session | `authController.logoutUser` | Body: `LogoutRequest` |
| POST | `/api/auth/forgot-password` | Public | Request password reset token | `authController.forgotPassword` | Body: `ForgotPasswordRequest` |
| GET | `/api/auth/me` | Bearer | Get current user | `authController.getMe` | - |
| PUT | `/api/auth/reset-password/{token}` | Public | Reset password with token | `authController.resetPassword` | Params: `token`<br>Body: `ResetPasswordRequest` |
| POST | `/api/auth/reset-password/{token}` | Public | Reset password with token alias | `authController.resetPassword` | Params: `token`<br>Body: `ResetPasswordRequest` |
| PUT | `/api/auth/change-password` | Bearer | Change current user password | `authController.changePassword` | Body: `ChangePasswordRequest` |
| POST | `/api/auth/change-password` | Bearer | Change current user password alias | `authController.changePassword` | Body: `ChangePasswordRequest` |

## Books

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/books` | Public | List books | `bookController.getBooks` | Query: `page`, `limit`, `category`, `minPrice`, `maxPrice`, `sort`, `featured`, `bestseller`, `newRelease` |
| GET | `/api/books/{slug}` | Public | Get book by slug | `bookController.getBookBySlug` | Params: `slug` |
| GET | `/api/books/{slug}/related` | Public | Get related books | `bookController.getRelatedBooks` | Params: `slug` |
| POST | `/api/books/{slug}/reviews` | Bearer | Create book review | `reviewController.createReview` | Params: `slug`<br>Body: `ReviewRequest` |
| PUT | `/api/books/{slug}/reviews/{reviewId}` | Bearer | Update book review | `reviewController.updateReview` | Params: `slug`, `reviewId`<br>Body: `ReviewRequest` |
| DELETE | `/api/books/{slug}/reviews/{reviewId}` | Bearer | Delete book review | `reviewController.deleteReview` | Params: `slug`, `reviewId` |
| GET | `/api/search` | Public | Search books | `bookController.searchBooks` | Query: `q`, `page`, `limit` |

## Categories

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/categories` | Public | List categories | `categoryController.listCategories` | Query: `page`, `limit`, `featured`, `active`, `search`, `sort`<br>Public list returns active categories by default and includes system-managed book counts. |
| GET | `/api/categories/{slug}` | Public | Get category by slug | `categoryController.getCategoryBySlug` | Params: `slug`<br>Only active categories are returned publicly. |
| GET | `/api/categories/{slug}/books` | Public | List books by category | `categoryController.getCategoryBooks` | Params: `slug`<br>Query: `page`, `limit`, `sort`<br>Returns published books for an active category. |

## Orders

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| POST | `/api/orders` | Bearer | Create order with payment, inventory, QR bridge | `orderController.createOrder` | Body: `OrderCreateRequest` |
| PUT | `/api/orders/{id}/verify-payment` | Bearer | Verify order payment reference | `orderController.verifyPayment` | Params: `id`<br>Body: `PaymentVerificationRequest` |
| DELETE | `/api/orders/{id}` | Bearer | Cancel order | `orderController.cancelOrder` | Params: `id` |
| GET | `/api/orders/{id}/shipment` | Bearer | Get order shipment | `orderShipmentController.getOrderShipment` | Params: `id` |
| GET | `/api/orders/{id}/tracking` | Bearer | Get order tracking | `orderShipmentController.getOrderTracking` | Params: `id` |
| GET | `/api/orders/track/{orderNumber}` | Public | Track order by order number | `orderController.trackOrder` | Params: `orderNumber` |

## Uploads

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| POST | `/api/uploads/image` | Bearer | Upload image | `uploadController.uploadImage` | Body: `MultipartImageRequest`<br>Multipart field: image. Allowed: jpg, jpeg, png, webp, gif. Default max size: 25MB. Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. |
| POST | `/api/uploads/document` | Bearer | Upload document | `uploadController.uploadDocument` | Body: `MultipartDocumentRequest`<br>Multipart field: document. Allowed: pdf, doc, docx. Default max size: 25MB. Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. |

## Users

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/users/{id}/stats` | Bearer | Get user stats | `userController.getUserStats` | Params: `id` |
| PUT | `/api/users/{id}` | Bearer | Update user profile | `userController.updateUserProfile` | Params: `id`<br>Body: `UserUpdateRequest` |
| GET | `/api/users/me/author-application` | Bearer | Get current user author application | `authorApplicationController.getMyAuthorApplication` | - |
| GET | `/api/users/{id}/orders/{orderId}/payments` | Bearer | Get payment attempts for a user order | `userController.getUserOrderPayments` | Params: `id`, `orderId`<br>Query: `page`, `limit` |
| GET | `/api/users/{id}/payments` | Bearer | Get user payment attempts | `userController.getUserPayments` | Params: `id`<br>Query: `page`, `limit`, `status`, `order` |
| GET | `/api/users/{id}/payments/{paymentId}` | Bearer | Get user payment detail including active QR metadata | `userController.getUserPayment` | Params: `id`, `paymentId` |
| GET | `/api/users/{id}/invoices` | Bearer | Get user invoices | `userController.getUserInvoices` | Params: `id`<br>Query: `page`, `limit`, `status` |
| GET | `/api/users/{id}/invoices/{invoiceId}` | Bearer | Get user invoice | `userController.getUserInvoice` | Params: `id`, `invoiceId` |
| GET | `/api/users/{id}/invoices/{invoiceId}/download` | Bearer | Download user invoice | `userController.downloadUserInvoice` | Params: `id`, `invoiceId` |
| GET | `/api/users/{id}/shipments` | Bearer | Get user shipments | `userController.getUserShipments` | Params: `id`<br>Query: `page`, `limit`, `status` |
| GET | `/api/users/{id}/shipments/{shipmentId}` | Bearer | Get user shipment detail | `userController.getUserShipment` | Params: `id`, `shipmentId` |
| GET | `/api/users/{id}/notifications` | Bearer | Get user notifications | `userController.getUserNotifications` | Params: `id`<br>Query: `page`, `limit`, `status`, `unread` |
| PATCH | `/api/users/{id}/notifications/read-all` | Bearer | Mark all user notifications as read | `userController.markAllUserNotificationsRead` | Params: `id` |
| PATCH | `/api/users/{id}/notifications/{notificationId}/read` | Bearer | Mark user notification as read | `userController.markUserNotificationRead` | Params: `id`, `notificationId` |
| GET | `/api/users/{id}/notifications/{notificationId}` | Bearer | Get user notification detail | `userController.getUserNotification` | Params: `id`, `notificationId` |
| DELETE | `/api/users/{id}/notifications/{notificationId}` | Bearer | Archive user notification | `userController.archiveUserNotification` | Params: `id`, `notificationId` |
| GET | `/api/users/{id}/wishlist` | Bearer | Get user wishlist | `userController.getUserWishlist` | Params: `id` |
| GET | `/api/users/{id}/library` | Bearer | Get user library | `userController.getUserLibrary` | Params: `id` |
| POST | `/api/users/{id}/wishlist` | Bearer | Add book to wishlist | `userController.addToWishlist` | Params: `id`<br>Body: `WishlistRequest` |
| DELETE | `/api/users/{id}/wishlist/{bookId}` | Bearer | Remove book from wishlist | `userController.removeFromWishlist` | Params: `id`, `bookId` |

## Authors

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/authors` | Public | List authors | `authorController.getAuthors` | Query: `page`, `limit` |
| GET | `/api/authors/{id}` | Public | Get author | `authorController.getAuthorById` | Params: `id` |
| GET | `/api/authors/{id}/books` | Public | Get author books | `authorController.getAuthorBooks` | Params: `id`<br>Query: `page`, `limit`, `sort` |
| GET | `/api/authors/{id}/stats` | Bearer | Get author stats | `authorController.getAuthorStats` | Params: `id` |
| GET | `/api/authors/{id}/analytics` | Bearer | Get author analytics alias | `authorController.getAuthorStats` | Params: `id` |
| GET | `/api/authors/{id}/royalties/history` | Bearer | Get author royalty history | `authorController.getAuthorRoyaltiesHistory` | Params: `id` |

## Publishing

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| POST | `/api/publish-requests` | Author/Admin | Create publish request | `publishController.createPublishRequest` | Body: `PublishRequestCreate` |
| GET | `/api/publish-packages` | Public | List publish packages | `publishController.getPublishPackages` | - |

## Admin Core

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/analytics` | Admin | Admin analytics summary | `adminController.getAdminAnalytics` | - |
| GET | `/api/admin/reviews` | Admin | List reviews for moderation | `reviewController.listReviews` | Query: `page`, `limit`, `status`, `book`, `user` |
| PATCH | `/api/admin/reviews/{id}/status` | Admin | Moderate review | `reviewController.moderateReview` | Params: `id`<br>Body: `ReviewModerationRequest` |
| DELETE | `/api/admin/reviews/{id}` | Admin | Delete review as admin | `reviewController.deleteReview` | Params: `id` |
| GET | `/api/admin/orders` | Admin | List orders | `adminController.getOrders` | - |
| PUT | `/api/admin/orders/{id}/status` | Admin | Update order status | `adminController.updateOrderStatus` | Params: `id`<br>Body: `StatusUpdateRequest` |
| GET | `/api/admin/publish-requests` | Admin | List publish requests | `adminController.getPublishRequests` | - |
| PUT | `/api/admin/publish-requests/{id}/status` | Admin | Update publish request status | `adminController.updatePublishRequestStatus` | Params: `id`<br>Body: `StatusUpdateRequest` |
| POST | `/api/admin/books` | Admin | Create book | `adminController.createBook` | Body: `BookCreateRequest` |
| PUT | `/api/admin/books/{id}` | Admin | Update book | `adminController.updateBook` | Params: `id`<br>Body: `BookUpdateRequest` |
| DELETE | `/api/admin/books/{id}` | Admin | Delete book | `adminController.deleteBook` | Params: `id` |

## Admin Users

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/users` | Admin | List users | `adminController.listUsers` | Query: `page`, `limit`, `role`, `isActive`, `search` |
| GET | `/api/admin/users/{id}` | Admin | Get user | `adminController.getUser` | Params: `id` |
| PATCH | `/api/admin/users/{id}/role` | Admin | Update user role | `adminController.updateUserRole` | Params: `id`<br>Body: `UserRoleRequest` |
| PUT | `/api/admin/users/{id}/role` | Admin | Update user role alias | `adminController.updateUserRole` | Params: `id`<br>Body: `UserRoleRequest` |
| PATCH | `/api/admin/users/{id}/status` | Admin | Update user active status | `adminController.updateUserStatus` | Params: `id`<br>Body: `UserStatusRequest` |
| POST | `/api/admin/users/{id}/reset-password` | Admin | Reset user password | `adminController.resetUserPassword` | Params: `id`<br>Body: `ResetPasswordRequest` |

## Admin Categories

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/categories` | Admin | List categories | `categoryController.listAdminCategories` | Query: `page`, `limit`, `featured`, `active`, `search`, `sort`<br>Admin list can include inactive categories when active=false is supplied. |
| GET | `/api/admin/categories/{id}` | Admin | Get category | `categoryController.getAdminCategory` | Params: `id` |
| POST | `/api/admin/categories` | Admin | Create category | `categoryController.createCategory` | Body: `CategoryCreateRequest`<br>Name and slug must be unique. Slug is generated from name when omitted. |
| PUT | `/api/admin/categories/{id}` | Admin | Update category | `categoryController.updateCategory` | Params: `id`<br>Body: `CategoryUpdateRequest`<br>bookCount is managed by the system and cannot be set through this payload. |
| PATCH | `/api/admin/categories/{id}/status` | Admin | Update category status | `categoryController.updateCategoryStatus` | Params: `id`<br>Body: `CategoryStatusRequest`<br>Synchronizes active and legacy isActive fields. |
| DELETE | `/api/admin/categories/{id}` | Admin | Soft delete category | `categoryController.deleteCategory` | Params: `id`<br>Soft delete only. Categories with active books return 409 conflict. |

## Admin Operations

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/operations/dashboard` | Admin | Operations dashboard | `adminOperationsController.dashboardSummary` | - |
| GET | `/api/admin/operations/search` | Admin | Global operations search | `adminOperationsController.globalSearch` | Query: `q`, `type`, `page`, `limit` |
| GET | `/api/admin/operations/payments` | Admin | List payments | `adminOperationsController.listPayments` | Query: `status`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/operations/payments/{id}` | Admin | Payment detail | `adminOperationsController.getPaymentDetail` | Params: `id` |
| POST | `/api/admin/operations/payments/{id}/approve` | Admin | Approve payment | `adminOperationsController.approvePayment` | Params: `id`<br>Body: `PaymentActionRequest` |
| POST | `/api/admin/operations/payments/{id}/reject` | Admin | Reject payment | `adminOperationsController.rejectPayment` | Params: `id`<br>Body: `RejectPaymentRequest` |
| POST | `/api/admin/operations/payments/{id}/cancel` | Admin | Cancel payment intent | `adminOperationsController.cancelPaymentIntent` | Params: `id`<br>Body: `PaymentActionRequest` |
| POST | `/api/admin/operations/payments/{id}/expire` | Admin | Expire payment intent | `adminOperationsController.expirePayment` | Params: `id`<br>Body: `PaymentActionRequest` |
| POST | `/api/admin/operations/payments/{id}/retry-verification` | Admin | Retry payment verification | `adminOperationsController.retryVerification` | Params: `id` |
| POST | `/api/admin/operations/payments/{id}/recreate-qr` | Admin | Recreate payment QR | `adminOperationsController.recreateQR` | Params: `id`<br>Body: `QRRegenerateRequest` |
| GET | `/api/admin/operations/inventory/reservations` | Admin | List inventory reservations | `adminOperationsController.listReservations` | Query: `status`, `order`, `payment`, `book`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/operations/inventory/low-stock` | Admin | List low stock books | `adminOperationsController.listLowStock` | Query: `threshold`, `page`, `limit`, `category` |
| GET | `/api/admin/operations/ledger/payments` | Admin | List payment ledger | `adminOperationsController.listPaymentLedger` | Query: `paymentId`, `orderId`, `userId`, `eventType`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/operations/ledger/inventory` | Admin | List inventory ledger | `adminOperationsController.listInventoryLedger` | Query: `reservation`, `order`, `payment`, `book`, `eventType`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/operations/ledger/timeline` | Admin | Combined ledger timeline | `adminOperationsController.combinedTimeline` | Query: `orderId`, `paymentId`, `page`, `limit`, `from`, `to` |

## Admin Invoices

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/invoices/search` | Admin | Search invoices | `adminInvoiceController.searchInvoices` | Query: `q`, `search`, `status`, `customer`, `order`, `payment`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/invoices` | Admin | List invoices | `adminInvoiceController.listInvoices` | Query: `status`, `customer`, `order`, `payment`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/invoices/{id}/download` | Admin | Download invoice document | `adminInvoiceController.downloadInvoice` | Params: `id` |
| GET | `/api/admin/invoices/{id}` | Admin | Get invoice | `adminInvoiceController.getInvoice` | Params: `id` |

## Admin Notifications

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/notifications/search` | Admin | Search notifications | `adminNotificationController.searchNotifications` | Query: `q`, `search`, `status`, `channel`, `eventType`, `user`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/notifications` | Admin | List notifications | `adminNotificationController.listNotifications` | Query: `status`, `channel`, `eventType`, `user`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/notifications/{id}` | Admin | Get notification | `adminNotificationController.getNotification` | Params: `id` |
| POST | `/api/admin/notifications/{id}/retry` | Admin | Retry failed notification | `adminNotificationController.retryNotification` | Params: `id`<br>Body: `NotificationRetryRequest` |

## Admin Shipments

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/shipments/search` | Admin | Search shipments | `adminShipmentController.searchShipments` | Query: `q`, `search`, `status`, `customer`, `order`, `payment`, `invoice`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/shipments` | Admin | List shipments | `adminShipmentController.listShipments` | Query: `status`, `customer`, `order`, `payment`, `invoice`, `page`, `limit`, `from`, `to` |
| GET | `/api/admin/shipments/{id}/tracking` | Admin | Get shipment tracking | `adminShipmentController.getTracking` | Params: `id` |
| GET | `/api/admin/shipments/{id}` | Admin | Get shipment | `adminShipmentController.getShipment` | Params: `id` |
| POST | `/api/admin/shipments/{id}/assign-courier` | Admin | Assign courier | `adminShipmentController.assignCourier` | Params: `id`<br>Body: `CourierAssignRequest` |
| POST | `/api/admin/shipments/{id}/update-status` | Admin | Update shipment status | `adminShipmentController.updateStatus` | Params: `id`<br>Body: `StatusUpdateRequest` |
| POST | `/api/admin/shipments/{id}/cancel` | Admin | Cancel shipment | `adminShipmentController.cancelShipment` | Params: `id`<br>Body: `ShipmentCancelRequest` |

## Admin Analytics

| Method | Path | Auth | Summary | Controller | Contract Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/analytics/dashboard` | Admin | Analytics dashboard | `adminAnalyticsController.dashboard` | Query: `from`, `to`, `period` |
| GET | `/api/admin/analytics/revenue` | Admin | Revenue report | `adminAnalyticsController.revenue` | Query: `from`, `to`, `period`, `page`, `limit` |
| GET | `/api/admin/analytics/books` | Admin | Book sales report | `adminAnalyticsController.books` | Query: `from`, `to`, `page`, `limit`, `sort` |
| GET | `/api/admin/analytics/payments` | Admin | Payment metrics | `adminAnalyticsController.payments` | Query: `from`, `to`, `page`, `limit` |
| GET | `/api/admin/analytics/inventory` | Admin | Inventory metrics | `adminAnalyticsController.inventory` | Query: `from`, `to`, `page`, `limit` |
| GET | `/api/admin/analytics/shipments` | Admin | Shipment metrics | `adminAnalyticsController.shipments` | Query: `from`, `to`, `page`, `limit` |
| GET | `/api/admin/analytics/customers` | Admin | Customer metrics | `adminAnalyticsController.customers` | Query: `from`, `to`, `page`, `limit` |

## Documentation Artifacts

| Artifact | Path |
|---|---|
| Swagger UI | `/api/docs` |
| OpenAPI JSON | `/api/docs.json` and `docs/openapi.json` |
| OpenAPI YAML | `docs/openapi.yaml` |
| Postman Collection | `docs/postman_collection.json` |
| Frontend API Guide | `docs/frontend-api-guide.md` |
| Environment Guide | `docs/environment.md` |

## Production Notes

- Swagger server URL is dynamic and follows the current deployment host.
- Global API rate limit applies under `/api`.
- Auth endpoints have a stricter limiter.
- Upload endpoints require valid Cloudinary configuration.
- Maintenance worker handles expired payment intents, expired inventory reservations, and failed notification retries unless disabled by environment.
- Background queue is currently process-local; for multi-instance production, back it with Redis/RabbitMQ/SQS in a future infrastructure sprint.
