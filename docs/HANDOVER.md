# HM Backend Frontend Handover

This is the first document for frontend engineers integrating the Harglim Publishers backend.

## 1. Project Overview

HM Backend provides APIs for:

- Customer catalog, checkout, manual UPI payment, invoices, shipment tracking, notifications, wishlist, and library.
- Author application, author-owned book drafts, publishing review, paid dashboard access, royalty analytics, and settlement history.
- Admin operations for users, authors, author access plans, payment verification, publishing review, books, orders, invoices, shipments, content, categories, reviews, analytics, notifications, and manual royalty payout accounting.

## 2. Base URL

Use a single API base URL in the frontend:

```txt
Local: http://localhost:5000
Production: https://harglimpublish-backend.onrender.com
```

All API paths in this handover are relative to that host.

## 3. API Documentation Locations

- Human handover: `docs/api-handover.md`
- Customer flows: `docs/customer-frontend-handover.md`
- Author flows: `docs/author-frontend-handover.md`
- Admin flows: `docs/admin-frontend-handover.md`
- Generated endpoint guide: `docs/frontend-api-guide.md`
- Admin legacy guide: `docs/adminapis.md`
- OpenAPI JSON: `docs/openapi.json`
- OpenAPI YAML: `docs/openapi.yaml`
- Postman collection: `docs/postman_collection.json`
- Production certification: `docs/production-certification.md`

Runtime docs:

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs.json`
- Health: `/health`

## 4. Authentication

Login:

```http
POST /api/auth/login
```

Send:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "token": "<ACCESS_TOKEN>",
    "refreshToken": "<REFRESH_TOKEN>",
    "refreshTokenExpiresAt": "2026-08-09T12:00:00.000Z",
    "user": {
      "_id": "<USER_ID>",
      "name": "User Name",
      "email": "user@example.com",
      "role": "reader"
    }
  }
}
```

For protected APIs send:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

On `401`, refresh with `POST /api/auth/refresh` if a refresh token exists, otherwise send the user to login.

## 5. Bootstrap User Context

After restoring auth, call:

```http
GET /api/users/me/context
```

Use this response to build navigation and feature access:

- Current role.
- Author application state.
- Publishing capability.
- Paid dashboard capability.
- Admin capability.

Client checks are UI hints only. Backend middleware remains authoritative.

## 6. User Roles And Capability Model

| Actor | Customer | Apply Author | Publish | Paid Dashboard | Admin |
| --- | --- | --- | --- | --- | --- |
| Anonymous | Public catalog only | No | No | No | No |
| Reader | Yes | Yes | No | No | No |
| Author without plan | Yes | Already author | Yes | No | No |
| Author with ACTIVE entitlement | Yes | Already author | Yes | Yes | No |
| Author with REVOKED entitlement | Yes | Already author | Yes | No | No |
| Admin | Yes | Yes | Yes/admin | Yes/admin | Yes |

Permanent product rule:

```text
Author role = publishing access.
ACTIVE author dashboard entitlement = paid dashboard access.
```

## 7. Main Integration Flows

Customer:

```text
Catalog -> Book Detail -> Cart -> POST /api/orders -> QR Payment -> Submit UTR -> Admin verifies -> Invoice/Shipment/Notifications
```

Author:

```text
Apply -> Admin approves -> Create draft book -> Upload files -> Submit for review -> Admin publishes
```

Paid author dashboard:

```text
Check dashboard access -> Purchase plan -> Submit UTR -> Admin verifies AUTHOR_ACCESS payment -> Dashboard ACTIVE
```

Admin:

```text
Login -> Dashboard queues -> Verify payments -> Review publishing -> Manage users/books/content -> Settlement preview -> Approve -> Manual payout -> Mark paid
```

## 8. Frontend Implementation Order

1. API client and environment configuration.
2. Auth pages and token handling.
3. `GET /api/users/me/context` bootstrap.
4. Public catalog, categories, search, reviews.
5. Cart and checkout.
6. Manual UPI QR and UTR submission.
7. Order history, invoices, shipment tracking.
8. Author application.
9. Author publishing drafts and uploads.
10. Paid dashboard purchase and entitlement states.
11. Author dashboard analytics, royalties, settlements.
12. Admin RBAC shell.
13. Admin dashboard, users, authors, payments, publishing, books.
14. Admin invoices, shipments, content, categories, reviews, analytics, notifications.
15. Royalty settlement and manual payout screens.
16. Error, empty, loading, retry, and permission states.

## 9. Screen-To-API Matrix

| Screen | API | Method | Trigger |
| --- | --- | --- | --- |
| Health badge | `/health` | GET | App diagnostics |
| Swagger link | `/api/docs` | GET | Developer docs |
| Login | `/api/auth/login` | POST | Submit login form |
| Register | `/api/auth/register` | POST | Submit registration |
| Auth refresh | `/api/auth/refresh` | POST | Access token expired |
| Current user | `/api/users/me/context` | GET | App bootstrap |
| Home CMS | `/api/content` | GET | Home/publish page load |
| Catalog | `/api/books` | GET | Listing page load |
| Book detail | `/api/books/:slug` | GET | Product route load |
| Related books | `/api/books/:slug/related` | GET | Book detail side rail |
| Reviews | `/api/books/:slug/reviews` | GET/POST | Detail load/review submit |
| Categories | `/api/categories` | GET | Category nav |
| Search | `/api/search` | GET | Search submit |
| Checkout | `/api/orders` | POST | Place order |
| UTR submit | `/api/orders/:id/verify-payment` | PUT | Submit UTR |
| Order detail | `/api/orders/:id` | GET | Order detail route |
| Public tracking | `/api/orders/track/:orderNumber` | GET | Tracking lookup |
| Invoices | `/api/users/:id/invoices` | GET | Account invoices |
| Invoice download | `/api/users/:id/invoices/:invoiceId/download` | GET | Download click |
| Shipments | `/api/users/:id/shipments` | GET | Account shipments |
| Notifications | `/api/users/:id/notifications` | GET | Notification center |
| Author application | `/api/author-applications` | POST | Become author submit |
| Author app status | `/api/users/me/author-application` | GET | Become author page load |
| Author books | `/api/authors/me/books` | GET/POST | Author library/draft create |
| Author book detail | `/api/authors/me/books/:bookId` | GET/PUT/DELETE | Edit draft |
| Submit book | `/api/authors/me/books/:bookId/submit` | POST | Submit for review |
| Author uploads | `/api/authors/me/uploads/image`, `/document` | POST | Upload cover/manuscript |
| Dashboard access | `/api/authors/me/dashboard-access` | GET | Author dashboard route guard |
| Purchase access | `/api/authors/me/dashboard-access/purchase` | POST | Buy dashboard access |
| Author dashboard | `/api/authors/me/dashboard` | GET | Dashboard load |
| Author royalties | `/api/authors/me/royalties` | GET | Royalties page |
| Author settlements | `/api/authors/me/royalty-settlements` | GET | Settlement page |
| Admin dashboard | `/api/admin/dashboard` | GET | Admin home |
| Admin users | `/api/admin/users` | GET/PUT | User management |
| Admin payments | `/api/admin/operations/payments` | GET | Verification queue |
| Admin payment actions | `/api/admin/operations/payments/:id/approve`, `/reject` | POST | Verify/reject |
| Admin publishing | `/api/admin/publish-requests` | GET | Publishing queue |
| Admin publishing actions | `/api/admin/publish-requests/:id/approve`, `/reject`, `/request-changes` | POST | Editorial action |
| Admin author access | `/api/admin/author-access/*` | GET/POST/PUT | Plans and entitlements |
| Admin settlements | `/api/admin/royalty-settlements*` | GET/POST | Settlement workflow |
| Admin CMS | `/api/admin/content` | PUT | Save content |

## 10. Loading, Empty, Error UX Matrix

| Area | Loading | Empty | Unauthorized | Forbidden | Conflict | Retry |
| --- | --- | --- | --- | --- | --- | --- |
| Catalog | Skeleton cards | No books found | Not applicable | Not applicable | Not applicable | Yes |
| Checkout | Disable place order | Empty cart | Login required | Account blocked/wrong role | Stock/payment conflict | Rebuild cart and retry |
| UTR submit | Disable submit | No active payment | Login required | Wrong owner | Duplicate UTR/already submitted | Refresh first |
| Orders | Table skeleton | No orders | Login required | Wrong owner | Not typical | Yes |
| Author application | Form skeleton | Show application form | Login required | Already author/admin-only path | Existing application | Refresh state |
| Author books | Draft skeleton | No drafts | Login required | Author role required | Locked under review | Refresh latest request |
| Paid dashboard | Metrics skeleton | No sales | Login required | Entitlement required/revoked | Purchase/payment conflict | Refresh access status |
| Admin queues | Table skeleton | No queue items | Admin login required | Not admin | State already changed | Refresh queue |
| Settlement | Preview skeleton | No eligible sales | Admin login required | Not admin | Already claimed/paid | Refresh before retry |

## 11. Production Notes

- Frontend must not send or trust financial totals. Backend calculates order totals from `Book.mrp`.
- Frontend should prefer `book.mrp`. `book.price` is a legacy compatibility alias.
- UTR should not be logged in frontend analytics or console output.
- `royaltyAmount: null` means unknown historical royalty, not INR 0.
- File uploads use `multipart/form-data`; do not JSON encode files.
- Do not expose backend secrets in frontend environment variables.
