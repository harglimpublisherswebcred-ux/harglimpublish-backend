# Author Frontend Handover

## Author Application

Reader flow:

```text
GET /api/users/me/author-application
  -> no application: show form
  -> pending: show pending state
  -> approved: route user to author publishing
  -> rejected: show rejection/reapply guidance if product allows
```

Submit:

```http
POST /api/author-applications
Authorization: Bearer <ACCESS_TOKEN>
```

```json
{
  "penName": "Optional Pen Name",
  "bio": "Short biography",
  "portfolioUrl": "https://example.com",
  "experience": "Writing and publishing background"
}
```

Author application states:

| State | UI |
| --- | --- |
| `NOT_APPLIED` | Show application form |
| `pending` | Lock form, show review pending |
| `approved` | Show author publishing navigation |
| `rejected` | Show decision and support/reapply guidance |

## Permanent Product Rule

```text
Publishing does not require paid dashboard access.
Paid dashboard access controls analytics and royalty dashboard only.
```

## Author Publishing Flow

```text
Approved author
  -> Create book draft
  -> Upload cover image
  -> Upload manuscript document
  -> Edit draft
  -> Submit for review
  -> Admin requests changes, rejects, or approves
  -> Approved book becomes published
```

APIs:

- `GET /api/authors/me/books`
- `POST /api/authors/me/books`
- `GET /api/authors/me/books/:bookId`
- `PUT /api/authors/me/books/:bookId`
- `DELETE /api/authors/me/books/:bookId`
- `POST /api/authors/me/books/:bookId/submit`
- `POST /api/authors/me/uploads/image`
- `POST /api/authors/me/uploads/document`

Create draft payload:

```json
{
  "title": "My Book",
  "description": "Detailed description",
  "category": "<CATEGORY_ID>",
  "mrp": 499,
  "format": "paperback",
  "coverImage": "https://res.cloudinary.com/.../cover.jpg",
  "isbn": "9780000000000",
  "pages": 240
}
```

Author editable fields:

- `title`
- `description`
- `category`
- `format`
- `coverImage`
- `mrp`
- `price` as legacy alias only
- `isbn`
- `pages`

Author forbidden fields:

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

Submit payload:

```json
{
  "fileUrl": "https://res.cloudinary.com/.../manuscript.pdf",
  "genre": "Fiction",
  "wordCount": 50000,
  "packageId": "<PUBLISH_PACKAGE_ID>"
}
```

Publishing state mapping:

| Backend | Frontend |
| --- | --- |
| `Book.status = draft`, no active publish request | `DRAFT` |
| PublishRequest `PENDING` | `SUBMITTED` |
| PublishRequest `UNDER_REVIEW` | `UNDER_REVIEW` |
| PublishRequest `CHANGES_REQUESTED` | `CHANGES_REQUESTED` |
| PublishRequest `REJECTED` | `REJECTED` |
| PublishRequest `APPROVED`, `Book.status = published` | `PUBLISHED` |
| `Book.status = archived` | `ARCHIVED` |

Changes requested UX:

```text
Admin requests changes
  -> Author sees reason from latestPublishRequest
  -> Editing becomes available
  -> Author updates draft
  -> Author submits again
```

## Uploads

Cover image:

```http
POST /api/authors/me/uploads/image
Content-Type: multipart/form-data
field: image
```

Manuscript:

```http
POST /api/authors/me/uploads/document
Content-Type: multipart/form-data
field: document
```

Handle:

- `401`: login.
- `403`: not author/admin.
- `413`: file too large.
- `415` or validation message: unsupported file type.
- `503` or config message: upload provider not configured.

## Paid Dashboard Access

State:

```http
GET /api/authors/me/dashboard-access
```

Purchase:

```http
POST /api/authors/me/dashboard-access/purchase
```

No request body is required. Backend uses active plan and creates an `AUTHOR_ACCESS` payment.

Submit UTR:

```http
PUT /api/authors/me/dashboard-access/purchases/:purchaseId/verify-payment
```

```json
{
  "utr": "UTR123456789"
}
```

Dashboard access states:

| State | UI |
| --- | --- |
| `NOT_AUTHOR` | Hide author dashboard purchase |
| `APPROVED_AUTHOR_NO_PLAN` | Show plan purchase CTA |
| `PAYMENT_PENDING` | Show QR/payment instructions |
| `VERIFICATION_PENDING` | Show waiting for admin |
| `ACTIVE` | Unlock dashboard |
| `REVOKED` | Lock dashboard, keep publishing available |

## Dashboard Data

Requires active entitlement:

- `GET /api/authors/me/dashboard`
- `GET /api/authors/me/analytics?range=30d`
- `GET /api/authors/me/books/performance`
- `GET /api/authors/me/royalties?page=1&limit=10`
- `GET /api/authors/me/royalty-settlements`
- `GET /api/authors/me/royalty-settlements/:id`

Royalty display:

- `accruedKnown`: known calculated royalty.
- `eligibleUnsettled`: delivered sales eligible for settlement.
- `settledPendingPayment`: approved settlement amount not yet paid.
- `paidLifetime`: amount recorded as paid.
- `dataStatus = PARTIAL`: show note that some historical royalty data is unavailable.
- `royaltyAmount = null`: display "Royalty unavailable for historical sale".
- `royaltyAmount = 0`: display INR 0.

Settlement status UI:

- `DRAFT`: admin draft, usually not shown to author unless returned.
- `APPROVED` or `PAYMENT_PENDING`: settlement recorded, payout pending.
- `PAID`: payout completed.
- `CANCELLED`: cancelled settlement, show read-only if returned.
