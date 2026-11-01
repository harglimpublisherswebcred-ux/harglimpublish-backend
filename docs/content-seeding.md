# Site Content Seed

The CMS seed is intentionally dry-run first and idempotent. It validates content through the same service used by `PUT /api/admin/content`.

Place the frontend-approved JSON at `data/site-content-seed.json`, or pass its path explicitly:

```bash
npm run seed:content:dry-run -- --file C:/path/to/site-content-seed.json
```

Review `changedFields`, then apply outside production:

```bash
npm run seed:content -- --file C:/path/to/site-content-seed.json
```

Production apply requires an explicit safeguard:

```bash
npm run seed:content -- --file C:/secure/path/site-content-seed.json --force-production
```

Never invent or modify marketing, legal, royalty, or contact copy in this script. The input JSON is the source of truth.
