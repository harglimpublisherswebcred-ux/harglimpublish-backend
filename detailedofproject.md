# Detailed Project Status - HM Backend

Date: 2026-08-04
Project: HM Backend / Harglim Publishers Backend
Stack: Node.js, Express, MongoDB, Mongoose, JWT, Swagger/OpenAPI
Status: Production-candidate backend with marketplace, publishing, manual UPI payment, inventory reservation, invoice, shipment, notification, analytics, CMS, and admin operations modules.

---

## 1. Executive Summary

This backend is no longer a basic bookstore API. It has grown into an enterprise-style publishing and commerce backend with clean architecture patterns:

Client / Admin / Swagger
-> Express Routes
-> Controllers
-> Services
-> Repositories
-> Mongoose Models
-> MongoDB
-> Event Bus / Jobs / Workers for async side effects

The system currently supports:

- Public catalog browsing.
- Category and search APIs.
- User authentication and account dashboards.
- Author applications and publishing requests.
- Checkout using manual UPI QR payment flow.
- Payment intents, payment verification, payment ledger.
- Reservation-based inventory engine and inventory ledger.
- Invoice generation after verified payment.
- Shipment and fulfillment foundation.
- Notification engine.
- Analytics and reporting APIs.
- Admin operations dashboard APIs.
- CMS content APIs for frontend-managed static text.
- Developer portal, Swagger UI, OpenAPI JSON/YAML, Postman collection, and frontend API guide.

Current documented API inventory: 121 endpoint entries.
OpenAPI path templates currently generated: 110.

---

## 2. Current Readiness Status

| Area | Status | Notes |
|---|---|---|
| Runtime architecture | Good | Service -> Repository architecture is used across newer modules. Legacy modules have been progressively refactored. |
| API coverage | Good | Swagger/OpenAPI/Postman/frontend guide are generated from `src/docs/apiInventory.js`. |
| Authentication | Good | JWT access tokens, refresh sessions, logout, change password, reset password. |
| Admin backend | Strong | Users, books, categories, payments, inventory, ledgers, invoices, notifications, shipments, analytics. |
| Payment system | Strong for manual UPI | Provider-agnostic model exists, but Razorpay/Cashfree/PhonePe are not implemented yet. |
| Inventory | Strong foundation | Reservation-first design prevents immediate checkout deduction. |
| Async/event system | Good foundation | Internal event bus, subscribers, queue/worker scaffolding. External broker not yet connected. |
| Documentation | Strong | Developer portal, Swagger, OpenAPI, Postman, API documentation, frontend guide. |
| Frontend compatibility | Good | Sprint 12 added CMS, `/users/me`, combined admin user update, status normalization, royalty field. |
| Production scaling | Medium | Process-local queue is acceptable for one instance, but Redis/RabbitMQ/SQS should be next for multi-instance deployment. |

Last validated checks from current work:

- `npm run lint` passed.
- OpenAPI generation/validation passed.
- Sprint 12 integration suite passed: 1 suite, 9 tests.
- `.env` is not tracked by Git; `.env.example` is tracked.

---

## 3. High-Level Architecture

```text
Frontend / Admin / Swagger
        |
        v
Express Server
        |
        v
Routes
        |
        v
Controllers
        |
        v
Services - business rules
        |
        v
Repositories - database access
        |
        v
Mongoose Models
        |
        v
MongoDB
```

Async flow:

```text
Service state change
        |
        v
Domain Event
        |
        v
Event Bus
        |
        v
Subscribers
        |
        v
Jobs / Workers / Services
```

Important runtime files:

| Layer | Main Files |
|---|---|
| Server | `server.js` |
| API inventory | `src/docs/apiInventory.js` |
| Swagger/OpenAPI | `src/docs/swagger.js`, `src/docs/openapiSpec.js` |
| Event bus | `src/events/eventBus.js`, `src/events/eventCatalog.js`, `src/events/registerSubscribers.js` |
| Jobs/workers | `src/jobs/jobQueue.js`, `src/workers/eventWorker.js`, `src/workers/maintenanceWorker.js` |
| Logging | `src/utils/logger.js` |

---

## 4. Core Business Modules

## 4.1 System And Developer Portal

Purpose:

- Provide health check.
- Provide backend landing page.
- Provide Swagger/OpenAPI documentation.

APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/` | Public | Developer portal landing page. |
| GET | `/health` | Public | Server liveness check. |
| GET | `/api/docs` | Public | Swagger UI. |
| GET | `/api/docs.json` | Public | Dynamic OpenAPI JSON. |

Flow:

```text
Browser
-> GET /
-> Developer Portal
-> Swagger / OpenAPI / Health links
```

---

## 4.2 Authentication And Security

Purpose:

- Register/login users.
- Manage JWT sessions.
- Refresh and revoke sessions.
- Password reset and change password.
- Protect user/admin endpoints.

User roles:

- `visitor`
- `reader`
- `author`
- `admin`

APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account. |
| POST | `/api/auth/login` | Public | Login and receive token. |
| POST | `/api/auth/refresh` | Public/Bearer | Refresh access token. |
| POST | `/api/auth/logout` | Public/Bearer | Revoke refresh session. |
| POST | `/api/auth/forgot-password` | Public | Request reset token. |
| GET | `/api/auth/me` | Bearer | Current auth user. |
| PUT | `/api/auth/reset-password/{token}` | Public | Reset password. |
| POST | `/api/auth/reset-password/{token}` | Public | Reset password alias. |
| PUT | `/api/auth/change-password` | Bearer | Change password. |
| POST | `/api/auth/change-password` | Bearer | Change password alias. |

Flow:

```text
Register/Login
-> JWT access token + refresh token
-> Frontend stores token securely
-> Protected API sends Authorization: Bearer <token>
-> Admin APIs also require role = admin
```

Next-level recommendation:

- Add device/session management UI.
- Add MFA/OTP for admin accounts.
- Add optional social login only if product needs it.

---

## 4.3 CMS Content Engine

Purpose:

- Let frontend fetch and admin update global static content.
- Supports Home page, Publish page, SEO, footer, social links, announcements, FAQ, site settings.

APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/api/content` | Public | Fetch global CMS content. |
| PUT | `/api/admin/content` | Admin | Update global CMS content. |

Content fields:

- `hero`
- `about`
- `contact`
- `faq`
- `footer`
- `socialLinks`
- `seo`
- `announcements`
- `siteSettings`
- `homeTitle`
- `homeSubtitle`
- `publishTitle`
- `publishSubtitle`
- `packagesJson`

Frontend flow:

```text
Home / Publish page loads
-> GET /api/content
-> Render hero/about/package text/SEO/footer
```

Admin flow:

```text
Admin CMS page
-> PUT /api/admin/content
-> ContentService validates allowed fields
-> ContentRepository upserts singleton global content
```

---

## 4.4 Catalog: Books, Categories, Search, Authors

Purpose:

- Public storefront browsing.
- Category pages.
- Search pages.
- Author pages.
- Admin book/category management.

Public book APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/api/books` | Public | List/filter books. |
| GET | `/api/books/{slug}` | Public | Book detail page. |
| GET | `/api/books/{slug}/related` | Public | Related books. |
| GET | `/api/search` | Public | Search books. |

Book review APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| POST | `/api/books/{slug}/reviews` | Bearer | Create review by slug. |
| PUT | `/api/books/{slug}/reviews/{reviewId}` | Bearer | Update review. |
| DELETE | `/api/books/{slug}/reviews/{reviewId}` | Bearer | Delete review. |
| POST | `/api/reviews` | Bearer | Create review by book id. |
| PUT | `/api/reviews/{id}` | Bearer | Update review. |
| DELETE | `/api/reviews/{id}` | Bearer | Delete review. |

Category APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/api/categories` | Public | List active categories. |
| GET | `/api/categories/{slug}` | Public | Category detail. |
| GET | `/api/categories/{slug}/books` | Public | Books in category. |

Author APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/api/authors` | Public | List authors. |
| GET | `/api/authors/{id}` | Public | Author profile. |
| GET | `/api/authors/{id}/books` | Public | Author books. |
| GET | `/api/authors/{id}/stats` | Bearer | Author dashboard stats. |
| GET | `/api/authors/{id}/analytics` | Bearer | Author analytics alias. |
| GET | `/api/authors/{id}/royalties/history` | Bearer | Royalty history endpoint foundation. |

Book model supports:

- `title`, `slug`, `description`
- `author`, `category`
- `price`, `discountPrice`
- `stock`, `reservedStock`
- `ratings`, `reviewCount`
- `status`: `draft`, `published`, `archived`
- `format`: `hardcover`, `paperback`, `ebook`, `audiobook`
- `royaltyPercentage`, default `0`

Catalog flow:

```text
Frontend catalog page
-> GET /api/books?category=...&sort=...
-> GET /api/categories
-> GET /api/books/{slug}
-> GET /api/books/{slug}/related
```

Next-level recommendation:

- Add personalized recommendations.
- Add advanced faceted search.
- Add Elasticsearch/Meilisearch if catalog grows large.

---

## 4.5 Customer Account APIs

Purpose:

- Let logged-in users view their profile, orders, payments, invoices, shipments, notifications, wishlist, and library.

APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/api/users/me` | Bearer | Current user profile hydration. |
| GET | `/api/users/{id}/stats` | Bearer | Dashboard stats. |
| PUT | `/api/users/{id}` | Bearer | Update profile. |
| GET | `/api/users/me/author-application` | Bearer | Check author application status. |
| GET | `/api/users/{id}/payments` | Bearer | User payment attempts. |
| GET | `/api/users/{id}/payments/{paymentId}` | Bearer | User payment detail. |
| GET | `/api/users/{id}/orders/{orderId}/payments` | Bearer | Payment attempts for one order. |
| GET | `/api/users/{id}/invoices` | Bearer | User invoices. |
| GET | `/api/users/{id}/invoices/{invoiceId}` | Bearer | Invoice detail. |
| GET | `/api/users/{id}/invoices/{invoiceId}/download` | Bearer | Download invoice PDF. |
| GET | `/api/users/{id}/shipments` | Bearer | User shipments. |
| GET | `/api/users/{id}/shipments/{shipmentId}` | Bearer | Shipment detail. |
| GET | `/api/users/{id}/notifications` | Bearer | User notifications. |
| GET | `/api/users/{id}/notifications/{notificationId}` | Bearer | Notification detail. |
| PATCH | `/api/users/{id}/notifications/{notificationId}/read` | Bearer | Mark notification read. |
| PATCH | `/api/users/{id}/notifications/read-all` | Bearer | Mark all notifications read. |
| DELETE | `/api/users/{id}/notifications/{notificationId}` | Bearer | Archive notification. |
| GET | `/api/users/{id}/wishlist` | Bearer | Wishlist. |
| POST | `/api/users/{id}/wishlist` | Bearer | Add wishlist item. |
| DELETE | `/api/users/{id}/wishlist/{bookId}` | Bearer | Remove wishlist item. |
| GET | `/api/users/{id}/library` | Bearer | Customer library. |

Frontend note:

- Most user endpoints support `me` as the user id where ownership allows it.
- `GET /api/users/me` exists for simple logged-in user hydration.

---

## 4.6 Publishing And Author Applications

Purpose:

- Allow readers/users to apply to become authors.
- Allow authors/admins to submit publishing requests.
- Allow admins to review applications and manuscript requests.

Public/user APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| POST | `/api/author-applications` | Bearer | Submit author application. |
| GET | `/api/users/me/author-application` | Bearer | Check current application. |
| POST | `/api/publish-requests` | Author/Admin | Submit manuscript/publishing request. |
| GET | `/api/publish-packages` | Public | List publishing packages. |

Admin APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/author-applications` | Admin | List applications. |
| PUT | `/api/admin/author-applications/{id}/status` | Admin | Approve/reject application. |
| GET | `/api/admin/publish-requests` | Admin | List publishing requests. |
| PUT | `/api/admin/publish-requests/{id}/status` | Admin | Update manuscript status. |

Author application flow:

```text
Reader clicks Become Author
-> GET /api/users/me/author-application
-> If 404, show form
-> POST /api/author-applications
-> Admin reviews
-> PUT /api/admin/author-applications/{id}/status
-> If approved, backend promotes user role to author
```

Next-level recommendation:

- Add manuscript versioning.
- Add editorial workflow stages.
- Add contracts and royalty agreement acceptance.

---

## 4.7 Checkout, Payment, Inventory, Invoice, Shipment Flow

This is the most important business flow.

Current checkout is manual UPI based, not Razorpay/Cashfree/PhonePe yet.

Main flow:

```text
Customer selects books
-> POST /api/orders
-> Order created
-> Payment intent created
-> Inventory reserved
-> Dynamic UPI QR generated
-> Customer pays manually
-> Customer submits UTR
-> Payment goes to verification pending
-> Admin approves/rejects payment
-> If approved: payment verified, inventory deducted, invoice generated, shipment created, notifications created, analytics updated
-> If rejected/expired/cancelled: inventory reservation released
```

Customer order APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Bearer | Create order, payment intent, inventory reservation, QR data. |
| PUT | `/api/orders/{id}/verify-payment` | Bearer | Submit UTR/payment reference. |
| DELETE | `/api/orders/{id}` | Bearer | Cancel order. |
| GET | `/api/orders/{id}/shipment` | Bearer | Get shipment for order. |
| GET | `/api/orders/{id}/tracking` | Bearer | Get tracking for order. |
| GET | `/api/orders/track/{orderNumber}` | Public | Track by order number. |

Payment engine capabilities:

- Provider-agnostic Payment model.
- Manual UPI payment support.
- UTR submission and validation.
- Admin verification workflow.
- Status transition enforcement.
- Payment ledger as immutable audit history.
- Future-ready fields for gateway order id, payment id, signature, refunds, webhooks.

Payment status lifecycle:

```text
INTENT_CREATED
-> QR_GENERATED
-> PAYMENT_PENDING
-> PAYMENT_SUBMITTED
-> VERIFICATION_PENDING
-> PAYMENT_VERIFIED
```

Failure paths:

```text
PAYMENT_PENDING -> PAYMENT_FAILED
PAYMENT_PENDING -> PAYMENT_EXPIRED
VERIFICATION_PENDING -> PAYMENT_REJECTED
VERIFICATION_PENDING -> PAYMENT_FAILED
```

Inventory lifecycle:

```text
Checkout
-> Reserve inventory
-> Payment verified
-> Deduct stock
```

Release paths:

```text
Payment expired/rejected/cancelled
-> Release reservation
```

Invoice lifecycle:

```text
PaymentVerified event
-> InvoiceService generates invoice
-> InvoiceGenerated event
-> PDF available for download
```

Shipment lifecycle:

```text
InvoiceGenerated event
-> ShipmentService creates shipment
-> ShipmentCreated event
-> Admin assigns courier/status
-> Customer tracks shipment
```

Next-level recommendation:

- Integrate real payment gateway provider adapter.
- Add webhook verification.
- Add refund APIs.
- Add courier provider integrations.
- Add customer-facing payment status polling endpoint if frontend needs a simple one.

---

## 4.8 Admin Operations Backend

Purpose:

- Provide production admin backend APIs for managing platform operations.
- Admin controllers orchestrate only; services own business rules.

Core admin APIs:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/analytics` | Legacy/global admin analytics summary. |
| GET | `/api/admin/stats` | Alias for global admin stats. |
| GET | `/api/admin/orders` | List orders. |
| PUT | `/api/admin/orders/{id}/status` | Update order status. Accepts `Processing`, `Shipped`, `Delivered`, `Cancelled` and stores uppercase enums. |
| POST | `/api/admin/books` | Create book. Supports `royaltyPercentage`. |
| PUT | `/api/admin/books/{id}` | Update book. Supports `royaltyPercentage`. |
| DELETE | `/api/admin/books/{id}` | Delete book. |
| GET | `/api/admin/reviews` | Review moderation queue. |
| PATCH | `/api/admin/reviews/{id}/status` | Moderate review. |
| DELETE | `/api/admin/reviews/{id}` | Delete review. |

Admin users:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/users` | List users with pagination/filter/search. |
| GET | `/api/admin/users/{id}` | Get user detail. |
| PUT | `/api/admin/users/{id}` | Combined partial update for frontend compatibility. |
| PATCH | `/api/admin/users/{id}/role` | Update role. |
| PUT | `/api/admin/users/{id}/role` | Role alias. |
| PATCH | `/api/admin/users/{id}/status` | Update active status. |
| POST | `/api/admin/users/{id}/reset-password` | Reset user password. |

Compatibility mapping:

```text
role: user -> reader
status: Active -> isActive=true
status: Suspended -> isActive=false
```

Admin categories:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/categories` | List categories. |
| GET | `/api/admin/categories/{id}` | Category detail. |
| POST | `/api/admin/categories` | Create category. |
| PUT | `/api/admin/categories/{id}` | Update category. |
| PATCH | `/api/admin/categories/{id}/status` | Activate/deactivate category. |
| DELETE | `/api/admin/categories/{id}` | Soft delete category. |

Admin operations:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/operations/dashboard` | Operations dashboard summary. |
| GET | `/api/admin/operations/search` | Global operations search. |
| GET | `/api/admin/operations/payments` | Payment queue/history. |
| GET | `/api/admin/operations/payments/{id}` | Complete payment detail. |
| POST | `/api/admin/operations/payments/{id}/approve` | Approve manual payment. |
| POST | `/api/admin/operations/payments/{id}/reject` | Reject manual payment. |
| POST | `/api/admin/operations/payments/{id}/cancel` | Cancel payment intent. |
| POST | `/api/admin/operations/payments/{id}/expire` | Expire payment. |
| POST | `/api/admin/operations/payments/{id}/retry-verification` | Retry verification. |
| POST | `/api/admin/operations/payments/{id}/recreate-qr` | Recreate QR. |
| GET | `/api/admin/operations/inventory/reservations` | Inventory reservation list. |
| GET | `/api/admin/operations/inventory/low-stock` | Low-stock books. |
| GET | `/api/admin/operations/ledger/payments` | Payment ledger. |
| GET | `/api/admin/operations/ledger/inventory` | Inventory ledger. |
| GET | `/api/admin/operations/ledger/timeline` | Combined payment/inventory timeline. |

Admin invoices:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/invoices/search` | Search invoices. |
| GET | `/api/admin/invoices` | List invoices. |
| GET | `/api/admin/invoices/{id}` | Invoice detail. |
| GET | `/api/admin/invoices/{id}/download` | Download invoice PDF. |

Admin shipments:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/shipments/search` | Search shipments. |
| GET | `/api/admin/shipments` | List shipments. |
| GET | `/api/admin/shipments/{id}` | Shipment detail. |
| GET | `/api/admin/shipments/{id}/tracking` | Tracking history. |
| POST | `/api/admin/shipments/{id}/assign-courier` | Assign courier info. |
| POST | `/api/admin/shipments/{id}/update-status` | Update shipment status. |
| POST | `/api/admin/shipments/{id}/cancel` | Cancel shipment. |

Admin notifications:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/notifications/search` | Search notifications. |
| GET | `/api/admin/notifications` | List notifications. |
| GET | `/api/admin/notifications/{id}` | Notification detail. |
| POST | `/api/admin/notifications/{id}/retry` | Retry failed notification. |

Admin analytics:

| Method | API | Purpose |
|---|---|---|
| GET | `/api/admin/analytics/dashboard` | Dashboard metrics. |
| GET | `/api/admin/analytics/revenue` | Revenue report. |
| GET | `/api/admin/analytics/books` | Book sales report. |
| GET | `/api/admin/analytics/payments` | Payment metrics. |
| GET | `/api/admin/analytics/inventory` | Inventory metrics. |
| GET | `/api/admin/analytics/shipments` | Shipment metrics. |
| GET | `/api/admin/analytics/customers` | Customer metrics. |

---

## 4.9 Uploads

Purpose:

- Upload images and documents through Cloudinary configuration.
- Used for covers, manuscripts, assets, and future admin uploads.

APIs:

| Method | API | Auth | Purpose |
|---|---|---|---|
| POST | `/api/uploads/image` | Bearer | Upload image. |
| POST | `/api/uploads/document` | Bearer | Upload document. |

Supported image types:

- jpg/jpeg
- png
- webp
- gif

Supported document types:

- pdf
- doc
- docx

Production note:

- Requires Cloudinary env vars.
- Upload endpoints gracefully fail if Cloudinary is not configured.

---

## 5. Event-Driven Capabilities

The backend uses an internal event bus and subscribers.

Important events:

- `PaymentIntentCreated`
- `QRCodeGenerated`
- `PaymentSubmitted`
- `PaymentVerified`
- `PaymentRejected`
- `PaymentExpired`
- `OrderCreated`
- `OrderCancelled`
- `InventoryReserved`
- `InventoryReleased`
- `InventoryDeducted`
- `LedgerCreated`
- `InvoiceGenerated`
- `ShipmentCreated`
- `NotificationSent`

Major subscribers:

| Subscriber | Trigger | Result |
|---|---|---|
| Invoice subscriber | `PaymentVerified` | Generates invoice. |
| Shipment subscriber | `InvoiceGenerated` | Creates shipment. |
| Notification subscriber | Payment/invoice/order/inventory events | Creates async notifications. |
| Analytics subscriber | Business events | Updates analytics projections. |
| Placeholder consumers | Future modules | Logs future notification/invoice/shipping/analytics/audit hooks. |

Event chain after payment approval:

```text
Admin approves payment
-> PaymentService marks payment verified
-> PaymentLedger entry is created
-> PaymentVerified event published
-> InvoiceSubscriber generates invoice
-> InvoiceGenerated event published
-> ShipmentSubscriber creates shipment
-> ShipmentCreated event published
-> NotificationSubscriber creates notifications
-> AnalyticsSubscriber updates reporting data
```

Next-level recommendation:

- Move process-local queue/event bus to Redis, RabbitMQ, Kafka, or SQS before horizontal scaling.
- Add event replay tooling.
- Add idempotency dashboard and dead-letter queue visibility.

---

## 6. Data Models Present

Main models:

- `User`
- `AuthSession`
- `Book`
- `Category`
- `Content`
- `AuthorApplication`
- `PublishPackage`
- `PublishRequest`
- `Order`
- `Payment`
- `PaymentLedger`
- `InventoryReservation`
- `InventoryLedger`
- `Invoice`
- `Shipment`
- `ShipmentLedger`
- `Notification`
- `AnalyticsEvent`
- `Review`
- `Counter`

Important design choices:

- Order keeps legacy payment fields for frontend backward compatibility.
- Payment is the source of truth for payment lifecycle.
- PaymentLedger is append-only financial audit history.
- InventoryReservation prevents overselling before payment verification.
- InventoryLedger is append-only inventory audit history.
- Invoice is generated after verified payment.
- Shipment is created from invoice/payment flow.
- Content is a singleton global CMS document.

---

## 7. Frontend Integration Structure

Recommended frontend pages and APIs:

| Frontend Page | APIs |
|---|---|
| Home | `GET /api/content`, `GET /api/books?featured=true`, `GET /api/categories` |
| Books listing | `GET /api/books`, `GET /api/categories`, `GET /api/search?q=` |
| Book detail | `GET /api/books/{slug}`, `GET /api/books/{slug}/related`, review APIs |
| Login/Register | `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout` |
| User dashboard | `GET /api/users/me`, `GET /api/users/me/stats`, orders/payments/invoices/shipments/notifications APIs |
| Become author | `GET /api/users/me/author-application`, `POST /api/author-applications` |
| Publish page | `GET /api/content`, `GET /api/publish-packages`, `POST /api/publish-requests` |
| Checkout | `POST /api/orders`, `PUT /api/orders/{id}/verify-payment` |
| Track order | `GET /api/orders/track/{orderNumber}` |
| Admin dashboard | `GET /api/admin/operations/dashboard`, `GET /api/admin/analytics/dashboard` |
| Admin CMS | `GET /api/content`, `PUT /api/admin/content` |
| Admin users | `GET /api/admin/users`, `PUT /api/admin/users/{id}` |
| Admin books | `POST /api/admin/books`, `PUT /api/admin/books/{id}`, `DELETE /api/admin/books/{id}` |
| Admin payments | `/api/admin/operations/payments*` |
| Admin inventory | `/api/admin/operations/inventory*` |
| Admin invoices | `/api/admin/invoices*` |
| Admin shipments | `/api/admin/shipments*` |
| Admin notifications | `/api/admin/notifications*` |
| Admin analytics | `/api/admin/analytics/*` |

Base URL for frontend:

```text
Production API base: https://harglimpublish-backend.onrender.com/api
```

Example:

```js
const API_BASE_URL = 'https://harglimpublish-backend.onrender.com/api';
const res = await fetch(`${API_BASE_URL}/content`);
```

Auth header:

```text
Authorization: Bearer <jwt-token>
```

---

## 8. Production Configuration And Runtime

Important scripts:

| Command | Purpose |
|---|---|
| `npm start` | Start production server. |
| `npm run dev` | Start dev server with Node watch mode. |
| `npm test` | Run Jest tests. |
| `npm run lint` | Run ESLint. |
| `npm run seed:dummy` | Seed demo data. |
| `npm run seed:dummy:dry-run` | Preview demo seed without writing. |

Important production env groups:

- Application/server: `NODE_ENV`, `PORT`, request limits.
- Database: `MONGODB_URI`.
- JWT: `JWT_SECRET`, expiry/session settings.
- Payment QR: merchant UPI details.
- Cloudinary: upload provider config.
- Email: Resend/email provider config if enabled.
- Swagger/frontend: deployment/frontend URLs.
- Security/logging: CORS, rate limit, log settings.

Documentation files:

| File | Purpose |
|---|---|
| `README.md` | Project overview. |
| `API_DOCUMENTATION.md` | Main API documentation. |
| `docs/frontend-api-guide.md` | Frontend integration guide. |
| `docs/adminapis.md` | Admin API handoff guide. |
| `docs/openapi.json` | OpenAPI JSON. |
| `docs/openapi.yaml` | OpenAPI YAML. |
| `docs/postman_collection.json` | Postman collection. |
| `docs/environment.md` | Environment variable guide. |
| `docs/architecture.md` | Architecture guide. |

---

## 9. Current Known Limitations

These are not failures. They are next-level growth points.

| Area | Current State | Next Level |
|---|---|---|
| Payment gateway | Manual UPI QR + admin verification | Razorpay/Cashfree/PhonePe provider adapters and webhooks. |
| Queue/event bus | Process-local infrastructure | Redis/RabbitMQ/SQS/Kafka for multi-instance deployments. |
| Shipping | Manual/provider-agnostic foundation | Real courier integrations, label generation, webhook tracking. |
| Royalty | Book has `royaltyPercentage`, author royalty APIs exist as foundation | Full royalty ledger, payout workflow, tax documents. |
| Analytics | Admin reporting and async projections | Executive BI dashboard, cohort reports, export jobs. |
| CMS | Global singleton text CMS | Versioning, drafts, preview, media blocks. |
| Search | Mongo query/text search foundation | Dedicated search engine for large catalog. |
| Admin UI | Backend APIs only | Build full admin panel frontend. |
| Multi-warehouse | Inventory is future-ready | Warehouse/location-specific stock and reservations. |
| Notifications | Email/stub/adapters and async model | Real SMS/WhatsApp/push integrations and templates. |

---

## 10. Recommended Next-Level Roadmap

## Phase A - Production Launch Hardening

Priority: Critical

- Run full regression suite before final release.
- Confirm Render/Railway production env vars.
- Verify Mongo indexes in production.
- Confirm Cloudinary upload config.
- Confirm UPI merchant config.
- Confirm CORS frontend URL.
- Confirm admin JWT and role protection.
- Confirm Swagger server URL uses deployment host.

## Phase B - Frontend Completion Support

Priority: Critical

- Lock final frontend API contracts.
- Share `API_DOCUMENTATION.md`, `docs/frontend-api-guide.md`, and `docs/adminapis.md` with frontend developer.
- Test all frontend pages against deployed backend.
- Add any tiny compatibility aliases only if frontend truly needs them.

## Phase C - Real Payment Gateway

Priority: High

- Add provider adapter interface.
- Implement Razorpay or Cashfree first.
- Add webhook signature verification.
- Add gateway order/payment id storage.
- Add refund lifecycle.
- Keep manual UPI as fallback.

## Phase D - Royalty System

Priority: High

- Royalty ledger.
- Author earnings dashboard.
- Royalty calculation after invoice/payment completion.
- Payout requests.
- Admin payout approval.
- Exportable royalty statements.

## Phase E - Shipping Integrations

Priority: Medium

- Courier provider adapter.
- Shipping labels.
- Tracking webhooks.
- Delivery proof.
- Return/cancel shipment flows.

## Phase F - Analytics And BI

Priority: Medium

- Export CSV endpoints.
- Scheduled report generation.
- Executive dashboard APIs.
- Customer cohort analytics.
- Product conversion tracking.

## Phase G - Platform Scale

Priority: Medium

- Redis-backed queue.
- Distributed workers.
- Idempotent event replay.
- Read replicas/caching.
- Observability dashboard.
- Load tests.

---

## 11. Suggested System Flow Diagram

```text
Public Frontend
  |-> GET /api/content
  |-> GET /api/books
  |-> GET /api/categories
  |-> POST /api/auth/login
  |-> POST /api/orders
  |-> PUT /api/orders/{id}/verify-payment

Admin Frontend
  |-> GET /api/admin/operations/dashboard
  |-> GET /api/admin/operations/payments
  |-> POST /api/admin/operations/payments/{id}/approve
  |-> PUT /api/admin/content
  |-> POST /api/admin/books
  |-> PUT /api/admin/users/{id}

Backend Core
  |-> AuthService
  |-> CatalogService
  |-> OrderPaymentBridgeService
  |-> PaymentService
  |-> InventoryService
  |-> InvoiceService
  |-> ShipmentService
  |-> NotificationService
  |-> AnalyticsService

Async Events
  |-> PaymentVerified
  |-> InvoiceGenerated
  |-> ShipmentCreated
  |-> NotificationSent
  |-> AnalyticsUpdated
```

---

## 12. Final Project Rating

Current backend stage: Production Candidate / Release Candidate.

Overall rating: 8.5 / 10.

Strengths:

- Strong module coverage.
- Clean architecture in core business modules.
- Payment and inventory foundations are enterprise-grade.
- Admin APIs are broad and usable.
- Documentation is strong.
- Frontend compatibility gaps have been addressed.

Remaining gap to become 9.5 / 10:

- Add real payment gateway and webhook flow.
- Move event queue to Redis/RabbitMQ/SQS for multi-instance deployment.
- Finish royalty ledger/payout engine.
- Add real shipping provider integration.
- Complete end-to-end production smoke testing against deployed frontend.

Recommended immediate action:

```text
1. Push backend code.
2. Deploy backend.
3. Send API docs to frontend developer.
4. Run frontend integration testing.
5. Fix only contract mismatches.
6. Start payment gateway sprint.
```