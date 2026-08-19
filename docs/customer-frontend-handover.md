# Customer Frontend Handover

## Catalog Screens

Home page:

- `GET /api/content` for CMS text/settings.
- `GET /api/books?featured=true` for featured books.
- `GET /api/categories` for category navigation.

Book listing:

- `GET /api/books?page=1&limit=12&category=<slug>&minPrice=0&maxPrice=1000&sort=-createdAt`
- Loading: skeleton grid.
- Empty: show "No books found".
- Error: retry button.

Book detail:

- `GET /api/books/:slug`
- `GET /api/books/:slug/related`
- `GET /api/books/:slug/reviews`

Search:

- `GET /api/search?q=<query>&page=1&limit=12`
- Reset `page` to 1 whenever query changes.

Price display:

```text
Use book.mrp as canonical selling price.
book.price is legacy alias.
```

## Checkout Flow

```text
Cart
  -> POST /api/orders
  -> Backend calculates MRP subtotal with tax=0 and shippingPrice=0
  -> Backend creates ORDER_PURCHASE payment + QR
  -> Customer pays externally through UPI
  -> PUT /api/orders/:id/verify-payment
  -> Admin verifies
  -> Invoice and shipment are created asynchronously
```

Create order:

```http
POST /api/orders
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

Payload:

```json
{
  "items": [
    {
      "book": "<BOOK_ID>",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "Reader Name",
    "addressLine1": "Street 1",
    "addressLine2": "",
    "city": "Chennai",
    "postalCode": "600001",
    "country": "IN"
  },
  "paymentMethod": "UPI"
}
```

Do not send financial fields. Backend totals are authoritative.

Submit UTR:

```http
PUT /api/orders/:id/verify-payment
```

```json
{
  "utr": "UTR123456789"
}
```

Frontend state mapping:

| UI State | Backend signal |
| --- | --- |
| `CART` | Local cart only |
| `ORDER_CREATED` | `POST /api/orders` success |
| `PAYMENT_PENDING` | Payment QR shown |
| `VERIFICATION_PENDING` | UTR submitted, payment awaiting admin |
| `PAID` | `order.isPaid = true` or payment verified |
| `PROCESSING` | `order.status = PROCESSING` |
| `SHIPPED` | `order.status = SHIPPED` |
| `DELIVERED` | `order.status = DELIVERED` |
| `CANCELLED` | `order.status = CANCELLED` |

Payment error handling:

- Invalid/missing UTR: keep user on UTR form.
- Duplicate UTR: show support message and refresh payment state.
- Expired payment: show expired state; customer may need a new attempt.
- Rejected payment: show rejected state and support/new payment guidance.
- Already verified: refresh order detail.

## Customer Account

Use authenticated user id from `GET /api/users/me/context` or `GET /api/users/me`.

Orders:

- `GET /api/users/:id/orders`
- `GET /api/orders/:id`
- `DELETE /api/orders/:id`
- `GET /api/orders/track/:orderNumber`

Payments:

- `GET /api/users/:id/orders/:orderId/payments`
- `GET /api/users/:id/payments`
- `GET /api/users/:id/payments/:paymentId`

Invoices:

- `GET /api/users/:id/invoices`
- `GET /api/users/:id/invoices/:invoiceId`
- `GET /api/users/:id/invoices/:invoiceId/download`

Shipments:

- `GET /api/users/:id/shipments`
- `GET /api/users/:id/shipments/:shipmentId`
- `GET /api/orders/:id/shipment`
- `GET /api/orders/:id/tracking`

Notifications:

- `GET /api/users/:id/notifications`
- `PATCH /api/users/:id/notifications/read-all`
- `PATCH /api/users/:id/notifications/:notificationId/read`
- `GET /api/users/:id/notifications/:notificationId`
- `DELETE /api/users/:id/notifications/:notificationId`

Wishlist/library:

- `GET /api/users/:id/wishlist`
- `POST /api/users/:id/wishlist` with `{ "bookId": "<BOOK_ID>" }`
- `DELETE /api/users/:id/wishlist/:bookId`
- `GET /api/users/:id/library`

## Loading, Empty, Error

- Catalog empty: no books/categories found.
- Orders empty: show first purchase CTA.
- Invoices empty: invoice appears after payment verification.
- Shipment empty: shipment appears after invoice/shipping workflow.
- Notifications empty: no messages yet.
- `401`: login/refresh.
- `403`: wrong user/admin-only.
- `404`: missing record or unauthorized ownership depending endpoint.
- `409`: duplicate/state conflict, refresh data.
