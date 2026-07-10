# Category Management Engine

## Architecture

The Category domain follows the existing backend architecture:

`Category Model -> CategoryRepository -> CategoryService -> CategoryController -> Public/Admin Routes`

Controllers remain thin and do not access Mongoose models directly. Persistence lives in `CategoryRepository`; business rules live in `CategoryService`.

## Model

`Category` supports production catalog fields:

- `name`, `slug`, `description`, `shortDescription`
- `image`, `banner`, `icon`
- `seoTitle`, `seoDescription`
- `parentCategory`
- `sortOrder`, `bookCount`, `featured`
- `active` and legacy-compatible `isActive`
- `metadata`

Indexes cover `slug`, `name`, `featured`, `active`, and `sortOrder`.

## Public APIs

- `GET /api/categories`
- `GET /api/categories/:slug`
- `GET /api/categories/:slug/books`

Public APIs return only active categories by default and support pagination, sorting, featured filtering, active filtering, search, and book counts.

## Admin APIs

- `GET /api/admin/categories`
- `GET /api/admin/categories/:id`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id/status`
- `DELETE /api/admin/categories/:id`

Admin APIs reuse the existing admin authentication and authorization stack.

## Business Rules

- Category names and slugs must be unique.
- Slugs are generated from names when omitted.
- Deletion is soft-only by setting `active` and `isActive` to `false`.
- Categories with active books cannot be deleted.
- `bookCount` is system-managed and refreshed by the service.
- Parent categories, featured categories, and SEO fields are supported.

## Events

The service publishes lifecycle events through the existing Event Bus:

- `CategoryCreated`
- `CategoryUpdated`
- `CategoryDeleted`
- `CategoryActivated`
- `CategoryDeactivated`

## Search

Public category search is available through `GET /api/categories?search=...`.
Admin global operations search includes categories as an additive response field.

## Analytics

The Analytics Engine now includes category sales metrics by aggregating existing `InventoryDeducted` projections through books and categories. No payment, inventory, or order business logic was changed.

## Backward Compatibility

Existing Book APIs are unchanged. `Book.category` remains an ObjectId reference to `Category`. The legacy `isActive` category field is retained and synchronized with the new `active` field.
