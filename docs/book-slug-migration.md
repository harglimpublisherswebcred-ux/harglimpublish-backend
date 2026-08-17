# Book Slug Hotfix and Migration

## Purpose

Book slugs are server-owned public URL identifiers. Every newly persisted normal Book must have a non-null, non-empty, URL-safe, unique slug.

The production hotfix prevents Admin Book creation from reaching MongoDB with `slug = null` and provides a safe audit/backfill utility for legacy rows.

## Runtime Invariant

```text
title
-> backend generates slug
-> backend resolves collisions
-> Book persists with unique slug
```

Examples:

```text
Enterprise Publishing Systems -> enterprise-publishing-systems
Enterprise Publishing Systems -> enterprise-publishing-systems-2
Enterprise Publishing Systems -> enterprise-publishing-systems-3
```

Existing valid slugs are not changed on title update, preserving public URLs.

## Audit

Dry-run is the default:

```bash
npm run migrate:book-slug:dry-run
```

The report includes:

- total books
- valid slugs
- missing slugs
- null slugs
- empty slugs
- duplicate slugs
- planned updates

## Apply

Apply only after reviewing the dry-run output against the target database:

```bash
npm run migrate:book-slug
```

The script updates only invalid or duplicate slug fields. It does not modify MRP, legacy price, royalty, stock, author, status, orders, payments, or publishing fields.

## Idempotency

After a successful apply, a second dry-run/apply should report zero new slug changes. Existing valid slugs remain stable.
