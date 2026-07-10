# Category Data Migration

Sprint 11.1 adds a one-time, offline category data migration utility:

```bash
node scripts/categoryMigration.js
```

The default mode is dry-run. It audits data and prints a JSON report without writing to MongoDB.

To apply safe updates:

```bash
node scripts/categoryMigration.js --apply
```

## Scope

The migration is intentionally not part of server startup and has no runtime API impact.

It audits:

- Missing category slugs.
- Missing `active` fields.
- Incorrect `bookCount` values.
- Orphan `Book.category` references.
- Duplicate slugs.
- Duplicate names, case-insensitive.

It updates only:

- Missing `slug`.
- Missing `active`.
- Mismatched `bookCount`.

It does not delete data, change schemas, modify routes, or alter frontend behavior.

## Idempotency

The script is safe to rerun. After a successful apply, a second dry-run should return no planned updates unless category/book data changed after the migration.

## Transactions

Apply mode uses a MongoDB session transaction by default. Use `--no-transaction` only for local development databases that do not support transactions.

```bash
node scripts/categoryMigration.js --apply --no-transaction
```

## Report

The JSON report includes:

- `summary.categoriesScanned`
- `summary.booksScanned`
- `summary.categorySlugUpdates`
- `summary.activeFieldUpdates`
- `summary.bookCountUpdates`
- `summary.orphanBookReferences`
- `summary.duplicateSlugGroups`
- `summary.duplicateNameGroups`
- `plannedUpdates`
- `orphanBooks`
- `duplicateSlugs`
- `duplicateNames`

## Rollback

Because the migration only sets deterministic compatibility fields and counts, rollback is normally not required. For production rollback, restore the pre-migration database backup. Run dry-run first and keep the report as the release artifact.

## Production Runbook

1. Take a database backup.
2. Run dry-run:

   ```bash
   node scripts/categoryMigration.js
   ```

3. Review duplicate and orphan findings.
4. Resolve any unexpected duplicate/orphan data manually.
5. Run apply:

   ```bash
   node scripts/categoryMigration.js --apply
   ```

6. Run dry-run again and confirm `plannedUpdates` is empty.
