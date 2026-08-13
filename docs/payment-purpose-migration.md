# Payment Purpose Migration

Phase 2 evolves the payment domain into a multi-purpose foundation so `Payment` and `PaymentLedger` records support explicit business purposes (`ORDER_PURCHASE` and reserved `AUTHOR_ACCESS`) while keeping order payments fully backward compatible.

## Schema & Purpose Semantics

```text
Payment
├── purpose: 'ORDER_PURCHASE' | 'AUTHOR_ACCESS' (default 'ORDER_PURCHASE')
├── subjectType: 'ORDER' | custom string
├── subjectId: ObjectId
└── order: ObjectId (required for ORDER_PURCHASE, optional for non-order payments)
```

For legacy records without an explicit `purpose`, runtime logic defaults `purpose = 'ORDER_PURCHASE'`, `subjectType = 'ORDER'`, and `subjectId = order`.

## Migration Commands

Dry-run, no writes:

```bash
npm run migrate:payment-purpose:dry-run
```

Apply migration:

```bash
npm run migrate:payment-purpose
```

The apply command uses transactional updates where MongoDB supports sessions.

## Behavior

The migration backfills:

```text
purpose = 'ORDER_PURCHASE'
subjectType = 'ORDER'
subjectId = Payment.order
```

for all existing `Payment` and `PaymentLedger` documents where `purpose` is missing.

It reports:

- Total records scanned (`Payment` and `PaymentLedger`);
- Already migrated records;
- Backfilled records;
- Records with missing order references;
- Any failed update operations.

The script is idempotent and safe to rerun.

## Safety & Rollback

The migration is non-destructive and strictly additive. To rollback code logic, revert the code deployment. Existing order payments remain linked to `order` and `orderId`.
