# HM Backend - Frontend Integration Handover

**Backend:** `https://harglimpublish-backend.onrender.com`  
**API base:** `https://harglimpublish-backend.onrender.com/api`  
**Swagger:** `https://harglimpublish-backend.onrender.com/api/docs`  
**OpenAPI JSON:** `https://harglimpublish-backend.onrender.com/api/docs.json`  
**Health:** `https://harglimpublish-backend.onrender.com/health`

This document describes the frontend contracts verified in the current backend, with special focus on author publishing, author dashboard data, publish packages, author invitations, spotlights, CMS content, and uploads. Swagger remains the exhaustive contract for every backend route.

## 1. Common Integration Rules

### Authentication

Protected requests require the access token returned by login:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

Login:

```http
POST /api/auth/login
```

```json
{
  "email": "author@example.com",
  "password": "password123"
}
```

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "USER_OBJECT_ID",
      "name": "Author Name",
      "email": "author@example.com",
      "role": "author"
    },
    "token": "JWT_ACCESS_TOKEN",
    "refreshToken": "ROTATING_REFRESH_TOKEN",
    "refreshTokenExpiresAt": "2026-12-01T00:00:00.000Z"
  }
}
```

Use `data.token` for all protected calls. Use `POST /api/auth/refresh` with `{ "refreshToken": "..." }` when the access token expires. Do not send a role during public registration; every public registration is created as `reader`.

### Current user and navigation source

After login, call:

```http
GET /api/users/me/context
```

This is the canonical source for role, capabilities, feature flags, and navigation decisions. Also available:

- `GET /api/users/me` - current profile
- `GET /api/auth/me` - authentication profile alias
- `PUT|PATCH /api/users/me` - update current profile

Do not infer author dashboard access only from `role`. Use the context capabilities and `features.paidAuthorDashboardAccess`.

### Standard success envelopes

Single resource:

```json
{ "success": true, "data": {} }
```

Paginated list:

```json
{
  "success": true,
  "data": [],
  "pagination": { "total": 0, "page": 1, "limit": 20, "pages": 0 }
}
```

### Standard errors

Most service errors use:

```json
{ "success": false, "message": "Human-readable message" }
```

Some authorization and domain errors also include `error`:

```json
{
  "success": false,
  "error": "AUTHOR_DASHBOARD_ACCESS_REQUIRED",
  "message": "Author dashboard operational access required. Please purchase or request access entitlement."
}
```

Frontend handling:

| Status | Meaning | Frontend action |
| --- | --- | --- |
| `200/201` | Success | Read `data`; do not require only `200` |
| `304` | Browser cache revalidation | Not an API failure; browser uses cached response |
| `400` | Invalid payload/state | Show backend `message` near the form/action |
| `401` | Missing/expired/invalid token | Refresh once, then sign out if refresh fails |
| `403` | Role, ownership, or entitlement denied | Hide forbidden action and show access message |
| `404` | Resource or route not found | Show not-found state; verify ID type/path |
| `409` | State conflict/duplicate/disabled feature | Refresh data and show backend message |
| `413` | Uploaded file too large | Ask the user to select a smaller file |
| `429` | Rate limited | Retry after the rate-limit window |
| `503` | Upload provider not configured | Disable upload and show temporary service message |
| `504` | Upload/provider timeout | Allow retry with a smaller file |

The backend includes `X-Request-Id` on requests. Capture it in frontend error telemetry/support reports.

## 2. Author Dashboard Access Feature Flag

The deployment controls paid access with:

```env
AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED=false
```

When `false`:

- Approved authors can use dashboard, analytics, royalties, performance, and settlement read screens without purchasing access.
- No fake entitlement record is needed.
- `POST /api/authors/me/dashboard-access/purchase` intentionally returns `409` with `AUTHOR_DASHBOARD_PAID_ACCESS_DISABLED`.
- The frontend must hide plan purchase, QR, and UTR controls.

Read status:

```http
GET /api/authors/me/dashboard-access
```

Example while paid access is disabled:

```json
{
  "success": true,
  "data": {
    "author": true,
    "dashboardAccess": {
      "status": "APPROVED_AUTHOR_NO_PLAN",
      "hasAccess": true
    },
    "plan": null,
    "features": {
      "paidAuthorDashboardAccess": false
    }
  }
}
```

Frontend rule:

```text
if features.paidAuthorDashboardAccess === false:
  show author workspace and dashboard
  hide all dashboard purchase/payment UI
else:
  follow dashboardAccess.hasAccess/status
```

Possible access errors when paid access is enabled:

- `403 AUTHOR_ROLE_REQUIRED`
- `403 AUTHOR_DASHBOARD_ACCESS_REQUIRED`
- `403 AUTHOR_DASHBOARD_ACCESS_DENIED`
- `409 AUTHOR_DASHBOARD_PAID_ACCESS_DISABLED` from purchase when disabled

## 3. Author Book Workflow

Author book management is free publishing functionality. It does not require a paid-dashboard entitlement, but it does require an authenticated `author` account.

### List the author's books

```http
GET /api/authors/me/books?page=1&limit=20
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "BOOK_OBJECT_ID",
      "title": "Enterprise Publishing Systems",
      "slug": "enterprise-publishing-systems",
      "description": "A practical publishing book.",
      "author": { "_id": "AUTHOR_ID", "name": "Author Name" },
      "category": { "_id": "CATEGORY_ID", "name": "Publishing" },
      "mrp": 499,
      "price": 499,
      "royaltyPercentage": 10,
      "royaltyPerCopy": 319,
      "status": "draft",
      "publishingStatus": "DRAFT",
      "latestPublishRequest": null
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
}
```

Important:

- Every book assigned to the authenticated author is returned, including admin-created books and books with zero sales.
- `mrp` is canonical. `price` is a synchronized legacy compatibility field.
- `royaltyPerCopy` is current estimated per-copy royalty when charge configuration exists; otherwise it can be `null`.
- Responses under `/api/authors/me/*` send `Cache-Control: no-store`; the browser should not display stale dashboard data.

### Get one author-owned book

```http
GET /api/authors/me/books/:bookId
```

```json
{
  "success": true,
  "data": {
    "book": {},
    "publishingStatus": "DRAFT",
    "latestPublishRequest": null
  }
}
```

Errors:

- `404 Book not found or access denied: <bookId>` for missing or another author's book.

### Create a draft

```http
POST /api/authors/me/books
```

```json
{
  "title": "Enterprise Publishing Systems",
  "description": "A practical book about publishing operations.",
  "category": "CATEGORY_OBJECT_ID",
  "mrp": 499,
  "format": "paperback",
  "coverImage": "https://res.cloudinary.com/.../cover.jpg",
  "isbn": "9781234567890",
  "pages": 320
}
```

Allowed author fields:

- `title`, `description`, `category`, `format`, `coverImage`
- `mrp` or legacy `price`
- `isbn`, `pages`

Server-owned fields authors must not send:

- `author`, `slug`, `status`, `royaltyPercentage`
- `stock`, `reservedStock`, `ratings`, `reviewCount`
- `isBestseller`, `isFeatured`, `isNewRelease`, `discountPrice`

Response: `201`

```json
{
  "success": true,
  "data": {
    "book": {
      "_id": "BOOK_OBJECT_ID",
      "title": "Enterprise Publishing Systems",
      "slug": "enterprise-publishing-systems",
      "mrp": 499,
      "price": 499,
      "status": "draft"
    }
  }
}
```

The backend generates a unique slug. The frontend must not generate or send one.

Common create errors:

- `403 Must be an approved author to create books`
- `400 Book title is required`
- `400 Book description is required`
- `400 Book category is required`
- `400 Invalid category ID: <id>`
- `400 MRP and legacy price must match`
- `400 Field '<field>' is admin-only and cannot be set by author`

### Update a draft

```http
PUT /api/authors/me/books/:bookId
```

Send only changed allowed fields. Existing slug remains stable when the title changes.

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "mrp": 599
}
```

Response: `200 { "success": true, "data": { "book": {} } }`

State errors:

- `409 Published books cannot be directly modified by authors`
- `409 Book is currently under review (...) and locked for editing`

### Delete a draft

```http
DELETE /api/authors/me/books/:bookId
```

```json
{
  "success": true,
  "data": { "success": true, "message": "Book draft deleted" }
}
```

Errors:

- `409 Published books cannot be deleted`
- `409 Cannot delete a book that is currently under editorial review`

### Upload manuscript and cover

```http
POST /api/authors/me/uploads/document
Content-Type: multipart/form-data
field: document
```

Allowed documents: PDF, DOC, DOCX.

```http
POST /api/authors/me/uploads/image
Content-Type: multipart/form-data
field: image
```

Allowed images: JPG/JPEG, PNG, WebP, GIF. The deployment upload limit defaults to 25 MB unless configured differently.

Success:

```json
{ "success": true, "data": { "url": "https://res.cloudinary.com/..." } }
```

Send exactly one file and exactly one field. Never send both `image` and `coverImage` in the same multipart request; that produces `400 Too many files`. Upload first, then place `data.url` in the book JSON payload.

### List selectable packages

```http
GET /api/publish-packages
```

This is public and returns only active packages:

```json
{
  "success": true,
  "data": [
    {
      "_id": "PACKAGE_OBJECT_ID",
      "name": "Professional",
      "description": "Editorial and publishing package",
      "price": 9999,
      "features": ["Editing", "Cover design"],
      "tagline": "Most popular",
      "highlighted": true,
      "badge": "Recommended",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

### Submit a draft for editorial review

```http
POST /api/authors/me/books/:bookId/submit
```

```json
{
  "packageId": "ACTIVE_PACKAGE_OBJECT_ID",
  "fileUrl": "https://res.cloudinary.com/.../manuscript.pdf",
  "genre": "Business",
  "wordCount": 55000
}
```

`fileUrl` may also be supplied as `manuscriptUrl` or `documentUrl`, but new frontend code should use `fileUrl`. `genre` and `wordCount` have server fallbacks; `packageId` and a manuscript URL are mandatory.

Response: `201`

```json
{
  "success": true,
  "data": {
    "book": {},
    "publishRequest": {
      "_id": "PUBLISH_REQUEST_ID",
      "book": "BOOK_OBJECT_ID",
      "packageId": "PACKAGE_OBJECT_ID",
      "status": "PENDING",
      "fileUrl": "https://res.cloudinary.com/.../manuscript.pdf"
    }
  }
}
```

Submission errors:

- `400 Manuscript file URL (fileUrl) is required for publishing submission`
- `400 packageId is required`
- `400 packageId is invalid`
- `400 Publishing package was not found or is inactive`
- `409 Book has an active review submission in state: ...`
- `409 Book is already published`

## 4. Author Dashboard and Royalty APIs

All endpoints below require an author token. When paid access is disabled, no entitlement purchase is required.

### Dashboard summary

```http
GET /api/authors/me/dashboard
```

Key response structure:

```json
{
  "success": true,
  "data": {
    "books": { "total": 6, "published": 1, "draft": 5 },
    "sales": { "unitsSold": 10, "grossBookRevenue": 4990 },
    "royalties": {
      "accruedKnown": 3190,
      "accrued": 3190,
      "eligibleUnsettled": 3190,
      "settledPendingPayment": 0,
      "paidLifetime": 0,
      "currency": "INR",
      "dataStatus": "COMPLETE",
      "unresolvedLegacySales": 0
    },
    "topBooks": [],
    "recentSales": []
  }
}
```

`topBooks` includes all assigned books, including zero-sale books. Never calculate dashboard totals in the browser from only the first page of books.

### Analytics series

```http
GET /api/authors/me/analytics?range=30d
GET /api/authors/me/analytics?from=2026-01-01&to=2026-03-31
```

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T00:00:00.000Z",
    "series": [
      { "date": "2026-01-15", "units": 2, "revenue": 998, "knownRoyalty": 638, "unresolvedLegacyCount": 0 }
    ]
  }
}
```

Custom ranges greater than 365 days return `400 Custom date range cannot exceed 365 days`.

### Book performance

```http
GET /api/authors/me/books/performance
```

Each entry includes `bookId`, `title`, `coverImage`, `status`, `unitsSold`, `grossBookRevenue`, `knownAccruedRoyalty`, `unresolvedLegacySales`, `currentRoyaltyPercentage`, and `royaltyPerCopy`.

### Royalty history

```http
GET /api/authors/me/royalties?page=1&limit=10&bookId=<optional>&from=<optional>&to=<optional>
```

```json
{
  "success": true,
  "data": {
    "balance": 638,
    "accruedKnown": 638,
    "accruedTotal": 638,
    "currency": "INR",
    "dataStatus": "COMPLETE",
    "unresolvedLegacySales": 0,
    "history": [
      {
        "orderNumber": "HM-12345678",
        "bookId": "BOOK_OBJECT_ID",
        "bookTitle": "Enterprise Publishing Systems",
        "quantity": 2,
        "unitPrice": 499,
        "grossBookRevenue": 998,
        "royaltyPercentageSnapshot": null,
        "royaltyPerCopy": 319,
        "royaltyPerCopySnapshot": 319,
        "royaltyAmount": 638,
        "royaltyStatus": "CALCULATED",
        "status": "ACCRUED"
      }
    ],
    "pagination": { "total": 1, "page": 1, "pages": 1, "limit": 10 }
  }
}
```

Use snapshot fields for historical display. Do not recompute old royalties using the book's current values. If `royaltyStatus` is `HISTORICAL_RATE_UNAVAILABLE`, display an unavailable/pending-review state instead of `₹0`.

Additional reads:

- `GET /api/authors/me/royalty-settlements`
- `GET /api/authors/me/royalty-settlements/:id`
- `GET /api/authors/me/manual-royalties`
- `GET /api/authors/me/payment-details`

## 5. Spotlight Module

### Public list

```http
GET /api/spotlights?page=1&limit=6
```

No authentication required. Only active spotlights are returned, ordered by `sortOrder` and creation date.

```json
{
  "success": true,
  "data": [
    {
      "_id": "SPOTLIGHT_ID",
      "image": "https://res.cloudinary.com/.../spotlight.jpg",
      "thumbnail": "https://res.cloudinary.com/.../w_400,h_400/spotlight.jpg",
      "author_name": "Featured Author",
      "caption": "Launch day",
      "author": { "_id": "AUTHOR_ID", "name": "Featured Author" },
      "isActive": true,
      "sortOrder": 1
    }
  ],
  "pagination": { "page": 1, "limit": 6, "total": 1, "pages": 1 }
}
```

Limits: default `24`, maximum `60`.

### Admin list

```http
GET /api/admin/spotlights?page=1&limit=20&isActive=true&search=author
```

Admin bearer token required. `q` is accepted as a search alias.

### Admin create

```http
POST /api/admin/spotlights
Content-Type: multipart/form-data
```

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `image` | Yes | One JPG/JPEG, PNG, or WebP; maximum 10 MB |
| `author_name` | Yes | Maximum 120 characters |
| `caption` | No | Maximum 500 characters |
| `authorId` | No | Existing active author Mongo ID |
| `sortOrder` | No | Finite number |
| `isActive` | No | `true`/`false`; defaults true |

Success: `201 { "success": true, "data": { ...spotlight } }`.

### Admin update

```http
PATCH /api/admin/spotlights/:id
Content-Type: multipart/form-data
```

Send only changed fields. A replacement `image` is optional. The old Cloudinary image is removed after a successful replacement.

### Admin archive

```http
DELETE /api/admin/spotlights/:id
```

This is a soft delete: it sets `isActive=false`, so the public list stops returning it.

Spotlight errors:

- `400 image is required`
- `400 author_name is required`
- `400 author_name must not exceed 120 characters`
- `400 caption must not exceed 500 characters`
- `400 sortOrder must be a finite number`
- `400 isActive must be true or false`
- `400 authorId is invalid`
- `404 Linked author was not found or is inactive`
- `404 Spotlight not found`
- `400 Spotlight image must be a JPG, PNG, or WebP file`
- `413 Uploaded file is too large`

## 6. Admin Author Invitation

### Create/invite an author

```http
POST /api/admin/users
```

Passwordless author invitation:

```json
{
  "name": "Invited Author",
  "email": "author@example.com",
  "role": "author",
  "isActive": true
}
```

Response: `201`

```json
{
  "success": true,
  "data": {
    "_id": "USER_OBJECT_ID",
    "name": "Invited Author",
    "email": "author@example.com",
    "role": "author",
    "isActive": true,
    "invited": true,
    "emailSent": true
  }
}
```

The backend creates a single-use password setup token valid for seven days and sends a frontend reset/set-password link. The token is stored hashed. `emailSent=false` means the user exists but email delivery failed or was unavailable; the admin UI should offer Resend Invite.

When `AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED=true`, creating an invited author also grants dashboard entitlement. When it is `false`, entitlement is unnecessary because approved authors already have dashboard access.

For non-invite user creation, include a password of at least six characters. Frontend role `user` is normalized to backend role `reader`.

Errors:

- `400 Name is required`
- `400 Email is required`
- `400 Please add a valid email`
- `400 Password must be at least 6 characters`
- `400 Invalid user role`
- `400 Invalid user status`
- `409 User with this email already exists`

### Resend invitation

```http
POST /api/admin/users/:id/resend-invite
```

No body required.

```json
{
  "success": true,
  "data": {
    "_id": "USER_OBJECT_ID",
    "name": "Invited Author",
    "email": "author@example.com",
    "role": "author",
    "invited": true,
    "emailSent": true
  }
}
```

Errors:

- `404 User not found`
- `400 Only author invitations can be resent`
- `409 User has already set a password`

### Admin user management

- `GET /api/admin/users?page=1&limit=20&role=author&isActive=true&search=name`
- `GET /api/admin/users/:id`
- `PUT|PATCH /api/admin/users/:id` with `{ "role": "author" }`, `{ "isActive": false }`, or frontend `{ "status": "Suspended" }`
- `PATCH|PUT /api/admin/users/:id/role` with `{ "role": "author" }`
- `PATCH /api/admin/users/:id/status` with `{ "isActive": false }`
- `POST /api/admin/users/:id/reset-password` with `{ "password": "newPassword" }`
- `DELETE /api/admin/users/:id` deactivates the user; it is not a database hard delete

Compatibility mappings:

- `role: "user"` -> `reader`
- `status: "Active"` -> `isActive: true`
- `status: "Suspended"` -> `isActive: false`

## 7. Admin Assignment of Books to Authors

```http
POST /api/admin/books
```

```json
{
  "title": "Enterprise Publishing Systems",
  "description": "A practical book about modern publishing operations.",
  "category": "CATEGORY_OBJECT_ID",
  "author": "AUTHOR_USER_OBJECT_ID",
  "mrp": 499,
  "royaltyPercentage": 10,
  "printingCost": 100,
  "platformCharges": 30,
  "deliveryCharges": 50,
  "coverImage": "https://res.cloudinary.com/.../cover.jpg",
  "stock": 100,
  "status": "published",
  "discountPrice": 399,
  "isFeatured": true,
  "isbn": "9781234567890",
  "pages": 320,
  "format": "paperback"
}
```

Important:

- Always send the author's user `_id` in `author`; do not send the admin's ID or author name.
- The backend generates the slug.
- `mrp` is canonical and returned unchanged; additional checkout book tax is not added.
- `royaltyPerCopy` is derived as `mrp - printingCost - platformCharges - deliveryCharges` when charge configuration exists.
- The assigned book immediately appears in `GET /api/authors/me/books` for that author.
- When paid dashboard access is enabled, assigning a book to an author also grants access. When disabled, no entitlement is needed.

Admin book reads:

- `GET /api/admin/books?page=1&limit=100&status=published&author=<id>&search=title`
- `GET /api/admin/books/:id`
- `PUT /api/admin/books/:id`
- `DELETE /api/admin/books/:id`

## 8. Publish Package Administration

All admin endpoints require an admin token.

### List

```http
GET /api/admin/publish-packages?page=1&limit=20&search=professional&isActive=true&sort=sortOrder
```

### Create

```http
POST /api/admin/publish-packages
```

```json
{
  "name": "Professional",
  "description": "Complete publishing support",
  "price": 9999,
  "features": ["Editing", "Cover design", "ISBN"],
  "tagline": "Best for first-time authors",
  "highlighted": true,
  "badge": "Recommended",
  "sortOrder": 1,
  "isActive": true
}
```

Required on create: `name`, `description`, `price`.

### Read/update/archive

- `GET /api/admin/publish-packages/:id`
- `PUT|PATCH /api/admin/publish-packages/:id` with partial recognized fields
- `DELETE /api/admin/publish-packages/:id` archives by setting `isActive=false`

Errors:

- `400 name, description and price are required`
- `400 At least one publish package field is required`
- `400 price must be a non-negative number`
- `400 features must be an array of strings`
- `400 highlighted must be a boolean`
- `400 isActive must be a boolean`
- `400 sortOrder must be a finite number`
- `400 Invalid publish package id`
- `404 Publish package not found`
- `409 Publish package name already exists`

## 9. CMS Content

### Public content

```http
GET /api/content
```

No authentication required. For backward compatibility, the content appears both under `data` and at the top level:

```json
{
  "success": true,
  "data": {
    "hero": {},
    "about": {},
    "contact": {},
    "faq": [],
    "footer": {},
    "socialLinks": {},
    "seo": {},
    "announcements": [],
    "siteSettings": { "siteName": "Harglim Publishers", "siteContent": {} },
    "homeTitle": "...",
    "publishTitle": "..."
  },
  "homeTitle": "..."
}
```

New code should consistently read `response.data`. CMS responses use `Cache-Control: no-cache`, so browser `304` revalidation is valid and not an error.

### Admin read/update

```http
GET /api/admin/content
PUT /api/admin/content
```

Updates are partial. Example:

```json
{
  "announcementActive": true,
  "announcementText": "New books available",
  "homeWhyChooseJson": "[{\"title\":\"Editorial support\"}]",
  "siteSettings": {
    "supportEmail": "support@example.com",
    "siteContent": {
      "homeWhyChooseJson": "[{\"title\":\"Editorial support\"}]",
      "customKey": "preserved"
    }
  }
}
```

Nested `siteSettings.siteContent` is deep-preserved: sending one nested key does not remove the other existing keys.

JSON section fields must contain valid JSON arrays and each serialized field must not exceed 100 KB. Errors include:

- `400 At least one content field is required`
- `400 <field> must contain a valid JSON array`
- `400 <field> must not exceed 100 KB`

Unsupported top-level fields are ignored. Admin-only `adminProfileImage` is excluded from the public response.

## 10. Recommended Frontend Screen Flow

### Application startup

1. Load public `/api/content`, `/api/categories`, `/api/books`, `/api/spotlights`, and `/api/publish-packages` as required by the page.
2. If a token exists, call `/api/users/me/context`.
3. Build navigation and route guards from role/capabilities/feature flags.
4. On `401`, try one token refresh; prevent infinite refresh loops.

### Author workspace

1. Call `/api/users/me/context` and `/api/authors/me/dashboard-access`.
2. If paid access flag is false, hide purchase controls.
3. Load `/api/authors/me/books`; display every assigned/draft/published book.
4. Load dashboard, analytics, performance, and royalties independently; each needs its own loading/error/empty state.
5. After any mutation, refetch the relevant endpoint. Do not depend on browser cache.

### Author manuscript submission

1. Fetch categories and active `/api/publish-packages`.
2. Create or update the author draft.
3. Upload exactly one document using field `document`.
4. Store returned `data.url`.
5. Submit the book with `packageId` and `fileUrl`.
6. Lock editing while `publishingStatus` is pending/under review.

### Admin author onboarding

1. Create the author with name, email, role `author`, and no password.
2. If `emailSent=false`, show Resend Invite.
3. Assign books using the author's user `_id`.
4. Use admin author detail/dashboard APIs to inspect assigned books and royalties.

### Admin spotlight management

1. Load `/api/admin/spotlights`.
2. Create using one multipart `image` plus text fields.
3. For edit, send only changed text and optional replacement image.
4. Archive with DELETE; remove it from active UI after success.

## 11. API Module Coverage

The backend also currently exposes production modules for:

- Authentication, Google login, refresh sessions, logout, password reset
- Public books, categories, authors, search, reviews, CMS, contact, and spotlights
- Customer profile, addresses, wishlist, library, orders, payments, invoices, shipments, tracking, and notifications
- Manual UPI checkout, QR generation, verification, payment ledger, and compatibility order fields
- Reservation-based inventory and immutable inventory ledger
- Invoice generation and PDF download
- Shipment lifecycle and tracking URL support
- Notification records and retries
- Admin users, books, categories, orders, author applications, publishing review, payments, inventory, ledgers, invoices, shipments, notifications, analytics, royalties, and settlements
- Event-driven invoice, shipment, notification, analytics, and audit side effects

Use Swagger/OpenAPI for the complete 200+ operation inventory and exact schemas outside the focused contracts above.

## 12. Frontend Do/Do Not Checklist

Do:

- Use Mongo `_id` values where an endpoint expects `:id`; do not send order numbers such as `HM-...` as payment IDs.
- Upload one multipart file under the exact required field name.
- Read backend `message` and optional `error` for user-facing failures.
- Treat `201` as success for create and submit operations.
- Treat browser `304` as normal cache revalidation.
- Use backend-provided snapshot royalty values for historical records.
- Refetch author screens after mutations.

Do not:

- Send author/admin-only fields from author book forms.
- Send `slug` when creating books.
- Calculate order totals, royalty totals, or entitlements in the browser.
- Call dead fallback routes such as `/api/invoices`, `/api/orders` list, or `/api/authors/me/manuscripts`.
- Send `image` and `coverImage` as two files in one upload request.
- Show paid author dashboard purchase UI while the feature flag is disabled.

## 13. Validation Status

The aligned backend was validated with:

- 44 Jest suites passed
- 334 tests passed
- ESLint passed
- Production dependency audit: 0 vulnerabilities
- OpenAPI generated successfully with 173 paths and 89 schemas
- Documentation validation passed

