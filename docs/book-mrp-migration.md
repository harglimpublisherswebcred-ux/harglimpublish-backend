# Book MRP Migration

Phase 1 makes `Book.mrp` the canonical book-commerce price while keeping legacy `Book.price` as a synchronized compatibility alias.

## Runtime Pricing

New checkout uses:

```text
Book.mrp * quantity
+ existing shipping calculation
= Order.totalPrice
```

New book orders persist `Order.tax = 0`. Historical orders and invoices keep their stored tax snapshots.

`discountPrice` remains available for catalog/display compatibility, but checkout does not use it in this phase.

## Migration Commands

Dry-run, no writes:

```bash
npm run migrate:book-mrp:dry-run
```

Apply:

```bash
npm run migrate:book-mrp
```

The apply command requires `MONGODB_URI`. The script defaults to transactional writes where MongoDB supports transactions.

## Behavior

The migration backfills:

```text
Book.mrp = Book.price
```

only when `mrp` is missing and `price` is valid.

It reports without overwriting:

- books where `mrp` and `price` both exist but differ;
- books with missing `price`;
- books with invalid `price`;
- failed writes.

The script is idempotent and safe to rerun.

## Rollback

The migration is additive and non-destructive. To rollback the runtime change, revert the code deployment. Existing `price` values remain available because Phase 1 does not remove the compatibility field.
