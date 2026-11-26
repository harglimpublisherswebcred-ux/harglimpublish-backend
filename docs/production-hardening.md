# Production Hardening Addendum

## Publishing Terms

The terms flow is versioned and append-only:

1. `GET /api/publishing-terms` returns the current version, effective date, and enforcement flag.
2. `GET /api/authors/me/publishing-terms` returns the authenticated author's acceptance status.
3. `POST /api/authors/me/publishing-terms/accept` with `{ "version": "<currentVersion>" }` records an immutable acceptance.
4. When `PUBLISHING_TERMS_ENFORCEMENT_ENABLED=true`, `POST /api/publish-requests` requires a matching acceptance and snapshots its ID, version, and timestamp.

The acceptance includes a SHA-256 hash of the canonical CMS terms and author guidelines. If content changes without incrementing `PUBLISHING_TERMS_VERSION`, acceptance and submission fail with a conflict until the version is corrected. Deploy the frontend flow before enabling enforcement.

## CORS And Rate Limiting

Production startup requires `CORS_ORIGINS` or `FRONTEND_URL`. `CORS_ORIGINS` accepts a comma-separated allowlist. Requests without an Origin header remain valid for server-to-server clients. Credentialed CORS remains disabled by default.

Global and authentication limits are configurable through `RATE_LIMIT_*` and `AUTH_RATE_LIMIT_*`. OPTIONS requests are not counted. The built-in memory store is per process; use a shared store when scaling to multiple instances.

## Health And Metrics

- `GET /health` is a liveness check.
- `GET /health/ready` returns 200 only while MongoDB is connected and 503 otherwise.
- `GET /api/admin/operations/runtime-metrics` is admin-only and returns per-process request totals, in-flight requests, status classes, p50/p95/p99 latency samples, uptime, and memory usage.

Runtime metrics reset when the process restarts and are not a substitute for Render/Atlas monitoring or a shared metrics platform.

## Courier Capabilities

`GET /api/admin/shipments/couriers` returns the backend-owned provider catalogue. The frontend may present only entries with `available=true` as configured. Manual courier assignment is available. External providers remain `NOT_CONFIGURED` until credentials and real adapters are added.

## OpenAPI Certification

Settlement request schemas live only under `components.schemas`. Generated operation responses contain valid HTTP response keys. The regression suite rejects any non-status response key before release.
