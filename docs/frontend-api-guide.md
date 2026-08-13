# Frontend API Guide

Base URL: `http://localhost:5000` in development.

Authentication: send `Authorization: Bearer <jwt>` for endpoints marked Bearer, Author/Admin, or Admin.

## GET /health

Purpose: Health check.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/health`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/health', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/health', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `System`.

## GET /api/content

Purpose: Get global CMS content.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/content`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/content', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/content', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Content`.

## POST /api/auth/register

Purpose: Register user.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `RegisterRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/register`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/register', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/register', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/login

Purpose: Login user.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `LoginRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/login`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/login', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/login', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/google

Purpose: Login or sign up with Google Identity Services credential.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `GoogleLoginRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/google`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/google', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/google', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/refresh

Purpose: Refresh access token using refresh token or bearer fallback.

Authentication: Public/Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `RefreshTokenRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/refresh', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/refresh', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/logout

Purpose: Logout and revoke refresh session.

Authentication: Public/Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `LogoutRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/logout', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/logout', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/forgot-password

Purpose: Request password reset token.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `ForgotPasswordRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/forgot-password`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/forgot-password', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/forgot-password', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## GET /api/auth/me

Purpose: Get current user.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/me`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/auth/me', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/me', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## PUT /api/auth/reset-password/{token}

Purpose: Reset password with token.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `token`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ResetPasswordRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/reset-password/:token`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/auth/reset-password/:token', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/reset-password/:token', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/reset-password/{token}

Purpose: Reset password with token alias.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `token`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ResetPasswordRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/reset-password/:token`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/reset-password/:token', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/reset-password/:token', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## PUT /api/auth/change-password

Purpose: Change current user password.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `ChangePasswordRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/change-password`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/auth/change-password', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/change-password', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## POST /api/auth/change-password

Purpose: Change current user password alias.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `ChangePasswordRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/auth/change-password`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/auth/change-password', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/auth/change-password', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authentication`.

## GET /api/books

Purpose: List books.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `category`: optional query parameter.
- `minPrice`: optional query parameter.
- `maxPrice`: optional query parameter.
- `sort`: optional query parameter.
- `featured`: optional query parameter.
- `bestseller`: optional query parameter.
- `newRelease`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/books`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/books', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## GET /api/books/{slug}

Purpose: Get book by slug.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/books/:slug`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/books/:slug', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/books/:slug', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## GET /api/books/{slug}/related

Purpose: Get related books.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/books/:slug/related`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/books/:slug/related', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/books/:slug/related', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## POST /api/books/{slug}/reviews

Purpose: Create book review.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ReviewRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/books/:slug/reviews`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/books/:slug/reviews', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/books/:slug/reviews', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## PUT /api/books/{slug}/reviews/{reviewId}

Purpose: Update book review.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.
- `reviewId`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ReviewRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/books/:slug/reviews/:reviewId`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/books/:slug/reviews/:reviewId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/books/:slug/reviews/:reviewId', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## DELETE /api/books/{slug}/reviews/{reviewId}

Purpose: Delete book review.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.
- `reviewId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/books/:slug/reviews/:reviewId`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/books/:slug/reviews/:reviewId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/books/:slug/reviews/:reviewId', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## GET /api/search

Purpose: Search books.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `q`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/search`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/search', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/search', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Books`.

## GET /api/categories

Purpose: List categories.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `featured`: optional query parameter.
- `active`: optional query parameter.
- `search`: optional query parameter.
- `sort`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/categories`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/categories', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/categories', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Categories`.

## GET /api/categories/{slug}

Purpose: Get category by slug.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/categories/:slug`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/categories/:slug', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/categories/:slug', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Categories`.

## GET /api/categories/{slug}/books

Purpose: List books by category.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `slug`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `sort`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/categories/:slug/books`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/categories/:slug/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/categories/:slug/books', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Categories`.

## POST /api/orders

Purpose: Create order with payment, inventory, QR bridge.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `OrderCreateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/orders`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/orders', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/orders', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Orders`.

## PUT /api/orders/{id}/verify-payment

Purpose: Verify order payment reference.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `PaymentVerificationRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/orders/:id/verify-payment`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/orders/:id/verify-payment', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/orders/:id/verify-payment', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Orders`.

## DELETE /api/orders/{id}

Purpose: Cancel order.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/orders/:id`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/orders/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/orders/:id', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Orders`.

## GET /api/orders/{id}/shipment

Purpose: Get order shipment.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/orders/:id/shipment`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/orders/:id/shipment', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/orders/:id/shipment', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Orders`.

## GET /api/orders/{id}/tracking

Purpose: Get order tracking.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/orders/:id/tracking`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/orders/:id/tracking', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/orders/:id/tracking', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Orders`.

## GET /api/orders/track/{orderNumber}

Purpose: Track order by order number.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `orderNumber`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/orders/track/:orderNumber`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/orders/track/:orderNumber', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/orders/track/:orderNumber', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Orders`.

## POST /api/uploads/image

Purpose: Upload image.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `MultipartImageRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/uploads/image', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/uploads/image', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Uploads`.

## POST /api/uploads/document

Purpose: Upload document.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `MultipartDocumentRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/uploads/document`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/uploads/document', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/uploads/document', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Uploads`.

## GET /api/users/me

Purpose: Get current user profile.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/me`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/me', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/me', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/stats

Purpose: Get user stats.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/stats`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/stats', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/stats', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## PUT /api/users/{id}

Purpose: Update user profile.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `UserUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/users/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/me/author-application

Purpose: Get current user author application.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/me/author-application`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/me/author-application', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/me/author-application', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/orders/{orderId}/payments

Purpose: Get payment attempts for a user order.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `orderId`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/orders/:orderId/payments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/orders/:orderId/payments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/orders/:orderId/payments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/payments

Purpose: Get user payment attempts.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `status`: optional query parameter.
- `order`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/payments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/payments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/payments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/payments/{paymentId}

Purpose: Get user payment detail including active QR metadata.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `paymentId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/payments/:paymentId`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/payments/:paymentId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/payments/:paymentId', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/invoices

Purpose: Get user invoices.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `status`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/invoices`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/invoices', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/invoices', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/invoices/{invoiceId}

Purpose: Get user invoice.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `invoiceId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/invoices/:invoiceId`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/invoices/:invoiceId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/invoices/:invoiceId', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/invoices/{invoiceId}/download

Purpose: Download user invoice.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `invoiceId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/invoices/:invoiceId/download`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/invoices/:invoiceId/download', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/invoices/:invoiceId/download', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/shipments

Purpose: Get user shipments.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `status`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/shipments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/shipments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/shipments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/shipments/{shipmentId}

Purpose: Get user shipment detail.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `shipmentId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/shipments/:shipmentId`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/shipments/:shipmentId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/shipments/:shipmentId', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/notifications

Purpose: Get user notifications.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `status`: optional query parameter.
- `unread`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/notifications`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/notifications', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/notifications', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## PATCH /api/users/{id}/notifications/read-all

Purpose: Mark all user notifications as read.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PATCH', url: '/api/users/:id/notifications/read-all', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/notifications/read-all', options: Options(method: 'PATCH', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## PATCH /api/users/{id}/notifications/{notificationId}/read

Purpose: Mark user notification as read.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `notificationId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/notifications/:notificationId/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PATCH', url: '/api/users/:id/notifications/:notificationId/read', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/notifications/:notificationId/read', options: Options(method: 'PATCH', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/notifications/{notificationId}

Purpose: Get user notification detail.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `notificationId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/notifications/:notificationId`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/notifications/:notificationId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/notifications/:notificationId', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## DELETE /api/users/{id}/notifications/{notificationId}

Purpose: Archive user notification.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `notificationId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/notifications/:notificationId`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/users/:id/notifications/:notificationId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/notifications/:notificationId', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/wishlist

Purpose: Get user wishlist.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/wishlist`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/wishlist', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/wishlist', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/users/{id}/library

Purpose: Get user library.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/library`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/:id/library', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/library', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## POST /api/users/{id}/wishlist

Purpose: Add book to wishlist.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `WishlistRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/wishlist`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/users/:id/wishlist', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/wishlist', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## DELETE /api/users/{id}/wishlist/{bookId}

Purpose: Remove book from wishlist.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.
- `bookId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/:id/wishlist/:bookId`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/users/:id/wishlist/:bookId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/:id/wishlist/:bookId', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/authors

Purpose: List authors.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authors`.

## GET /api/authors/{id}

Purpose: Get author.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authors`.

## GET /api/authors/{id}/books

Purpose: Get author books.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `sort`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/:id/books`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/:id/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/:id/books', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authors`.

## GET /api/authors/{id}/stats

Purpose: Get author stats.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/:id/stats`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/:id/stats', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/:id/stats', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authors`.

## GET /api/authors/{id}/analytics

Purpose: Get author analytics alias.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/:id/analytics`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/:id/analytics', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/:id/analytics', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Authors`.

## GET /api/authors/me/dashboard-access

Purpose: Get current author dashboard access status.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/dashboard-access`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/dashboard-access', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/dashboard-access', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Access`.

## POST /api/authors/me/dashboard-access/purchase

Purpose: Initiate author dashboard plan purchase.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/dashboard-access/purchase`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/authors/me/dashboard-access/purchase', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/dashboard-access/purchase', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Access`.

## PUT /api/authors/me/dashboard-access/purchases/{purchaseId}/verify-payment

Purpose: Submit UTR for author access purchase.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `purchaseId`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `PaymentVerificationRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/dashboard-access/purchases/:purchaseId/verify-payment`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/authors/me/dashboard-access/purchases/:purchaseId/verify-payment', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/dashboard-access/purchases/:purchaseId/verify-payment', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Access`.

## GET /api/authors/me/dashboard

Purpose: Get authenticated author dashboard metrics summary.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/dashboard`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/dashboard', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/dashboard', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Dashboard`.

## GET /api/authors/me/analytics

Purpose: Get authenticated author sales time-series analytics.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `range`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/analytics`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/analytics', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/analytics', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Dashboard`.

## GET /api/authors/me/books/performance

Purpose: Get authenticated author book performance breakdown.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books/performance`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/books/performance', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books/performance', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Dashboard`.

## GET /api/authors/me/royalties

Purpose: Get authenticated author paginated royalty history.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `bookId`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/royalties`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/royalties', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/royalties', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Dashboard`.

## GET /api/authors/me/books

Purpose: List author owned book drafts.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `status`: optional query parameter.
- `search`: optional query parameter.
- `sort`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## POST /api/authors/me/books

Purpose: Create author book draft.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `AuthorBookCreateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/authors/me/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## GET /api/authors/me/books/{bookId}

Purpose: Get author owned book detail.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `bookId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books/:bookId`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/books/:bookId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books/:bookId', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## PUT /api/authors/me/books/{bookId}

Purpose: Update author book draft.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `bookId`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `AuthorBookUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books/:bookId`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/authors/me/books/:bookId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books/:bookId', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## DELETE /api/authors/me/books/{bookId}

Purpose: Delete author book draft.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `bookId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books/:bookId`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/authors/me/books/:bookId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books/:bookId', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## POST /api/authors/me/books/{bookId}/submit

Purpose: Submit author book for editorial review.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `bookId`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `BookSubmissionRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/books/:bookId/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/authors/me/books/:bookId/submit', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/books/:bookId/submit', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## POST /api/authors/me/uploads/document

Purpose: Upload author manuscript document.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `MultipartDocumentRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/uploads/document`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/authors/me/uploads/document', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/uploads/document', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## POST /api/authors/me/uploads/image

Purpose: Upload author book cover image.

Authentication: Author.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `MultipartImageRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/authors/me/uploads/image', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/uploads/image', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Author Publishing`.

## POST /api/uploads/publishing-document

Purpose: Upload publishing manuscript document.

Authentication: Author/Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `MultipartDocumentRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/uploads/publishing-document`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/uploads/publishing-document', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/uploads/publishing-document', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Uploads`.

## POST /api/uploads/publishing-image

Purpose: Upload publishing cover image.

Authentication: Author/Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `MultipartImageRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/uploads/publishing-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/uploads/publishing-image', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/uploads/publishing-image', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Uploads`.

## POST /api/publish-requests

Purpose: Create publish request.

Authentication: Author/Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `PublishRequestCreate`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/publish-requests`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/publish-requests', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/publish-requests', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Publishing`.

## GET /api/publish-packages

Purpose: List publish packages.

Authentication: Public.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/publish-packages`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/publish-packages', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/publish-packages', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Publishing`.

## GET /api/admin/analytics

Purpose: Admin analytics summary.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## GET /api/admin/reviews

Purpose: List reviews for moderation.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `status`: optional query parameter.
- `book`: optional query parameter.
- `user`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/reviews`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/reviews', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/reviews', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## PATCH /api/admin/reviews/{id}/status

Purpose: Moderate review.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ReviewModerationRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/reviews/:id/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PATCH', url: '/api/admin/reviews/:id/status', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/reviews/:id/status', options: Options(method: 'PATCH', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## DELETE /api/admin/reviews/{id}

Purpose: Delete review as admin.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/reviews/:id`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/admin/reviews/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/reviews/:id', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## PUT /api/admin/content

Purpose: Update global CMS content.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `ContentUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/content`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/content', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/content', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Content`.

## GET /api/admin/users

Purpose: List users.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `role`: optional query parameter.
- `isActive`: optional query parameter.
- `search`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/users', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## GET /api/admin/users/{id}

Purpose: Get user.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/users/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## PUT /api/admin/users/{id}

Purpose: Update user.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `AdminUserUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users/:id`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/users/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users/:id', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## PATCH /api/admin/users/{id}/role

Purpose: Update user role.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `UserRoleRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users/:id/role`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PATCH', url: '/api/admin/users/:id/role', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users/:id/role', options: Options(method: 'PATCH', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## PUT /api/admin/users/{id}/role

Purpose: Update user role alias.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `UserRoleRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users/:id/role`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/users/:id/role', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users/:id/role', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## PATCH /api/admin/users/{id}/status

Purpose: Update user active status.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `UserStatusRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users/:id/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PATCH', url: '/api/admin/users/:id/status', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users/:id/status', options: Options(method: 'PATCH', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## POST /api/admin/users/{id}/reset-password

Purpose: Reset user password.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ResetPasswordRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/users/:id/reset-password`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/users/:id/reset-password', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/users/:id/reset-password', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Users`.

## GET /api/admin/orders

Purpose: List orders.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/orders`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/orders', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/orders', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## PUT /api/admin/orders/{id}/status

Purpose: Update order status.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `StatusUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/orders/:id/status`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/orders/:id/status', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/orders/:id/status', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## GET /api/admin/publish-requests

Purpose: List publish requests.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/publish-requests`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/publish-requests', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/publish-requests', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## PUT /api/admin/publish-requests/{id}/status

Purpose: Update publish request status.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `StatusUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/publish-requests/:id/status`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/publish-requests/:id/status', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/publish-requests/:id/status', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## POST /api/admin/publish-requests/{id}/request-changes

Purpose: Request changes on publish request.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `EditorialReasonRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/publish-requests/:id/request-changes`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/publish-requests/:id/request-changes', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/publish-requests/:id/request-changes', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## POST /api/admin/publish-requests/{id}/reject

Purpose: Reject publish request.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `EditorialReasonRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/publish-requests/:id/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/publish-requests/:id/reject', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/publish-requests/:id/reject', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## POST /api/admin/publish-requests/{id}/approve

Purpose: Approve publish request and publish book.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `EditorialNotesRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/publish-requests/:id/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/publish-requests/:id/approve', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/publish-requests/:id/approve', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## POST /api/admin/books

Purpose: Create book.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `AdminBookCreateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/books`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/books', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## PUT /api/admin/books/{id}

Purpose: Update book.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `AdminBookUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/books/:id`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/books/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/books/:id', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## DELETE /api/admin/books/{id}

Purpose: Delete book.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/books/:id`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/admin/books/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/books/:id', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Core`.

## GET /api/admin/categories

Purpose: List categories.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `featured`: optional query parameter.
- `active`: optional query parameter.
- `search`: optional query parameter.
- `sort`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/categories`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/categories', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/categories', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Categories`.

## GET /api/admin/categories/{id}

Purpose: Get category.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/categories/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/categories/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/categories/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Categories`.

## POST /api/admin/categories

Purpose: Create category.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `CategoryCreateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/categories`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/categories', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/categories', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Categories`.

## PUT /api/admin/categories/{id}

Purpose: Update category.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `CategoryUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/categories/:id`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/categories/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/categories/:id', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Categories`.

## PATCH /api/admin/categories/{id}/status

Purpose: Update category status.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `CategoryStatusRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/categories/:id/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PATCH', url: '/api/admin/categories/:id/status', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/categories/:id/status', options: Options(method: 'PATCH', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Categories`.

## DELETE /api/admin/categories/{id}

Purpose: Soft delete category.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/categories/:id`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'DELETE', url: '/api/admin/categories/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/categories/:id', options: Options(method: 'DELETE', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Categories`.

## GET /api/admin/author-access/plans

Purpose: List author access plans.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/plans`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/author-access/plans', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/plans', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## POST /api/admin/author-access/plans

Purpose: Create author access plan.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `AuthorAccessPlanRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/plans`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/author-access/plans', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/plans', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## PUT /api/admin/author-access/plans/{id}

Purpose: Update author access plan.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `AuthorAccessPlanRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/plans/:id`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'PUT', url: '/api/admin/author-access/plans/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/plans/:id', options: Options(method: 'PUT', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## POST /api/admin/author-access/plans/{id}/activate

Purpose: Activate author access plan.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/plans/:id/activate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/author-access/plans/:id/activate', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/plans/:id/activate', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## POST /api/admin/author-access/plans/{id}/archive

Purpose: Archive author access plan.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/plans/:id/archive`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/author-access/plans/:id/archive', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/plans/:id/archive', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## GET /api/admin/author-access/purchases

Purpose: List author access purchases.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `userId`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/purchases`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/author-access/purchases', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/purchases', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## GET /api/admin/author-access/entitlements

Purpose: List author entitlements.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `userId`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/entitlements`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/author-access/entitlements', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/entitlements', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## POST /api/admin/author-access/entitlements/grant

Purpose: Admin manual grant author dashboard access.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `AuthorAccessGrantRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/entitlements/grant`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/author-access/entitlements/grant', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/entitlements/grant', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## POST /api/admin/author-access/entitlements/{userId}/revoke

Purpose: Admin revoke author dashboard access.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `userId`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `AuthorAccessReasonRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/entitlements/:userId/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/author-access/entitlements/:userId/revoke', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/entitlements/:userId/revoke', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## POST /api/admin/author-access/entitlements/{userId}/restore

Purpose: Admin restore author dashboard access.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `userId`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `AuthorAccessReasonRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/author-access/entitlements/:userId/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/author-access/entitlements/:userId/restore', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/author-access/entitlements/:userId/restore', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## GET /api/admin/authors/{authorId}/dashboard

Purpose: Admin inspect author dashboard metrics.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `authorId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/authors/:authorId/dashboard`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/authors/:authorId/dashboard', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/authors/:authorId/dashboard', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## GET /api/admin/authors/{authorId}/royalties

Purpose: Admin inspect author royalty history.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `authorId`: path parameter.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `bookId`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/authors/:authorId/royalties`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/authors/:authorId/royalties', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/authors/:authorId/royalties', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Author Access`.

## GET /api/admin/operations/dashboard

Purpose: Operations dashboard.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/dashboard`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/dashboard', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/dashboard', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/search

Purpose: Global operations search.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `q`: optional query parameter.
- `type`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/search`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/search', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/search', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/payments

Purpose: List payments.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/payments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/payments/{id}

Purpose: Payment detail.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/payments/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## POST /api/admin/operations/payments/{id}/approve

Purpose: Approve payment.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `PaymentActionRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/operations/payments/:id/approve', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id/approve', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## POST /api/admin/operations/payments/{id}/reject

Purpose: Reject payment.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `RejectPaymentRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/operations/payments/:id/reject', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id/reject', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## POST /api/admin/operations/payments/{id}/cancel

Purpose: Cancel payment intent.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `PaymentActionRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/operations/payments/:id/cancel', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id/cancel', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## POST /api/admin/operations/payments/{id}/expire

Purpose: Expire payment intent.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `PaymentActionRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id/expire`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/operations/payments/:id/expire', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id/expire', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## POST /api/admin/operations/payments/{id}/retry-verification

Purpose: Retry payment verification.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id/retry-verification`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/operations/payments/:id/retry-verification', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id/retry-verification', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## POST /api/admin/operations/payments/{id}/recreate-qr

Purpose: Recreate payment QR.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `QRRegenerateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/payments/:id/recreate-qr`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/operations/payments/:id/recreate-qr', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/payments/:id/recreate-qr', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/inventory/reservations

Purpose: List inventory reservations.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `order`: optional query parameter.
- `payment`: optional query parameter.
- `book`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/inventory/reservations`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/inventory/reservations', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/inventory/reservations', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/inventory/low-stock

Purpose: List low stock books.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `threshold`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `category`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/inventory/low-stock`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/inventory/low-stock', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/inventory/low-stock', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/ledger/payments

Purpose: List payment ledger.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `paymentId`: optional query parameter.
- `orderId`: optional query parameter.
- `userId`: optional query parameter.
- `eventType`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/ledger/payments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/ledger/payments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/ledger/payments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/ledger/inventory

Purpose: List inventory ledger.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `reservation`: optional query parameter.
- `order`: optional query parameter.
- `payment`: optional query parameter.
- `book`: optional query parameter.
- `eventType`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/ledger/inventory`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/ledger/inventory', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/ledger/inventory', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/operations/ledger/timeline

Purpose: Combined ledger timeline.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `orderId`: optional query parameter.
- `paymentId`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/operations/ledger/timeline`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/operations/ledger/timeline', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/operations/ledger/timeline', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/invoices/search

Purpose: Search invoices.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `q`: optional query parameter.
- `search`: optional query parameter.
- `status`: optional query parameter.
- `customer`: optional query parameter.
- `order`: optional query parameter.
- `payment`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/invoices/search`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/invoices/search', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/invoices/search', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Invoices`.

## GET /api/admin/invoices

Purpose: List invoices.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `customer`: optional query parameter.
- `order`: optional query parameter.
- `payment`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/invoices`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/invoices', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/invoices', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Invoices`.

## GET /api/admin/invoices/{id}/download

Purpose: Download invoice document.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/invoices/:id/download`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/invoices/:id/download', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/invoices/:id/download', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Invoices`.

## GET /api/admin/invoices/{id}

Purpose: Get invoice.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/invoices/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/invoices/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/invoices/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Invoices`.

## GET /api/admin/notifications/search

Purpose: Search notifications.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `q`: optional query parameter.
- `search`: optional query parameter.
- `status`: optional query parameter.
- `channel`: optional query parameter.
- `eventType`: optional query parameter.
- `user`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/notifications/search`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/notifications/search', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/notifications/search', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Notifications`.

## GET /api/admin/notifications

Purpose: List notifications.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `channel`: optional query parameter.
- `eventType`: optional query parameter.
- `user`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/notifications`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/notifications', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/notifications', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Notifications`.

## GET /api/admin/notifications/{id}

Purpose: Get notification.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/notifications/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/notifications/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/notifications/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Notifications`.

## POST /api/admin/notifications/{id}/retry

Purpose: Retry failed notification.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `NotificationRetryRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/notifications/:id/retry`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/notifications/:id/retry', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/notifications/:id/retry', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Notifications`.

## GET /api/admin/shipments/search

Purpose: Search shipments.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `q`: optional query parameter.
- `search`: optional query parameter.
- `status`: optional query parameter.
- `customer`: optional query parameter.
- `order`: optional query parameter.
- `payment`: optional query parameter.
- `invoice`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments/search`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/shipments/search', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments/search', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## GET /api/admin/shipments

Purpose: List shipments.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `status`: optional query parameter.
- `customer`: optional query parameter.
- `order`: optional query parameter.
- `payment`: optional query parameter.
- `invoice`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `from`: optional query parameter.
- `to`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/shipments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## GET /api/admin/shipments/{id}/tracking

Purpose: Get shipment tracking.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments/:id/tracking`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/shipments/:id/tracking', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments/:id/tracking', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## GET /api/admin/shipments/{id}

Purpose: Get shipment.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/shipments/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## POST /api/admin/shipments/{id}/assign-courier

Purpose: Assign courier.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `CourierAssignRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments/:id/assign-courier`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/shipments/:id/assign-courier', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments/:id/assign-courier', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## POST /api/admin/shipments/{id}/update-status

Purpose: Update shipment status.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `StatusUpdateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments/:id/update-status`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/shipments/:id/update-status', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments/:id/update-status', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## POST /api/admin/shipments/{id}/cancel

Purpose: Cancel shipment.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `ShipmentCancelRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/shipments/:id/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/shipments/:id/cancel', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/shipments/:id/cancel', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Shipments`.

## GET /api/admin/analytics/dashboard

Purpose: Analytics dashboard.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `period`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/dashboard`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/dashboard', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/dashboard', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/admin/analytics/revenue

Purpose: Revenue report.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `period`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/revenue`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/revenue', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/revenue', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/admin/analytics/books

Purpose: Book sales report.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.
- `sort`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/books`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/books', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/books', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/admin/analytics/payments

Purpose: Payment metrics.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/payments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/payments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/payments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/admin/analytics/inventory

Purpose: Inventory metrics.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/inventory`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/inventory', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/inventory', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/admin/analytics/shipments

Purpose: Shipment metrics.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/shipments`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/shipments', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/shipments', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/admin/analytics/customers

Purpose: Customer metrics.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `from`: optional query parameter.
- `to`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/analytics/customers`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/analytics/customers', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/analytics/customers', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Analytics`.

## GET /api/users/me/context

Purpose: Get current user session context & capabilities.

Authentication: Bearer.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/users/me/context`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/users/me/context', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/users/me/context', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Users`.

## GET /api/authors/me/royalty-settlements

Purpose: List author royalty settlements.

Authentication: Bearer (Author Entitled).

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/royalty-settlements`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/royalty-settlements', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/royalty-settlements', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## GET /api/authors/me/royalty-settlements/{id}

Purpose: Get author settlement detail.

Authentication: Bearer (Author Entitled).

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/authors/me/royalty-settlements/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/authors/me/royalty-settlements/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/authors/me/royalty-settlements/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## GET /api/admin/dashboard

Purpose: Get admin operational dashboard overview.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/dashboard`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/dashboard', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/dashboard', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/authors/{authorId}

Purpose: Get admin author detail profile.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `authorId`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/authors/:authorId`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/authors/:authorId', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/authors/:authorId', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Admin Operations`.

## GET /api/admin/royalty-settlements/reconcile

Purpose: Reconcile royalty settlements and payouts.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements/reconcile`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/royalty-settlements/reconcile', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements/reconcile', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## POST /api/admin/royalty-settlements/preview

Purpose: Preview royalty settlement batch.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `SettlementPreviewRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements/preview`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/royalty-settlements/preview', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements/preview', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## POST /api/admin/royalty-settlements

Purpose: Create draft royalty settlement batch.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- None.

Request Body: Uses schema `SettlementCreateRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/royalty-settlements', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## GET /api/admin/royalty-settlements

Purpose: List royalty settlements for admin.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- None.

Query Parameters:
- `authorId`: optional query parameter.
- `status`: optional query parameter.
- `page`: optional query parameter.
- `limit`: optional query parameter.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/royalty-settlements', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## GET /api/admin/royalty-settlements/{id}

Purpose: Get settlement detail for admin.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements/:id`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'GET', url: '/api/admin/royalty-settlements/:id', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements/:id', options: Options(method: 'GET', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## POST /api/admin/royalty-settlements/{id}/approve

Purpose: Approve draft royalty settlement batch.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: No request body.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements/:id/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/royalty-settlements/:id/approve', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements/:id/approve', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## POST /api/admin/royalty-settlements/{id}/mark-paid

Purpose: Record manual payout for approved settlement.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `SettlementMarkPaidRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements/:id/mark-paid`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/royalty-settlements/:id/mark-paid', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements/:id/mark-paid', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.

## POST /api/admin/royalty-settlements/{id}/cancel

Purpose: Cancel royalty settlement batch.

Authentication: Admin.

Headers: `Authorization: Bearer <token>` when protected; `Content-Type: application/json` unless multipart upload.

Path Parameters:
- `id`: path parameter.

Query Parameters:
- None.

Request Body: Uses schema `SettlementCancelRequest`.

Validation Rules: See `docs/openapi.yaml` request body schema and runtime validators/controllers.

Success Response:
```json
{ "success": true, "data": {} }
```

Error Response:
```json
{ "success": false, "message": "Error message" }
```

Status Codes: 200, 201 where created, 400, 401, 403, 404, 429, 500.

Frontend Integration Notes: Keep the response envelope checks defensive because some legacy auth errors return `status: "error"`.

Example Fetch Request:
```js
await fetch(`${API_BASE_URL}/api/admin/royalty-settlements/:id/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

Example Axios Request:
```js
await axios.request({ method: 'POST', url: '/api/admin/royalty-settlements/:id/cancel', headers: { Authorization: `Bearer ${token}` } });
```

Example Flutter Dio Request:
```dart
await dio.request('/api/admin/royalty-settlements/:id/cancel', options: Options(method: 'POST', headers: {'Authorization': 'Bearer $token'}));
```

Common Mistakes: Missing bearer token on protected endpoints, sending invalid ObjectId values, or assuming admin endpoints are customer-accessible.

Related APIs: See endpoints with tag `Royalty Settlements`.
