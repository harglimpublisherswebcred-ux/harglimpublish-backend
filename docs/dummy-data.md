# Dummy Data Seeder

`scripts/seedDummyData.js` creates realistic demo data for local development, QA, Swagger testing, and frontend integration.

It is intentionally separate from the legacy root `seed.js` because the legacy script deletes categories and publish packages. The new dummy seeder is additive and idempotent.

## What It Seeds

- Admin, reader, author, and visitor demo users
- Categories with slugs, banners, SEO fields, and book counts
- Published books with inventory fields
- Publishing packages and one publish request
- One pending author application
- One paid order with manual UPI compatibility fields
- Verified payment, payment status history, and payment ledger entries
- Inventory reservation and immutable inventory ledger entries
- Invoice with a placeholder PDF document buffer
- Shipment and shipment ledger entry
- Reviews
- In-app notifications
- Analytics projection events
- Invoice counter baseline

## Commands

Dry-run first:

```bash
npm run seed:dummy:dry-run
```

Seed local/staging database:

```bash
npm run seed:dummy
```

Production requires an explicit safety flag:

```bash
node scripts/seedDummyData.js --force-production
```

## Required Environment

`MONGODB_URI` must point to the target database.

Optional:

```bash
DUMMY_SEED_PASSWORD=DemoPass123!
```

All seeded demo users use this password unless already present. Existing users are reused and their passwords are not reset.

## Demo Accounts

| Role | Email |
| --- | --- |
| Admin | `admin.demo@harglim.com` |
| Reader | `reader.demo@harglim.com` |
| Author | `author.demo@harglim.com` |
| Visitor | `visitor.demo@harglim.com` |

## Safety Guarantees

- No collections are deleted.
- Existing real records are not wiped.
- Records are matched by stable unique keys such as email, slug, order number, provider IDs, invoice number, event keys, and idempotency keys.
- Ledger records remain append-only; existing seeded ledger rows are reused.
- The script refuses to run when `NODE_ENV=production` unless `--force-production` is passed.
- The script is safe to rerun after partial completion.

## Recommended Workflow

1. Point `.env` to a local or staging MongoDB database.
2. Run `npm run seed:dummy:dry-run`.
3. Run `npm run seed:dummy`.
4. Login as `admin.demo@harglim.com` in Swagger or the frontend.
5. Use the seeded reader/customer records to test checkout, payments, invoices, shipments, notifications, and analytics screens.

## Notes

This script is for demo data only. Do not use these accounts or placeholder documents as production customer records.

