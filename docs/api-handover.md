# HM Backend API Handover

Derived from the current Express routes, controllers, `src/docs/apiInventory.js`, generated OpenAPI, and certification tests.

Repository identity:

- Branch: `main`
- HEAD: `6d437ad4cde316f1a00e7d5e2b911b45a359c053`
- Route declarations inspected: 174
- Canonical method+path APIs in inventory: 165
- OpenAPI paths: 149

For exhaustive generated per-endpoint examples, use `docs/frontend-api-guide.md`, `docs/openapi.json`, and `docs/postman_collection.json`. This file explains when and how the frontend should call each API group.

## Global Response Shapes

Most successful JSON APIs return:

```json
{
  "success": true,
  "data": {}
}
```

Paginated APIs usually return:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  }
}
```

Some newer APIs use `totalPages` instead of `pages`; handle both.

Errors usually return:

```json
{
  "success": false,
  "message": "Error message"
}
```

Some authorization and service errors also include stable `error` or `code`.

## Authentication

### Register

`POST /api/auth/register`

Payload:

```json
{
  "name": "Reader Name",
  "email": "reader@example.com",
  "password": "StrongPass123!",
  "role": "reader"
}
```

Use for public sign-up. Frontend should default role to `reader`; do not allow public admin creation.

### Login

`POST /api/auth/login`

Payload:

```json
{
  "email": "reader@example.com",
  "password": "StrongPass123!"
}
```

Use returned `data.token` as Bearer token.

### Refresh, Logout, Password

- `POST /api/auth/refresh` with `{ "refreshToken": "<REFRESH_TOKEN>" }`
- `POST /api/auth/logout` with optional `{ "refreshToken": "...", "all": false }`
- `POST /api/auth/forgot-password` with `{ "email": "reader@example.com" }`
- `PUT /api/auth/reset-password/:token` or `POST /api/auth/reset-password/:token` with `{ "password": "NewPass123!" }`
- `PUT /api/auth/change-password` or `POST /api/auth/change-password` with `{ "currentPassword": "...", "password": "..." }`
- `GET /api/auth/me`

Frontend behavior: on `401`, refresh once, then redirect to login if refresh fails.

## User Context

`GET /api/users/me/context`

Call after login/app refresh. Use it to decide UI navigation for reader, author, paid dashboard, and admin.

Frontend should store derived capabilities, not duplicate backend authorization logic.

## Public Catalog APIs

- `GET /api/content`
- `GET /api/books`
- `GET /api/books/:slug`
- `GET /api/books/:slug/related`
- `GET /api/books/:slug/reviews`
- `GET /api/categories`
- `GET /api/categories/:slug`
- `GET /api/categories/:slug/books`
- `GET /api/authors`
- `GET /api/authors/:id`
- `GET /api/authors/:id/books`
- `GET /api/search?q=<term>`
- `GET /api/publish-packages`

Book pricing:

```text
book.mrp = canonical selling price.
book.price = legacy compatibility alias.
```

Frontend may display `mrp`, but checkout totals must come from `POST /api/orders`.

## Reviews

Customer review APIs:

- `POST /api/books/:slug/reviews`
- `PUT /api/books/:slug/reviews/:reviewId`
- `DELETE /api/books/:slug/reviews/:reviewId`
- `POST /api/reviews`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`

Typical payload:

```json
{
  "rating": 5,
  "comment": "Loved this book"
}
```

Disable duplicate submit while a request is in flight.

## Checkout And Customer Payment

### Create Order

`POST /api/orders`

Auth: Bearer token.

Payload:

```json
{
  "items": [
    {
      "book": "<BOOK_ID>",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "fullName": "Reader Name",
    "addressLine1": "Street 1",
    "addressLine2": "Apartment",
    "city": "Chennai",
    "postalCode": "600001",
    "country": "IN"
  },
  "paymentMethod": "UPI"
}
```

Frontend must not send:

- `price`
- `mrp`
- `subtotal`
- `tax`
- `shippingPrice`
- `totalPrice`
- payment amount
- payment purpose
- author ID
- royalty percentage

Success response:

```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "<ORDER_ID>",
      "orderNumber": "HM-XXXX",
      "subtotal": 499,
      "tax": 0,
      "shippingPrice": 0,
      "totalPrice": 499,
      "isPaid": false,
      "payment": "<PAYMENT_ID>",
      "status": "PENDING"
    },
    "payment": {
      "paymentId": "<PAYMENT_ID>",
      "purpose": "ORDER_PURCHASE",
      "status": "QR_GENERATED",
      "amount": 549,
      "currency": "INR",
      "upiUri": "upi://pay?...",
      "qrImage": "data:image/png;base64,...",
      "qrCodeDataUrl": "data:image/png;base64,...",
      "qrExpiresAt": "2026-08-09T12:15:00.000Z"
    }
  }
}
```

### Submit UTR

`PUT /api/orders/:id/verify-payment`

Payload:

```json
{
  "utr": "UTR123456789"
}
```

This submits customer proof. It does not instantly mark the order paid; admin verification is required.

Payment errors to handle:

- Missing UTR: show validation message.
- Invalid UTR: ask user to recheck transaction reference.
- Duplicate UTR: show already-used message and direct user to support.
- Expired/cancelled intent: request a new checkout/payment attempt if exposed in the UI.
- Already verified: refresh order state.

## Customer Account APIs

- `GET /api/users/me`
- `PUT /api/users/:id`
- `GET /api/users/:id/stats`
- `GET /api/users/:id/orders`
- `GET /api/users/:id/orders/:orderId/payments`
- `GET /api/users/:id/payments`
- `GET /api/users/:id/payments/:paymentId`
- `GET /api/users/:id/invoices`
- `GET /api/users/:id/invoices/:invoiceId`
- `GET /api/users/:id/invoices/:invoiceId/download`
- `GET /api/users/:id/shipments`
- `GET /api/users/:id/shipments/:shipmentId`
- `GET /api/users/:id/notifications`
- `PATCH /api/users/:id/notifications/read-all`
- `PATCH /api/users/:id/notifications/:notificationId/read`
- `GET /api/users/:id/notifications/:notificationId`
- `DELETE /api/users/:id/notifications/:notificationId`
- `GET /api/users/:id/wishlist`
- `POST /api/users/:id/wishlist`
- `DELETE /api/users/:id/wishlist/:bookId`
- `GET /api/users/:id/library`

Ownership is enforced by backend. The frontend should still use the authenticated user's id from context.

## Author Application

- `GET /api/users/me/author-application`
- `POST /api/author-applications`
- `GET /api/admin/author-applications?status=pending`
- `PUT /api/admin/author-applications/:id/status`

User submit payload:

```json
{
  "penName": "Optional Pen Name",
  "bio": "Short author bio",
  "portfolioUrl": "https://example.com",
  "experience": "Writing background"
}
```

Admin status payload:

```json
{
  "status": "approved"
}
```

If approved, backend updates the user role to `author`.

## Author Publishing

Publishing does not require paid dashboard access.

Author-owned book APIs:

- `GET /api/authors/me/books`
- `POST /api/authors/me/books`
- `GET /api/authors/me/books/:bookId`
- `PUT /api/authors/me/books/:bookId`
- `DELETE /api/authors/me/books/:bookId`
- `POST /api/authors/me/books/:bookId/submit`

Create draft payload:

```json
{
  "title": "My Book",
  "description": "Long enough description",
  "category": "<CATEGORY_ID>",
  "mrp": 499,
  "format": "paperback",
  "coverImage": "https://res.cloudinary.com/.../cover.jpg",
  "isbn": "9780000000000",
  "pages": 240
}
```

Forbidden author fields:

- `author`
- `status`
- `royaltyPercentage`
- `stock`
- `reservedStock`
- `ratings`
- `reviewCount`
- `isBestseller`
- `isFeatured`
- `isNewRelease`
- `discountPrice`
- `slug`

Submit for review payload:

```json
{
  "fileUrl": "https://res.cloudinary.com/.../manuscript.pdf",
  "genre": "Fiction",
  "wordCount": 50000,
  "packageId": "<PUBLISH_PACKAGE_ID>"
}
```

## Uploads

Image:

- `POST /api/uploads/image`
- `POST /api/uploads/publishing-image`
- `POST /api/authors/me/uploads/image`
- Multipart field: `image`
- Allowed: jpg, jpeg, png, webp, gif

Document:

- `POST /api/uploads/document`
- `POST /api/uploads/publishing-document`
- `POST /api/authors/me/uploads/document`
- Multipart field: `document`
- Allowed: pdf, doc, docx

Default max size: 25 MB unless `UPLOAD_MAX_BYTES` is configured differently.

Cloudinary must be configured in backend deployment. If not, upload endpoints return a configuration error instead of crashing.

## Paid Author Dashboard Access

- `GET /api/authors/me/dashboard-access`
- `POST /api/authors/me/dashboard-access/purchase`
- `PUT /api/authors/me/dashboard-access/purchases/:purchaseId/verify-payment`

Frontend cannot choose plan amount, payment purpose, or subject. Backend snapshots active plan price and creates an `AUTHOR_ACCESS` payment.

Actual access states include:

- `NOT_AUTHOR`
- `APPROVED_AUTHOR_NO_PLAN`
- `PAYMENT_PENDING`
- `VERIFICATION_PENDING`
- `ACTIVE`
- `REVOKED`

If `REVOKED`, keep publishing visible but lock paid dashboard screens.

## Author Dashboard And Royalties

Requires author role plus active dashboard entitlement, or admin.

- `GET /api/authors/me/dashboard`
- `GET /api/authors/me/analytics?range=30d`
- `GET /api/authors/me/books/performance`
- `GET /api/authors/me/royalties?page=1&limit=10`
- `GET /api/authors/:id/stats`
- `GET /api/authors/:id/analytics`
- `GET /api/authors/:id/royalties/history`

Royalty meanings:

- `accruedKnown`: known royalty from verified paid sales.
- `eligibleUnsettled`: delivered paid sales eligible for settlement.
- `settledPendingPayment`: approved/settled but not marked paid.
- `paidLifetime`: payout records marked paid.
- `dataStatus: PARTIAL`: some legacy sale lines cannot calculate royalty.
- `royaltyAmount: null`: unknown historical royalty. Do not display as INR 0.
- `royaltyAmount: 0`: known zero royalty.

## Author Royalty Settlements

- `GET /api/authors/me/royalty-settlements`
- `GET /api/authors/me/royalty-settlements/:id`

Accounting definitions:

- `ACCRUED`: paid sale exists and royalty can be calculated.
- `ELIGIBLE`: delivered paid sale can be included in settlement.
- `SETTLED`: sale line has been claimed into an approved settlement.
- `PAID`: admin recorded manual payout.

## Admin APIs

All `/api/admin/**` APIs require admin role.

Main groups:

- Dashboard: `/api/admin/dashboard`, `/api/admin/analytics`, `/api/admin/stats`
- Users: `/api/admin/users*`
- Authors: `/api/admin/authors/:authorId*`
- Author applications: `/api/admin/author-applications*`
- Author access plans/purchases/entitlements: `/api/admin/author-access/*`
- Payment verification and operations: `/api/admin/operations/*`
- Publishing review: `/api/admin/publish-requests*`
- Books: `/api/admin/books*`
- Orders: `/api/admin/orders*`
- Invoices: `/api/admin/invoices*`
- Shipments: `/api/admin/shipments*`
- Royalty settlements: `/api/admin/royalty-settlements*`
- Content: `PUT /api/admin/content`
- Categories: `/api/admin/categories*`
- Reviews: `/api/admin/reviews*`
- Notifications: `/api/admin/notifications*`
- Analytics: `/api/admin/analytics/*`

## Admin Critical Payloads

Update user:

```json
{
  "role": "user",
  "status": "Active",
  "isActive": true
}
```

Compatibility mappings happen server-side:

- `role: "user"` -> `reader`
- `status: "Active"` -> `isActive: true`
- `status: "Suspended"` -> `isActive: false`

Create/update book:

```json
{
  "title": "Book Title",
  "description": "Book description",
  "category": "<CATEGORY_ID>",
  "mrp": 499,
  "price": 499,
  "royaltyPercentage": 10,
  "stock": 100,
  "status": "published"
}
```

Update order status:

```json
{
  "status": "Processing"
}
```

Server maps title-case values to uppercase persisted enums.

Payment approval:

```json
{
  "reason": "Verified UTR in bank statement"
}
```

Payment rejection:

```json
{
  "reason": "UTR not found"
}
```

Royalty settlement preview:

```json
{
  "authorId": "<AUTHOR_ID>",
  "from": "2026-08-01",
  "to": "2026-08-31"
}
```

Create settlement:

```json
{
  "authorId": "<AUTHOR_ID>",
  "periodStart": "2026-08-01",
  "periodEnd": "2026-08-31"
}
```

Mark paid:

```json
{
  "paymentMethod": "MANUAL_BANK_TRANSFER",
  "transactionReference": "BANK-REF-123",
  "paidAt": "2026-08-09T10:00:00.000Z",
  "notes": "Transferred outside HM"
}
```

Frontend cannot change payout amount. Backend uses settlement total.

## State Enums

Persisted backend enums:

- User roles: `reader`, `author`, `admin`
- Book status: `draft`, `published`, `archived`
- Order status: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- Payment purpose: `ORDER_PURCHASE`, `AUTHOR_ACCESS`
- Payment status: `INTENT_CREATED`, `QR_PENDING`, `QR_GENERATED`, `PAYMENT_PENDING`, `PAYMENT_SUBMITTED`, `VERIFICATION_PENDING`, `PAYMENT_VERIFIED`, `PAYMENT_REJECTED`, `PAYMENT_FAILED`, `PAYMENT_EXPIRED`, `PAYMENT_CANCELLED`, `REFUND_REQUESTED`, `REFUND_APPROVED`, `REFUNDED`
- Author application status: `pending`, `approved`, `rejected`
- Publish request status: `PENDING`, `UNDER_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED`
- Dashboard access status: `ACTIVE`, `REVOKED`, plus derived states from status endpoint.
- Royalty status: `CALCULATED`, `HISTORICAL_RATE_UNAVAILABLE`
- Settlement status: `DRAFT`, `READY_FOR_APPROVAL`, `APPROVED`, `PAYMENT_PENDING`, `PAID`, `CANCELLED`
- Payout status: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`

Derived frontend checkout states:

```text
CART -> ORDER_CREATED -> PAYMENT_PENDING -> VERIFICATION_PENDING -> PAID -> PROCESSING -> SHIPPED -> DELIVERED
```

## Retry And Idempotency Guidance

- GET requests are safe to retry.
- Disable submit buttons for all POST/PUT/PATCH/DELETE calls while in flight.
- UTR submission should not be spammed; backend rejects duplicate UTR or duplicate submission.
- Payment approval/rejection should refresh queue after completion.
- Author access purchase may return an existing pending purchase instead of creating a duplicate.
- Settlement approval is protected by a unique claim index; conflicts mean refresh the settlement queue.
- Mark-paid is not a casual retry; frontend must require confirmation because it records manual financial payout history.

## Security Rules For Frontend

- Never trust client-side authorization.
- Never send client-controlled totals, payment purpose, or payout amount.
- Never expose backend secrets.
- Never log JWTs, refresh tokens, UTR, private manuscript URLs, or admin payment details.
- Use `GET /api/users/me/context` for UI capability hints only.
