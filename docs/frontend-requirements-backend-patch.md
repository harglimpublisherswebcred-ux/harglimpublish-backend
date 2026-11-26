# Frontend Requirements Backend Patch - 26 November 2026

## Book Language

`language` is an optional canonical string on admin and author book create/update payloads. It is trimmed, internal whitespace is collapsed, Unicode is supported, and the maximum length is 80 characters. A supplied value must be a non-empty string. Omitting it during update preserves the stored value. Legacy books remain missing until a verified value is supplied; the backend never infers language from titles.

The field is returned through canonical admin, author, public catalog, detail, related, and search book documents.

Before using custom language values in production:

```bash
npm run migrate:book-language-index:dry-run
npm run migrate:book-language-index
npm run audit:book-language
```

The index migration moves MongoDB text-search language overrides from public `language` to private `_searchLanguage`. The audit performs no writes and reports records requiring verified correction.

## Manual Royalties

Create requests should send `Idempotency-Key: manual-royalty-<author-id>-<period>`. The same key and canonical payload returns the existing statement. Reusing a key for different content returns HTTP 409 with `MANUAL_ROYALTY_IDEMPOTENCY_CONFLICT`.

Corrections use the existing void operation followed by a create request containing `replacementFor`. The referenced statement must be `VOID` and belong to the same author. Original totals are never edited. Author lists omit administrator identities, emails, idempotency keys, and request hashes, and protected financial responses use `Cache-Control: no-store`.

Before deployment:

```bash
npm run migrate:manual-royalty-index:dry-run
npm run migrate:manual-royalty-index
```

## Uploads

Image endpoints still require one multipart field named `image`. Extension and declared MIME checks run before upload, and Cloudinary processes the content as an image under explicit JPG/JPEG/PNG/WebP/GIF formats. Invalid files, provider configuration failures, timeouts, size violations, and extra files return stable upload error codes.

## Analytics

Author analytics validates date inputs and returns inclusive UTC bounds plus aggregate units, revenue, known royalty, order count, sale-line count, unresolved history count, currency, and completeness status. Existing response fields remain available.

## HTTP Policy

Global, authentication, upload, and sensitive-write quotas are independent. CORS exposes `X-Request-Id`, `Retry-After`, `RateLimit`, and `RateLimit-Policy`. A 429 response contains a stable `error` code; clients must wait for `Retry-After` instead of retrying immediately.

Configure staging in `CORS_ORIGINS` and set:

```env
UPLOAD_RATE_LIMIT_WINDOW_MS=900000
UPLOAD_RATE_LIMIT_MAX=30
SENSITIVE_RATE_LIMIT_WINDOW_MS=900000
SENSITIVE_RATE_LIMIT_MAX=120
```
