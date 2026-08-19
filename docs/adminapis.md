# Admin APIs Integration Guide

Generated from the current Express admin routes/controllers for frontend integration.

Base URLs:

```txt
Local: http://localhost:5000
Production: https://harglimpublish-backend.onrender.com
Swagger: /api/docs
OpenAPI JSON: /api/docs.json
```

All admin APIs are mounted under `/api/admin` and require an admin JWT.

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```


# Sprint 12 Admin Compatibility Addendum

These admin endpoints are required by the current Next.js frontend and are implemented without breaking older admin routes.

## CMS Content

### PUT /api/admin/content

Use on the Admin CMS page to update global Home/Publish content. The public frontend reads the same data from `GET /api/content`.

```json
{
  "homeTitle": "You write, we print.\nYou dream, we publish",
  "homeSubtitle": "Explore inspiring books from talented authors.",
  "publishTitle": "Publish Your Book With Us",
  "publishSubtitle": "Transform your manuscript into a published book.",
  "packagesJson": "[{\"name\":\"Basic\",\"price\":5000}]",
  "hero": { "title": "Hero title", "subtitle": "Hero subtitle", "body": "" },
  "about": { "title": "About", "subtitle": "", "body": "" },
  "contact": { "email": "support@example.com", "phone": "", "address": "" },
  "faq": [{ "question": "How do I publish?", "answer": "Submit your manuscript." }],
  "footer": { "title": "Harglim Publishers", "subtitle": "", "body": "" },
  "socialLinks": { "instagram": "https://instagram.com/harglim" },
  "seo": { "title": "Harglim Publishers", "description": "Books and publishing", "keywords": ["books"], "image": "" },
  "announcements": [{ "title": "Submissions", "message": "Open now", "active": true }],
  "siteSettings": { "siteName": "Harglim Publishers", "supportEmail": "support@example.com", "maintenanceMode": false }
}
```

## Combined User Update

### PUT /api/admin/users/:id

Use on Admin Users edit page when the frontend sends role and active status in one request.

```json
{
  "role": "user",
  "status": "Suspended"
}
```

Compatibility mappings:

| Frontend value | Backend value |
|---|---|
| `role: "user"` | `role: "reader"` |
| `status: "Active"` | `isActive: true` |
| `status: "Suspended"` | `isActive: false` |

Existing role/status routes still work.

## Books Pricing And Royalty

Admin book create/update uses `mrp` as the canonical book price. Legacy `price` remains a deprecated compatibility alias and must match `mrp` when both are supplied. `royaltyPercentage` remains optional from `0` to `100`.

```json
{
  "title": "Book Title",
  "description": "Book description",
  "category": "66b4f5a2a44d2c0012a9c102",
  "mrp": 499,
  "price": 499,
  "royaltyPercentage": 10,
  "status": "published"
}
```

## Order Status Compatibility

`PUT /api/admin/orders/:id/status` accepts title-case frontend values and stores existing uppercase enums.

| Frontend value | Stored enum |
|---|---|
| `Processing` | `PROCESSING` |
| `Shipped` | `SHIPPED` |
| `Delivered` | `DELIVERED` |
| `Cancelled` | `CANCELLED` |
## Admin Login

Use the normal auth endpoint, then pass the returned `token` to all admin requests.

```http
POST /api/auth/login
```

Payload:

```json
{
  "email": "admin.demo@harglim.com",
  "password": "DemoPass123!"
}
```

Success response:

```json
{
  "success": true,
  "token": "<jwt-access-token>",
  "refreshToken": "<refresh-token>",
  "refreshTokenExpiresAt": "2026-07-31T10:00:00.000Z",
  "data": {
    "_id": "66b4f5a2a44d2c0012a9c100",
    "name": "Demo Admin",
    "email": "admin.demo@harglim.com",
    "role": "admin"
  }
}
```

Errors:

```json
{
  "success": false,
  "message": "Error message"
}
```

Common frontend handling:

- `401`: token missing/expired, refresh or redirect to login.
- `403`: logged-in user is not admin.
- `409`: duplicate/state conflict.
- `500`: show generic server error plus backend `message` if safe.

## Response Patterns

Top-level paginated lists:

```json
{
  "success": true,
  "data": [],
  "pagination": { "total": 0, "page": 1, "limit": 20, "pages": 0 }
}
```

Operations/module paginated lists:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "total": 0, "page": 1, "limit": 20, "pages": 0 }
  }
}
```

Single resource/action:

```json
{
  "success": true,
  "data": {}
}
```

Date filters used by current runtime services:

```txt
dateFrom=2026-07-01T00:00:00.000Z
dateTo=2026-07-31T23:59:59.999Z
```

Use `dateFrom` and `dateTo` for admin operations, invoices, notifications, shipments, and analytics.

## Recommended Admin Pages

| Frontend Page | APIs |
| --- | --- |
| Login | `POST /api/auth/login` |
| Dashboard | `GET /api/admin/operations/dashboard`, `GET /api/admin/analytics/dashboard` |
| Global Search | `GET /api/admin/operations/search` |
| Users | `/api/admin/users*` |
| Books | `/api/admin/books*` plus public `GET /api/books` for listing |
| Categories | `/api/admin/categories*` |
| Orders | `/api/admin/orders*` |
| Payments | `/api/admin/operations/payments*` |
| Inventory | `/api/admin/operations/inventory/*` |
| Ledgers | `/api/admin/operations/ledger/*` |
| Invoices | `/api/admin/invoices*` |
| Notifications | `/api/admin/notifications*` |
| Shipments | `/api/admin/shipments*` |
| Analytics | `/api/admin/analytics/*` |
| Publishing Requests | `/api/admin/publish-requests*` |
| Author Applications | `/api/admin/author-applications*` |
| Review Moderation | `/api/admin/reviews*` |

---

# 1. Dashboard And Search

## GET /api/admin/operations/dashboard

Use on `/admin/dashboard` for cards and recent activity.

Response:

```json
{
  "success": true,
  "data": {
    "todaysOrders": 12,
    "todaysRevenue": 5400,
    "pendingPayments": 3,
    "pendingReservations": 2,
    "lowStockBooks": [],
    "successfulPayments": 94,
    "failedPayments": 7,
    "revenueToday": 5400,
    "revenueThisMonth": 143000,
    "recentActivity": [
      {
        "type": "payment",
        "eventType": "PAYMENT_VERIFIED",
        "currentStatus": "PAYMENT_VERIFIED",
        "amount": 798,
        "createdAt": "2026-07-24T10:00:00.000Z"
      }
    ]
  }
}
```

## GET /api/admin/operations/search

Use for global admin command search.

Query:

```txt
q=demo&type=payments&page=1&limit=10
```

Response:

```json
{
  "success": true,
  "data": {
    "orders": [],
    "payments": [],
    "customers": [],
    "books": [],
    "categories": [],
    "reservations": [],
    "ledger": []
  }
}
```

## GET /api/admin/analytics

Legacy/core summary. Alias: `GET /api/admin/stats`.

```json
{
  "success": true,
  "data": {
    "totalRevenue": 143000,
    "totalOrders": 120,
    "totalBooksSold": 250,
    "totalBooks": 35,
    "totalUsers": 1400
  }
}
```

---

# 2. User Management

Use on `/admin/users` and `/admin/users/:id`.

## GET /api/admin/users

Query params:

| Param | Type | Notes |
| --- | --- | --- |
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 100 |
| `role` | string | `visitor`, `reader`, `author`, `admin` |
| `isActive` | boolean string | `true` or `false` |
| `search` / `q` | string | Searches name/email |

Example:

```http
GET /api/admin/users?page=1&limit=20&role=reader&search=ghani
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66b4f5a2a44d2c0012a9c100",
      "name": "Ghani Reader",
      "email": "user@example.com",
      "role": "reader",
      "profilePicture": "",
      "isActive": true,
      "createdAt": "2026-07-24T10:00:00.000Z",
      "updatedAt": "2026-07-24T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
}
```

## GET /api/admin/users/:id

Response:

```json
{
  "success": true,
  "data": {
    "_id": "66b4f5a2a44d2c0012a9c100",
    "name": "Ghani Reader",
    "email": "user@example.com",
    "role": "reader",
    "profilePicture": "",
    "isActive": true,
    "wishlist": [],
    "library": [],
    "royaltiesBalance": 0,
    "createdAt": "2026-07-24T10:00:00.000Z"
  }
}
```

## PATCH /api/admin/users/:id/role

Alias: `PUT /api/admin/users/:id/role`.

Payload:

```json
{
  "role": "author"
}
```

Response: updated user in `data`.

## PATCH /api/admin/users/:id/status

Payload:

```json
{
  "isActive": false
}
```

Response: updated user in `data`.

## POST /api/admin/users/:id/reset-password

Payload:

```json
{
  "password": "NewStrongPass123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "_id": "66b4f5a2a44d2c0012a9c100",
    "email": "user@example.com",
    "role": "reader"
  }
}
```

Frontend notes:

- Confirm role changes and password reset actions.
- Minimum password length is 6.

---

# 3. Categories

Use on `/admin/categories`.

## GET /api/admin/categories

Query params: `page`, `limit`, `featured`, `active`, `search`, `sort`.

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66b4f5a2a44d2c0012a9c102",
      "name": "Fiction",
      "slug": "fiction",
      "description": "Fictional stories and novels.",
      "shortDescription": "Demo Fiction collection",
      "image": "https://example.com/category.jpg",
      "banner": "https://example.com/banner.jpg",
      "icon": "book-open",
      "seoTitle": "Fiction Books",
      "seoDescription": "Browse Fiction demo books.",
      "parentCategory": null,
      "sortOrder": 1,
      "bookCount": 12,
      "featured": true,
      "active": true,
      "isActive": true,
      "metadata": {},
      "createdAt": "2026-07-24T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
}
```

## GET /api/admin/categories/:id

Returns one category in `data`.

## POST /api/admin/categories

Payload:

```json
{
  "name": "Business Books",
  "slug": "business-books",
  "description": "Books for founders, operators, and enterprise teams.",
  "shortDescription": "Business and operations titles.",
  "image": "https://example.com/category.jpg",
  "banner": "https://example.com/banner.jpg",
  "icon": "briefcase",
  "seoTitle": "Business Books",
  "seoDescription": "Business books from Harglim Publishers.",
  "parentCategory": null,
  "sortOrder": 10,
  "featured": true,
  "active": true,
  "metadata": { "color": "blue" }
}
```

Rules:

- `name` is required and unique.
- `slug` is optional; backend can generate it from name.
- Do not send `bookCount`; backend manages it.
- Backend syncs `active` and legacy `isActive`.

## PUT /api/admin/categories/:id

Payload: partial category update.

```json
{
  "description": "Updated category description.",
  "featured": false,
  "sortOrder": 20
}
```

## PATCH /api/admin/categories/:id/status

Payload:

```json
{
  "active": false
}
```

## DELETE /api/admin/categories/:id

Soft delete. Categories with active books can return `409`.

---

# 4. Books

Use on `/admin/books`. Admin routes support create/update/delete. For listing/detail, use public catalog APIs `GET /api/books` and `GET /api/books/:slug`.

## POST /api/admin/books

Payload:

```json
{
  "title": "Enterprise Publishing Systems",
  "description": "A practical book about modern publishing operations.",
  "author": "66b4f5a2a44d2c0012a9c103",
  "category": "66b4f5a2a44d2c0012a9c102",
  "mrp": 499,
  "price": 499,
  "coverImage": "https://example.com/cover.jpg",
  "stock": 100,
  "reservedStock": 0,
  "status": "published",
  "discountPrice": 399,
  "isBestseller": true,
  "isFeatured": true,
  "isNewRelease": false,
  "isbn": "9781234567890",
  "pages": 320,
  "format": "paperback"
}
```

Required: `title`, `description`, `category`, and either `mrp` or legacy `price`.

`mrp` is canonical. `price` is returned for compatibility and is synchronized with `mrp`.

Allowed values:

```txt
status: draft, published, archived
format: hardcover, paperback, ebook, audiobook
```

If `author` is omitted, backend uses current admin user.

## PUT /api/admin/books/:id

Payload: partial book update.

```json
{
  "price": 449,
  "stock": 120,
  "status": "published",
  "isBestseller": true
}
```

## DELETE /api/admin/books/:id

Response:

```json
{
  "success": true,
  "message": "Book removed"
}
```

Frontend notes:

- Upload cover first with `POST /api/uploads/image`, then store returned URL as `coverImage`.
- Current admin delete path removes the book record.

---

# 5. Orders

Use on `/admin/orders`.

## GET /api/admin/orders

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66b4f5a2a44d2c0012a9c120",
      "orderNumber": "HM-20260724-0001",
      "user": { "_id": "66b4f5a2a44d2c0012a9c100", "name": "Ghani Reader", "email": "user@example.com" },
      "items": [
        { "book": { "_id": "66b4f5a2a44d2c0012a9c101", "title": "Midnight Letters" }, "quantity": 1, "price": 299 }
      ],
      "subtotal": 299,
      "tax": 0,
      "shippingPrice": 0,
      "totalPrice": 299,
      "isPaid": true,
      "paymentMethod": "UPI",
      "paidAt": "2026-07-24T10:00:00.000Z",
      "utr": "UPI1234567890",
      "payment": "66b4f5a2a44d2c0012a9c130",
      "status": "PROCESSING",
      "trackingUpdates": [],
      "createdAt": "2026-07-24T10:00:00.000Z"
    }
  ]
}
```

## PUT /api/admin/orders/:id/status

Payload:

```json
{
  "status": "SHIPPED"
}
```

Allowed statuses:

```txt
PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
```

Response: updated order in `data`.

Frontend notes:

- Current controller consumes only `status`.
- Use shipment APIs for richer courier tracking.

---

# 6. Payments And Verification

Use on `/admin/payments` and `/admin/payments/:id`.

Payment statuses:

```txt
INTENT_CREATED, QR_PENDING, QR_GENERATED, PAYMENT_PENDING, PENDING,
PAYMENT_SUBMITTED, SUBMITTED, VERIFICATION_PENDING, PAYMENT_VERIFIED,
VERIFIED, PAYMENT_REJECTED, PAYMENT_FAILED, FAILED, PAYMENT_EXPIRED,
PAYMENT_CANCELLED, EXPIRED, CANCELLED, REFUND_REQUESTED,
REFUND_APPROVED, REFUNDED
```

Status groups supported by the service:

```txt
pending:  PAYMENT_SUBMITTED, SUBMITTED, VERIFICATION_PENDING
verified: PAYMENT_VERIFIED, VERIFIED
rejected: PAYMENT_REJECTED
failed:   PAYMENT_FAILED, FAILED
expired:  PAYMENT_EXPIRED, EXPIRED
```

## GET /api/admin/operations/payments

Query params:

| Param | Type | Notes |
| --- | --- | --- |
| `page`, `limit` | number | Pagination |
| `status` | string | Exact payment status |
| `group` | string | `pending`, `verified`, `rejected`, `failed`, `expired` |
| `paymentMethod` | string | Example `UPI` |
| `amountMin`, `amountMax` | number | Amount range |
| `dateFrom`, `dateTo` | ISO date | Created date range |
| `customer` | string | Searches user name/email |
| `orderNumber` | string | Searches order number |
| `book` | ObjectId | Orders containing book |
| `sort` | string | Example `-createdAt` |

Example:

```http
GET /api/admin/operations/payments?group=pending&page=1&limit=20
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "66b4f5a2a44d2c0012a9c130",
        "order": { "_id": "66b4f5a2a44d2c0012a9c120", "orderNumber": "HM-20260724-0001", "totalPrice": 349, "status": "PENDING", "isPaid": false },
        "user": { "_id": "66b4f5a2a44d2c0012a9c100", "name": "Ghani Reader", "email": "user@example.com", "role": "reader" },
        "amount": 349,
        "currency": "INR",
        "paymentMethod": "UPI",
        "provider": "manual_upi",
        "status": "VERIFICATION_PENDING",
        "utr": "UPI1234567890",
        "attemptNumber": 1,
        "successfulPayment": false,
        "activeIntent": true,
        "createdAt": "2026-07-24T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

## GET /api/admin/operations/payments/:id

Use for the payment detail drawer/page.

Response includes:

```txt
payment, paymentIntent, qr, verificationHistory, paymentLedger,
order, customer, books, inventoryReservations, inventoryLedger, auditHistory
```

Example shape:

```json
{
  "success": true,
  "data": {
    "payment": { "_id": "66b4...", "amount": 349, "status": "VERIFICATION_PENDING", "utr": "UPI1234567890" },
    "paymentIntent": { "activeIntent": true, "expiresAt": "2026-07-24T11:00:00.000Z" },
    "qr": { "upiUri": "upi://pay?...", "qrCodeDataUrl": "data:image/png;base64,..." },
    "verificationHistory": [],
    "paymentLedger": [],
    "order": {},
    "customer": {},
    "books": [],
    "inventoryReservations": [],
    "inventoryLedger": [],
    "auditHistory": []
  }
}
```

## POST /api/admin/operations/payments/:id/approve

Payload:

```json
{
  "reason": "UTR matched bank statement",
  "metadata": { "source": "admin-dashboard" }
}
```

Response: latest payment detail.

## POST /api/admin/operations/payments/:id/reject

Payload:

```json
{
  "reason": "UTR could not be verified"
}
```

Response: latest payment detail.

## POST /api/admin/operations/payments/:id/cancel

Payload:

```json
{
  "reason": "Customer requested cancellation",
  "metadata": { "source": "admin-dashboard" }
}
```

Response: latest payment detail.

## POST /api/admin/operations/payments/:id/expire

Payload:

```json
{
  "reason": "Payment window expired"
}
```

Response: latest payment detail.

## POST /api/admin/operations/payments/:id/retry-verification

No payload. Current behavior returns latest payment detail; no gateway verification runs yet.

## POST /api/admin/operations/payments/:id/recreate-qr

Payload:

```json
{
  "force": true,
  "reason": "Customer requested fresh QR"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "qr": { "qrPayload": "upi://pay?...", "qrCodeDataUrl": "data:image/png;base64,..." },
    "detail": { "payment": {}, "qr": {}, "order": {}, "customer": {} }
  }
}
```

Frontend notes:

- Use confirmation modals for approve/reject/cancel/expire.
- Refresh list and detail after any action.
- Payment approval/rejection should be done through these APIs, not by updating order status manually.

---

# 7. Inventory Operations

## GET /api/admin/operations/inventory/reservations

Use on `/admin/inventory/reservations`.

Query params: `page`, `limit`, `status`, `book`, `category`, `dateFrom`, `dateTo`, `sort`.

Reservation statuses:

```txt
RESERVED, RELEASED, DEDUCTED, EXPIRED, CANCELLED
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "66b4f5a2a44d2c0012a9c140",
        "reservationId": "reservation-uuid",
        "order": { "orderNumber": "HM-20260724-0001", "status": "PROCESSING", "totalPrice": 349 },
        "payment": { "status": "PAYMENT_VERIFIED", "amount": 349, "paymentMethod": "UPI", "provider": "manual_upi" },
        "book": { "title": "Midnight Letters", "slug": "midnight-letters", "stock": 45, "reservedStock": 0 },
        "quantity": 1,
        "status": "DEDUCTED",
        "reservedAt": "2026-07-24T10:00:00.000Z",
        "expiresAt": "2026-07-24T11:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

## GET /api/admin/operations/inventory/low-stock

Use on `/admin/inventory/low-stock`.

Query params: `threshold`, `page`, `limit`, `category`.

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      { "_id": "66b4...", "title": "Midnight Letters", "stock": 3, "reservedStock": 1, "category": "66b4..." }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

---

# 8. Ledgers And Audit Timeline

Use on `/admin/ledger/payment`, `/admin/ledger/inventory`, and `/admin/ledger/timeline`.

## GET /api/admin/operations/ledger/payments

Query params: `paymentId`, `orderId`, `userId`, `eventType`, `dateFrom`, `dateTo`, `page`, `limit`, `sort`.

Payment ledger events:

```txt
INTENT_CREATED, QR_GENERATED, PAYMENT_SUBMITTED, VERIFICATION_PENDING,
PAYMENT_VERIFIED, PAYMENT_REJECTED, PAYMENT_FAILED, PAYMENT_EXPIRED,
PAYMENT_CANCELLED, REFUND_REQUESTED, REFUND_APPROVED, REFUNDED
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "ledgerId": "ledger-uuid",
        "paymentId": "66b4...",
        "orderId": "66b4...",
        "userId": "66b4...",
        "eventType": "PAYMENT_VERIFIED",
        "previousStatus": "VERIFICATION_PENDING",
        "currentStatus": "PAYMENT_VERIFIED",
        "amount": 349,
        "currency": "INR",
        "provider": "manual_upi",
        "reference": "UPI1234567890",
        "actorType": "ADMIN",
        "reason": "UTR matched bank statement",
        "createdAt": "2026-07-24T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

## GET /api/admin/operations/ledger/inventory

Query params: `reservation`, `order`, `payment`, `book`, `eventType`, `dateFrom`, `dateTo`, `page`, `limit`, `sort`.

Inventory ledger events:

```txt
RESERVED, RELEASED, DEDUCTED, RESTORED, ADJUSTED, EXPIRED
```

Response uses the same nested paginated shape as payment ledger.

## GET /api/admin/operations/ledger/timeline

Query params: `orderId`, `paymentId`, `dateFrom`, `dateTo`, `limit`.

Response:

```json
{
  "success": true,
  "data": [
    { "type": "payment", "eventType": "PAYMENT_VERIFIED", "currentStatus": "PAYMENT_VERIFIED", "amount": 349, "createdAt": "2026-07-24T10:00:00.000Z" },
    { "type": "inventory", "eventType": "DEDUCTED", "currentStatus": "DEDUCTED", "quantity": 1, "createdAt": "2026-07-24T10:00:00.000Z" }
  ]
}
```

---

# 9. Invoices

Use on `/admin/invoices` and `/admin/invoices/:id`.

Invoice statuses:

```txt
GENERATED, VOID, CANCELLED
```

## GET /api/admin/invoices

Query params: `status`, `customer`, `order`, `payment`, `invoiceNumber`, `amountMin`, `amountMax`, `dateFrom`, `dateTo`, `page`, `limit`.

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "66b4...",
        "invoiceNumber": "INV-202607-000001",
        "order": { "orderNumber": "HM-20260724-0001", "status": "PROCESSING", "totalPrice": 349 },
        "payment": { "status": "PAYMENT_VERIFIED", "amount": 349, "paymentMethod": "UPI", "provider": "manual_upi" },
        "customer": { "name": "Ghani Reader", "email": "user@example.com", "role": "reader" },
        "total": 349,
        "currency": "INR",
        "status": "GENERATED",
        "generatedAt": "2026-07-24T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

## GET /api/admin/invoices/search

Same filters as list plus `q` or `search`.

```http
GET /api/admin/invoices/search?q=INV-202607&page=1&limit=20
```

## GET /api/admin/invoices/:id

Returns populated invoice detail in `data`: order, payment, customer, items, totals, currency, status, generated date, metadata.

## GET /api/admin/invoices/:id/download

Returns PDF binary, not JSON.

```txt
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice.pdf"
```

Axios example:

```js
const response = await axios.get(`/api/admin/invoices/${invoiceId}/download`, {
  responseType: 'blob',
  headers: { Authorization: `Bearer ${token}` }
});
```

---

# 10. Notifications

Use on `/admin/notifications`.

Channels:

```txt
EMAIL, SMS, WHATSAPP, PUSH, IN_APP
```

Statuses:

```txt
PENDING, SENT, FAILED, SKIPPED
```

## GET /api/admin/notifications

Query params: `status`, `channel`, `eventType`, `user`, `dateFrom`, `dateTo`, `page`, `limit`.

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "66b4...",
        "notificationId": "notification-uuid",
        "idempotencyKey": "InvoiceGenerated:66b4...",
        "user": { "name": "Ghani Reader", "email": "user@example.com", "role": "reader" },
        "eventType": "InvoiceGenerated",
        "channel": "EMAIL",
        "subject": "Invoice generated",
        "body": "Your invoice is ready.",
        "status": "SENT",
        "retryCount": 0,
        "sentAt": "2026-07-24T10:00:00.000Z",
        "createdAt": "2026-07-24T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

## GET /api/admin/notifications/search

Same filters as list plus `q` or `search`.

## GET /api/admin/notifications/:id

Returns one notification in `data`.

## POST /api/admin/notifications/:id/retry

Payload:

```json
{
  "reason": "Retry after provider recovery",
  "force": false
}
```

Response: updated notification in `data`.

Frontend notes:

- Retry is for failed notifications.
- Backend can return `409` when retry limit is reached.

---

# 11. Shipments

Use on `/admin/shipments` and `/admin/shipments/:id`.

Shipment statuses:

```txt
CREATED, COURIER_ASSIGNED, PICKUP_SCHEDULED, PICKED_UP,
IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, COMPLETED,
CANCELLED, RETURN_REQUESTED, RETURNED
```

## GET /api/admin/shipments

Query params: `status`, `customer`, `order`, `payment`, `invoice`, `courier`, `trackingNumber`, `dateFrom`, `dateTo`, `page`, `limit`.

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "66b4...",
        "shipmentId": "shipment-uuid",
        "order": { "orderNumber": "HM-20260724-0001", "status": "SHIPPED", "totalPrice": 349 },
        "payment": { "status": "PAYMENT_VERIFIED", "amount": 349, "paymentMethod": "UPI", "provider": "manual_upi" },
        "invoice": { "invoiceNumber": "INV-202607-000001", "total": 349, "status": "GENERATED" },
        "customer": { "name": "Ghani Reader", "email": "user@example.com", "role": "reader" },
        "status": "IN_TRANSIT",
        "courier": { "provider": "manual", "serviceName": "Manual Courier" },
        "trackingNumber": "HMTRACK1001",
        "estimatedDelivery": "2026-07-28T10:00:00.000Z",
        "createdAt": "2026-07-24T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

## GET /api/admin/shipments/search

Same filters as list plus `q` or `search`.

## GET /api/admin/shipments/:id

Returns shipment detail in `data` with populated order/payment/invoice/customer.

## GET /api/admin/shipments/:id/tracking

Response:

```json
{
  "success": true,
  "data": {
    "shipment": { "_id": "66b4...", "status": "IN_TRANSIT", "trackingNumber": "HMTRACK1001" },
    "trackingHistory": [
      { "status": "CREATED", "location": "Chennai", "description": "Shipment created", "occurredAt": "2026-07-24T10:00:00.000Z" }
    ],
    "ledger": []
  }
}
```

## POST /api/admin/shipments/:id/assign-courier

Payload:

```json
{
  "provider": "manual",
  "serviceName": "Manual Courier",
  "trackingNumber": "MAN123456",
  "trackingUrl": "https://example.com/track/MAN123456",
  "estimatedDelivery": "2026-07-28T10:00:00.000Z"
}
```

## POST /api/admin/shipments/:id/update-status

Payload:

```json
{
  "status": "IN_TRANSIT",
  "location": "Chennai Hub",
  "description": "Package departed sorting center",
  "reason": "Courier update",
  "occurredAt": "2026-07-24T10:30:00.000Z",
  "metadata": { "source": "admin-dashboard" }
}
```

## POST /api/admin/shipments/:id/cancel

Payload:

```json
{
  "reason": "Customer cancelled before pickup"
}
```

Frontend notes:

- Backend validates status transitions.
- Invalid transition returns `400`.
- Status updates append tracking history.

---

# 12. Analytics Reports

Use on `/admin/analytics`.

All analytics endpoints return export-ready envelopes:

```json
{
  "success": true,
  "data": {
    "type": "dashboard",
    "generatedAt": "2026-07-24T10:00:00.000Z",
    "filters": {},
    "data": {}
  }
}
```

Common query params: `dateFrom`, `dateTo`, `period`, `page`, `limit`, `sort`.

Periods:

```txt
daily, weekly, monthly, yearly
```

## GET /api/admin/analytics/dashboard

Dashboard charts. Response `data.data` includes:

```txt
revenue, payments, inventory, shipments, customers, bestBooks, topCategories
```

## GET /api/admin/analytics/revenue

Revenue chart by period.

```http
GET /api/admin/analytics/revenue?period=monthly&dateFrom=2026-01-01T00:00:00.000Z&dateTo=2026-12-31T23:59:59.999Z
```

Response inner data example:

```json
[
  { "_id": "2026-07", "amount": 143000, "count": 120 }
]
```

## GET /api/admin/analytics/books

Book reports. Response inner data includes:

```txt
bestSelling, lowestSelling, categories
```

## GET /api/admin/analytics/payments

Payment metrics.

```json
{
  "successfulPayments": 94,
  "failedPayments": 7,
  "successfulAmount": 143000,
  "failedAmount": 3500,
  "successRate": 0.93,
  "failureRate": 0.07
}
```

## GET /api/admin/analytics/inventory

Inventory reserved/released/deducted movement.

## GET /api/admin/analytics/shipments

Shipment created/delivered metrics.

## GET /api/admin/analytics/customers

Customer order trend metrics.

Frontend notes:

- Analytics are event-driven and can be eventually consistent.
- Display `generatedAt` as report freshness.

---

# 13. Publishing Requests

Use on `/admin/publishing/requests`.

## GET /api/admin/publish-requests

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66b4...",
      "user": { "_id": "66b4...", "name": "Demo Author", "email": "author@example.com" },
      "title": "My Manuscript",
      "genre": "Business",
      "wordCount": 65000,
      "packageId": { "_id": "66b4...", "name": "Premium" },
      "fileUrl": "https://example.com/manuscript.pdf",
      "status": "pending",
      "createdAt": "2026-07-24T10:00:00.000Z"
    }
  ]
}
```

## PUT /api/admin/publish-requests/:id/status

Payload:

```json
{
  "status": "accepted"
}
```

Allowed statuses:

```txt
pending, reviewed, accepted, rejected
```

Response: updated publish request in `data`.

---

# 14. Author Applications

Use on `/admin/author-applications`.

## GET /api/admin/author-applications

Query params: `status`.

Allowed statuses:

```txt
pending, approved, rejected
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66b4...",
      "user": { "_id": "66b4...", "name": "Ghani Reader", "email": "user@example.com" },
      "penName": "Ghani Writes",
      "bio": "Short author bio.",
      "portfolioUrl": "https://example.com/portfolio",
      "experience": "Two manuscripts and one blog series.",
      "status": "pending",
      "reviewedBy": null,
      "reviewedAt": null,
      "createdAt": "2026-07-24T10:00:00.000Z"
    }
  ]
}
```

## PUT /api/admin/author-applications/:id/status

Payload:

```json
{
  "status": "approved"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "_id": "66b4...",
    "status": "approved",
    "reviewedBy": "66b4...",
    "reviewedAt": "2026-07-24T10:00:00.000Z",
    "user": { "_id": "66b4...", "name": "Ghani Reader", "email": "user@example.com", "role": "author" }
  }
}
```

Frontend notes:

- If status is `approved`, backend also changes the user role to `author`.
- If rejected, user role is not promoted.

---

# 15. Review Moderation

Use on `/admin/reviews`.

Review statuses in the model:

```txt
visible, hidden, rejected
```

## GET /api/admin/reviews

Query params: `page`, `limit`, `status`, `book`, `user`.

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66b4...",
      "book": { "_id": "66b4...", "title": "Midnight Letters", "slug": "midnight-letters" },
      "user": { "_id": "66b4...", "name": "Ghani Reader", "email": "user@example.com" },
      "rating": 5,
      "comment": "Great book.",
      "status": "visible",
      "moderatedBy": null,
      "moderatedAt": null,
      "createdAt": "2026-07-24T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
}
```

## PATCH /api/admin/reviews/:reviewId/status

Payload:

```json
{
  "status": "hidden"
}
```

Recommended frontend values:

```txt
visible, hidden, rejected
```

Response: updated review in `data`.

## DELETE /api/admin/reviews/:id

Response:

```json
{
  "success": true,
  "message": "Review removed"
}
```

---

# 16. Complete Admin Endpoint Index

## Dashboard / Operations

```txt
GET  /api/admin/analytics
GET  /api/admin/stats
GET  /api/admin/operations/dashboard
GET  /api/admin/operations/search
```

## Users

```txt
GET   /api/admin/users
GET   /api/admin/users/:id
PATCH /api/admin/users/:id/role
PUT   /api/admin/users/:id/role
PATCH /api/admin/users/:id/status
POST  /api/admin/users/:id/reset-password
```

## Author Applications

```txt
GET /api/admin/author-applications
PUT /api/admin/author-applications/:id/status
```

## Reviews

```txt
GET    /api/admin/reviews
PATCH  /api/admin/reviews/:reviewId/status
DELETE /api/admin/reviews/:id
```

## Categories

```txt
GET    /api/admin/categories
GET    /api/admin/categories/:id
POST   /api/admin/categories
PUT    /api/admin/categories/:id
PATCH  /api/admin/categories/:id/status
DELETE /api/admin/categories/:id
```

## Books

```txt
POST   /api/admin/books
PUT    /api/admin/books/:id
DELETE /api/admin/books/:id
```

## Orders

```txt
GET /api/admin/orders
PUT /api/admin/orders/:id/status
```

## Publishing

```txt
GET /api/admin/publish-requests
PUT /api/admin/publish-requests/:id/status
```

## Payments

```txt
GET  /api/admin/operations/payments
GET  /api/admin/operations/payments/:id
POST /api/admin/operations/payments/:id/approve
POST /api/admin/operations/payments/:id/reject
POST /api/admin/operations/payments/:id/cancel
POST /api/admin/operations/payments/:id/expire
POST /api/admin/operations/payments/:id/retry-verification
POST /api/admin/operations/payments/:id/recreate-qr
```

## Inventory

```txt
GET /api/admin/operations/inventory/reservations
GET /api/admin/operations/inventory/low-stock
```

## Ledgers

```txt
GET /api/admin/operations/ledger/payments
GET /api/admin/operations/ledger/inventory
GET /api/admin/operations/ledger/timeline
```

## Invoices

```txt
GET /api/admin/invoices/search
GET /api/admin/invoices
GET /api/admin/invoices/:id/download
GET /api/admin/invoices/:id
```

## Notifications

```txt
GET  /api/admin/notifications/search
GET  /api/admin/notifications
GET  /api/admin/notifications/:id
POST /api/admin/notifications/:id/retry
```

## Shipments

```txt
GET  /api/admin/shipments/search
GET  /api/admin/shipments
GET  /api/admin/shipments/:id/tracking
GET  /api/admin/shipments/:id
POST /api/admin/shipments/:id/assign-courier
POST /api/admin/shipments/:id/update-status
POST /api/admin/shipments/:id/cancel
```

## Analytics

```txt
GET /api/admin/analytics/dashboard
GET /api/admin/analytics/revenue
GET /api/admin/analytics/books
GET /api/admin/analytics/payments
GET /api/admin/analytics/inventory
GET /api/admin/analytics/shipments
GET /api/admin/analytics/customers
```

---

# 17. Frontend Integration Checklist

- Login with admin account and store `token`.
- Add `Authorization: Bearer <token>` to every `/api/admin/*` request.
- Use Swagger `/api/docs` for live testing.
- Use `dateFrom` and `dateTo` for date filtering.
- Support both list response shapes: `data[]` and `data.items[]`.
- For invoice downloads, request blob/binary, not JSON.
- Refresh list/detail after mutations.
- Show confirmation dialogs for role changes, password reset, payment approval/rejection, shipment cancellation, category delete, book delete, and review delete.
- Display backend `message` from error responses.

Suggested frontend routes:

```txt
/admin/login
/admin/dashboard
/admin/users
/admin/users/:id
/admin/books
/admin/categories
/admin/orders
/admin/payments
/admin/payments/:id
/admin/inventory/reservations
/admin/inventory/low-stock
/admin/ledger/payment
/admin/ledger/inventory
/admin/ledger/timeline
/admin/invoices
/admin/invoices/:id
/admin/notifications
/admin/shipments
/admin/shipments/:id
/admin/analytics
/admin/publishing/requests
/admin/author-applications
/admin/reviews
```

Dummy admin account after running `npm run seed:dummy`:

```txt
Email: admin.demo@harglim.com
Password: DemoPass123!
```
