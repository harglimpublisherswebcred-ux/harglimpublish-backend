# HM Backend API

Production Node.js/Express backend for commerce, publishing, payments, inventory, invoices, notifications, shipping, analytics, author dashboard access, royalty settlement, and admin operations.

## Features

- JWT authentication and role authorization.
- Book catalog, search, authors, author applications, and publishing requests.
- Order checkout with canonical Book MRP pricing and UPI payment bridge.
- Payment engine with repository/service separation and immutable ledger.
- Multi-purpose payments for `ORDER_PURCHASE` and `AUTHOR_ACCESS`.
- Reservation-based inventory engine with ledger.
- Invoice generation and admin download APIs.
- Asynchronous notification engine.
- Shipping and fulfillment engine.
- Analytics/reporting projections.
- Author publishing, paid dashboard entitlement, royalty analytics, and manual royalty payout accounting.
- Swagger UI at `/api/docs`.

## Technology Stack

Node.js, Express 5, MongoDB, Mongoose, Jest, Supertest, Swagger, Winston, Cloudinary, Resend, QRCode.

## Installation

```bash
npm install
cp .env.example .env # if present, otherwise create .env from docs/deployment.md
npm run dev
```

## Documentation

- Swagger UI: `/api/docs`
- Frontend handover: `docs/HANDOVER.md`
- Master API handover: `docs/api-handover.md`
- Customer handover: `docs/customer-frontend-handover.md`
- Author handover: `docs/author-frontend-handover.md`
- Admin handover: `docs/admin-frontend-handover.md`
- OpenAPI JSON: `docs/openapi.json`
- OpenAPI YAML: `docs/openapi.yaml`
- Postman: `docs/postman_collection.json`
- Frontend guide: `docs/frontend-api-guide.md`
- Architecture: `docs/architecture.md`
- Deployment: `docs/deployment.md`

## Testing

```bash
npm test
```

Known issues: Mongoose warns that the deprecated `new` query option should move to `returnDocument: 'after'` in a maintenance pass.

## Roadmap

GST/tax extensions, BI dashboards, multi-warehouse inventory, recommendation engine, and AI insights.

## License

ISC.
