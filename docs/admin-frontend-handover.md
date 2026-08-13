# Admin Frontend Handover

All Admin APIs require:

```http
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

## Dashboard

Use:

- `GET /api/admin/dashboard`
- `GET /api/admin/operations/dashboard`
- `GET /api/admin/analytics`
- `GET /api/admin/stats`
- `GET /api/admin/analytics/dashboard`

Cards should link to:

- Pending author applications.
- Pending publish requests.
- Payment verification queue.
- Low stock.
- Royalty settlements.
- Shipment queues.

## Users

- `GET /api/admin/users?page=1&limit=20&role=reader&search=term`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/role`
- `PUT /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/status`
- `POST /api/admin/users/:id/reset-password`

Combined update payload:

```json
{
  "role": "user",
  "status": "Suspended"
}
```

Backend maps `user` to `reader`, `Active` to `isActive=true`, and `Suspended` to `isActive=false`.

## Author Applications

- `GET /api/admin/author-applications?status=pending`
- `PUT /api/admin/author-applications/:id/status`

Payload:

```json
{
  "status": "approved"
}
```

Approval changes associated user role to `author`.

## Admin Author Aggregate

- `GET /api/admin/authors/:authorId`
- `GET /api/admin/authors/:authorId/dashboard`
- `GET /api/admin/authors/:authorId/royalties`

Use for a single admin author detail page. It combines profile, application, entitlement, books, publishing, royalty, and settlement context where available.

## Author Dashboard Access Plans

- `GET /api/admin/author-access/plans`
- `POST /api/admin/author-access/plans`
- `PUT /api/admin/author-access/plans/:id`
- `POST /api/admin/author-access/plans/:id/activate`
- `POST /api/admin/author-access/plans/:id/archive`

Create/update payload:

```json
{
  "name": "Author Pro Dashboard",
  "description": "One-time dashboard access",
  "amount": 2999,
  "currency": "INR",
  "status": "ACTIVE"
}
```

Only one plan should be `ACTIVE`. Backend enforces this with index and service behavior.

Purchases and entitlements:

- `GET /api/admin/author-access/purchases`
- `GET /api/admin/author-access/entitlements`
- `POST /api/admin/author-access/entitlements/grant`
- `POST /api/admin/author-access/entitlements/:userId/revoke`
- `POST /api/admin/author-access/entitlements/:userId/restore`

Grant payload:

```json
{
  "userId": "<AUTHOR_ID>",
  "reason": "Manual admin grant"
}
```

Revoke/restore payload:

```json
{
  "reason": "Admin decision"
}
```

## Payment Verification

- `GET /api/admin/operations/payments`
- `GET /api/admin/operations/payments/:id`
- `POST /api/admin/operations/payments/:id/approve`
- `POST /api/admin/operations/payments/:id/reject`
- `POST /api/admin/operations/payments/:id/cancel`
- `POST /api/admin/operations/payments/:id/expire`
- `POST /api/admin/operations/payments/:id/retry-verification`
- `POST /api/admin/operations/payments/:id/recreate-qr`

Payment list filters:

- `status`
- `page`
- `limit`
- `from`
- `to`

Admin UI must display payment `purpose`:

- `ORDER_PURCHASE`: customer checkout payment.
- `AUTHOR_ACCESS`: paid author dashboard purchase.

Do not infer purpose from order presence.

Approve:

```json
{
  "reason": "Verified in bank statement"
}
```

Reject:

```json
{
  "reason": "UTR not found"
}
```

After action, refresh payment detail and queues.

## Publishing Queue

- `GET /api/admin/publish-requests`
- `PUT /api/admin/publish-requests/:id/status`
- `POST /api/admin/publish-requests/:id/request-changes`
- `POST /api/admin/publish-requests/:id/reject`
- `POST /api/admin/publish-requests/:id/approve`

Request changes:

```json
{
  "reason": "Please update chapter 2 and upload revised manuscript."
}
```

Reject:

```json
{
  "reason": "Submission does not meet editorial policy."
}
```

Approve:

```json
{
  "notes": "Approved for publishing."
}
```

Approval publishes the existing linked book.

## Books

- `POST /api/admin/books`
- `PUT /api/admin/books/:id`
- `DELETE /api/admin/books/:id`

Admin book payload:

```json
{
  "title": "Book Title",
  "description": "Book description",
  "author": "<AUTHOR_ID>",
  "category": "<CATEGORY_ID>",
  "mrp": 499,
  "price": 499,
  "royaltyPercentage": 10,
  "stock": 100,
  "status": "published",
  "isFeatured": true,
  "isBestseller": false,
  "isNewRelease": true
}
```

Field classification:

| Field | Admin | Author | Frontend note |
| --- | --- | --- | --- |
| `title` | editable | editable in draft | Required create |
| `description` | editable | editable in draft | Required create |
| `author` | editable/admin-owned | forbidden | Server ownership for author draft |
| `category` | editable | editable in draft | Required create |
| `mrp` | editable | editable in draft | Canonical price |
| `price` | compatibility alias | compatibility alias | Must match `mrp` if sent |
| `royaltyPercentage` | editable | forbidden | Purchase-time snapshot used later |
| `stock` | editable | forbidden | Inventory-owned |
| `status` | editable | forbidden | Publishing/admin-owned |
| `ratings/reviewCount` | read-only/admin system | forbidden | Review-owned |

## Orders, Invoices, Shipments

Orders:

- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id/status`

Status payload:

```json
{
  "status": "Shipped"
}
```

Invoices:

- `GET /api/admin/invoices`
- `GET /api/admin/invoices/search`
- `GET /api/admin/invoices/:id`
- `GET /api/admin/invoices/:id/download`

Shipments:

- `GET /api/admin/shipments`
- `GET /api/admin/shipments/search`
- `GET /api/admin/shipments/:id`
- `GET /api/admin/shipments/:id/tracking`
- `POST /api/admin/shipments/:id/assign-courier`
- `POST /api/admin/shipments/:id/update-status`
- `POST /api/admin/shipments/:id/cancel`

Assign courier:

```json
{
  "provider": "manual",
  "trackingNumber": "TRK123456",
  "courierName": "Manual Courier"
}
```

Update shipment:

```json
{
  "status": "SHIPPED",
  "location": "Chennai",
  "description": "Package shipped"
}
```

## Royalty Settlements And Manual Payout

Manual payout is the final current design. There is no payout provider integration.

- `GET /api/admin/royalty-settlements/reconcile`
- `POST /api/admin/royalty-settlements/preview`
- `POST /api/admin/royalty-settlements`
- `GET /api/admin/royalty-settlements`
- `GET /api/admin/royalty-settlements/:id`
- `POST /api/admin/royalty-settlements/:id/approve`
- `POST /api/admin/royalty-settlements/:id/mark-paid`
- `POST /api/admin/royalty-settlements/:id/cancel`

Manual payout process:

1. Preview eligible royalties.
2. Create draft settlement.
3. Review settlement detail.
4. Approve settlement.
5. Transfer money outside HM through bank/UPI/company process.
6. Record the transfer through mark-paid.
7. Backend stores payout history.

Mark-paid payload:

```json
{
  "paymentMethod": "MANUAL_BANK_TRANSFER",
  "transactionReference": "BANK-REF-123",
  "paidAt": "2026-08-09T10:00:00.000Z",
  "notes": "Transferred manually"
}
```

Frontend cannot change payout amount.

## CMS, Categories, Reviews, Analytics, Notifications

CMS:

- `PUT /api/admin/content`

Categories:

- `GET /api/admin/categories`
- `GET /api/admin/categories/:id`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id/status`
- `DELETE /api/admin/categories/:id`

Reviews:

- `GET /api/admin/reviews`
- `PATCH /api/admin/reviews/:reviewId/status`
- `DELETE /api/admin/reviews/:id`

Analytics:

- `GET /api/admin/analytics/dashboard`
- `GET /api/admin/analytics/revenue`
- `GET /api/admin/analytics/books`
- `GET /api/admin/analytics/payments`
- `GET /api/admin/analytics/inventory`
- `GET /api/admin/analytics/shipments`
- `GET /api/admin/analytics/customers`

Notifications:

- `GET /api/admin/notifications`
- `GET /api/admin/notifications/search`
- `GET /api/admin/notifications/:id`
- `POST /api/admin/notifications/:id/retry`
