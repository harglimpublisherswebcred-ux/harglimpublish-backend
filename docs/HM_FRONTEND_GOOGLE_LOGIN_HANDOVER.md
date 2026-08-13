# HM Frontend Google Login Handover

**Document:** HM Frontend Google Login Handover  
**Generated from repository:** `C:/Users/user/hm_backend`  
**Branch:** `main`  
**HEAD:** `6d437ad4cde316f1a00e7d5e2b911b45a359c053`  
**Generated:** 2026-08-12  
**Status:** AUTHORITATIVE GOOGLE LOGIN FRONTEND INTEGRATION HANDOVER

This document is generated from the actual backend repository, not copied from stale handover text. Runtime code, tests, OpenAPI, API inventory, and generated Postman artifacts were inspected.

## 1. Purpose

This file gives frontend developers a complete, standalone integration contract for HM Google Login. A frontend can implement Google Sign-In without reading backend source code.

Google Login is an authentication entry point only. After successful Google authentication, the user becomes a normal HM-authenticated user with the same HM access token, refresh token, session, role, and capability bootstrap flow used by password login.

## 2. Feature Status

Google Login is implemented in the backend at:

```http
POST /api/auth/google
```

Current status:

| Area | Status |
| --- | --- |
| Google endpoint | Implemented |
| Server-side Google ID token verification | Implemented |
| `GOOGLE_CLIENT_ID` audience check | Implemented |
| Normal HM JWT/session reuse | Implemented |
| New Google user role | `reader` |
| Existing email collision protection | `ACCOUNT_LINK_REQUIRED` |
| Account linking API | Not implemented |
| Google access token storage | Not implemented |
| Google Drive/Gmail/Calendar access | Not implemented |

## 3. Architecture

The Google Login flow fits into the existing HM authentication architecture:

```text
Google Identity Services frontend button
  -> frontend receives Google credential
  -> POST /api/auth/google
  -> authController.googleLogin
  -> authService.loginWithGoogle
  -> googleIdentityProvider.verifyCredential
  -> AuthIdentity lookup/create
  -> User lookup/create
  -> authService.issueTokens
  -> AuthSession + HM access token + HM refresh token
  -> frontend calls GET /api/users/me/context
```

Important backend files:

| Purpose | File |
| --- | --- |
| Route | `src/routes/authRoutes.js` |
| Controller | `src/controllers/authController.js` |
| Business flow | `src/services/authService.js` |
| Google verifier | `src/services/googleIdentityProvider.js` |
| Persistence | `src/repositories/authRepository.js` |
| HM user | `src/models/User.js` |
| HM session | `src/models/AuthSession.js` |
| Provider identity | `src/models/AuthIdentity.js` |
| Request validation | `src/validators/authValidator.js` |
| User context bootstrap | `src/services/userContextService.js` |

## 4. Google vs HM Responsibility

Google proves identity only. HM remains authoritative for authorization.

| Concern | Source of truth |
| --- | --- |
| Email identity | Verified Google ID token |
| Google subject / identity key | Verified Google ID token `sub` |
| HM user ID | HM backend |
| HM role | HM backend |
| Admin privilege | HM backend |
| Author approval | HM backend |
| Publishing permission | HM backend |
| Dashboard entitlement | HM backend |
| Payment state | HM backend |
| Royalty/settlement state | HM backend |

Frontend must not derive role, admin access, author access, dashboard access, or route permissions from the Google credential.

## 5. Environment Configuration

Backend requires:

```env
GOOGLE_CLIENT_ID=CHANGE_ME_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

This is used by `googleIdentityProvider.verifyCredential()` to verify the Google ID token `aud` claim.

Frontend also needs the same Google Web Client ID through its own public configuration mechanism. Examples:

```env
VITE_GOOGLE_CLIENT_ID=CHANGE_ME_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

or, for Next.js-style naming:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=CHANGE_ME_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

Frontend uses the Client ID to initialize Google Identity Services. Backend uses the same Client ID to verify the Google ID token audience. Google Client ID is not the same as Google Client Secret, and the frontend must never contain a Google client secret.

Frontend API base URL must also come from the frontend application's environment/configuration mechanism:

```env
VITE_API_BASE_URL=https://api.example.com
```

or:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

Use the frontend application's existing environment/configuration mechanism. Do not hard-code production backend URLs in reusable API-client source files. Local, staging, and production may each use different API base URLs.

Do not expose backend secrets to frontend. Never expose `JWT_SECRET`, `MONGODB_URI`, Cloudinary secret, email provider secret, or `.env`.

API paths remain stable and are appended to the configured API base URL:

```text
/api/auth/google
/api/auth/login
/api/auth/refresh
/api/auth/logout
/api/users/me/context
```

Current production deployment example:

```text
https://harglimpublish-backend.onrender.com
```

Treat this as a deployment example only, not a value to hard-code into source.

## 6. Google Identity Services Frontend Flow

Frontend flow:

```text
Render Google Identity Services button
  -> user selects Google account
  -> Google returns credential
  -> frontend sends credential to HM backend
  -> HM verifies credential server-side
  -> HM returns HM tokens
  -> frontend stores HM session
  -> frontend calls /api/users/me/context
  -> frontend routes by HM capabilities
```

The Google credential is not an HM bearer token. Never call HM APIs with:

```http
Authorization: Bearer <GOOGLE_ID_TOKEN>
```

Use the HM access token returned by `POST /api/auth/google`.

### Google Cloud Console - OAuth Web Client Configuration

Create or use a Google OAuth client with:

```text
Application type: Web application
Suggested name: HM Web - Google Login
```

The name is only for identifying the client in Google Cloud Console.

Authorized JavaScript origins must include every frontend browser origin actually used by developers, staging, and production. An origin is `scheme + host + port`, so these are different origins:

```text
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
https://example.com
```

Development examples:

```text
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
```

Staging example:

```text
https://staging.example.com
```

Production examples:

```text
https://example.com
https://www.example.com
```

Only add origins the frontend actually uses. Do not add backend API endpoints as JavaScript origins unless the browser actually serves the frontend application from that origin.

Authorized redirect URIs for the current HM implementation:

```text
Leave empty
```

Current implementation:

```text
Google Identity Services callback/popup flow
Google button
-> browser receives Google credential
-> frontend callback receives credential
-> frontend POSTs credential to /api/auth/google
```

Not implemented:

```text
server OAuth callback/redirect flow
```

Do not add these as OAuth redirect URIs for the current implementation:

```text
http://localhost:<backend-port>/api/auth/google
https://api.example.com/api/auth/google
```

If HM later changes to a redirect-based OAuth flow, redirect URIs can be configured then.

## 7. Google Login Endpoint

```http
POST /api/auth/google
Content-Type: application/json
```

Authentication: public.

Rate limiting: mounted under the auth route limiter. In production, auth routes use the stricter auth limiter.

## 8. Request Contract

Exact request body:

```json
{
  "credential": "<GOOGLE_ID_TOKEN>"
}
```

Validation:

| Field | Required | Type | Rule |
| --- | --- | --- | --- |
| `credential` | Yes | string | trim, non-empty, max length 4096 |

Forbidden fields:

```text
role
email
googleId
providerSubject
author
admin
dashboardEntitlement
```

If any forbidden field is sent, the backend returns `400` with validation errors.

## 9. Success Contract

Success HTTP status: `200`.

Representative response:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "66b4f5a2a44d2c0012a9c101",
      "name": "Google Reader",
      "email": "reader@example.com",
      "role": "reader"
    },
    "token": "HM_ACCESS_TOKEN",
    "refreshToken": "HM_REFRESH_TOKEN",
    "refreshTokenExpiresAt": "2026-09-11T00:00:00.000Z"
  }
}
```

The response shape is the same shape returned by password login.

## 10. Normal Password vs Google Login

Both flows converge into one HM session:

```text
POST /api/auth/login
  -> authService.login
  -> authService.issueTokens

POST /api/auth/google
  -> authService.loginWithGoogle
  -> authService.issueTokens
```

Do not create separate frontend auth stores for Google users. Store HM auth result exactly like password login.

## 11. HM Session Handling

`authService.issueTokens()` creates:

| Field | Behavior |
| --- | --- |
| `token` | HM JWT access token generated from HM user `_id` |
| `refreshToken` | Random 48-byte token returned to frontend |
| `refreshTokenExpiresAt` | Session expiry timestamp |
| `AuthSession.refreshTokenHash` | SHA-256 hash of refresh token, stored server-side |
| `AuthSession.userAgent` | Request user-agent |
| `AuthSession.ipAddress` | Request IP |
| `AuthSession.expiresAt` | Refresh expiry |
| `AuthSession.revokedAt` | Set on logout/rotation |

Refresh token default lifetime is controlled by `JWT_REFRESH_EXPIRE_DAYS` if present, otherwise 30 days.

## 12. Refresh Handling

Endpoint:

```http
POST /api/auth/refresh
Content-Type: application/json
```

Body:

```json
{
  "refreshToken": "HM_REFRESH_TOKEN"
}
```

Behavior:

- Backend hashes the supplied refresh token.
- Looks up `AuthSession`.
- Rejects missing, revoked, or expired sessions.
- Issues a new HM access token and refresh token.
- Marks the previous session as replaced/revoked.

Google-authenticated HM sessions use this same flow.

## 13. Logout Handling

Endpoint:

```http
POST /api/auth/logout
Content-Type: application/json
```

Logout one session:

```json
{
  "refreshToken": "HM_REFRESH_TOKEN"
}
```

Logout all sessions for the authenticated HM user:

```json
{
  "all": true
}
```

Frontend should clear HM access token, HM refresh token, cached user context, and private state. Backend logout does not require server-side Google logout.

## 14. `/api/auth/me`

Endpoint:

```http
GET /api/auth/me
Authorization: Bearer <HM_ACCESS_TOKEN>
```

After Google Login, this works like password login. It returns:

```json
{
  "success": true,
  "data": {
    "_id": "66b4f5a2a44d2c0012a9c101",
    "name": "Google Reader",
    "email": "reader@example.com",
    "role": "reader",
    "profilePicture": "https://example.com/avatar.jpg",
    "isActive": true
  }
}
```

The exact `data` object may include normal user model fields except password.

## 15. `/api/users/me/context`

Endpoint:

```http
GET /api/users/me/context
Authorization: Bearer <HM_ACCESS_TOKEN>
```

This is the frontend authorization bootstrap. Call it after Google Login and after password login.

Representative response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "66b4f5a2a44d2c0012a9c101",
      "_id": "66b4f5a2a44d2c0012a9c101",
      "name": "Google Reader",
      "email": "reader@example.com",
      "role": "reader",
      "isActive": true,
      "profilePicture": "https://example.com/avatar.jpg",
      "createdAt": "2026-08-12T00:00:00.000Z"
    },
    "capabilities": {
      "canPublish": false,
      "canAccessAuthorDashboard": false,
      "canAdminister": false
    },
    "states": {
      "authorApplicationStatus": "NOT_APPLIED",
      "dashboardAccessStatus": "NOT_AUTHOR",
      "publishingStatus": "NOT_APPROVED"
    }
  }
}
```

Capability rules from code:

| Role/state | `canPublish` | `canAccessAuthorDashboard` | `canAdminister` |
| --- | --- | --- | --- |
| reader | false | false | false |
| author, no active entitlement | true | false | false |
| author, active entitlement | true | true | false |
| admin | true | true | true |

## 16. New Google User

If Google credential is valid, Google `sub` is not stored, and verified Google email does not collide with an HM user:

- Backend creates a new `User`.
- `role` is always `reader`.
- `name` comes from verified Google payload name or email.
- `email` comes from verified Google payload email.
- `profilePicture` comes from verified Google payload picture if present.
- `password` is absent.
- Backend creates `AuthIdentity`.
- Backend creates `AuthSession`.
- Backend returns normal HM tokens.

Security invariant:

```text
NEW GOOGLE USER -> reader
```

## 17. Returning Google User

If `AuthIdentity(provider=GOOGLE, providerSubject=<google sub>)` exists:

- Backend loads the mapped HM user.
- Role is preserved.
- Admin remains admin only if the mapped HM user was already admin.
- Author remains author only if the mapped HM user was already author.
- Dashboard entitlement is not changed.
- AuthorApplication state is not changed.
- Payment, royalty, and settlement state are not changed.
- Backend updates safe identity metadata: provider email, email verified flag, profile picture, last login timestamp.
- Backend issues a new normal HM session/token pair.

## 18. Google-Only User

Google-only users have no password in the HM `User` document.

Password login behavior:

```text
POST /api/auth/login
email = Google-only account email
password = anything
-> 401 Invalid credentials
```

Forgot/reset password behavior from code:

- `POST /api/auth/forgot-password` can generate a reset token for an existing user.
- `POST` or `PUT /api/auth/reset-password/:token` can set a password if a valid reset token exists.
- That means a Google-only user may later gain a local password through the existing reset-password mechanism if they can complete that flow.

Important distinction:

```text
A Google-only HM account setting a local password
IS NOT
the same thing as linking Google to a different existing HM account.
```

Example A - same HM account:

```text
Google-only HM User
-> user owns that HM account
-> reset-password flow succeeds
-> same HM User now also has a local password
```

This does not merge users. This does not create a second HM account. This does not change the Google `AuthIdentity` mapping.

Change-password behavior:

- `POST` or `PUT /api/auth/change-password` requires the current password.
- Google-only accounts without a password cannot pass current-password validation.

## 19. Existing Email Collision

If an HM user already exists with the verified Google email, but there is no matching Google `AuthIdentity`, backend does not auto-link.

Response:

```http
409 Conflict
```

```json
{
  "success": false,
  "error": "ACCOUNT_LINK_REQUIRED",
  "message": "An HM account already exists for this email. Sign in to the existing account before linking Google."
}
```

Frontend UX:

- Tell the user an HM account already exists for this email.
- Ask them to sign in with their existing HM method.
- Do not create a second account.
- Do not silently merge accounts on the client.
- Do not use password reset as an account-linking workaround.

## 20. `ACCOUNT_LINK_REQUIRED`

This error is a safe account-protection boundary.

Reason: email equality alone is not enough to link an external identity to an existing HM account. A future authenticated account-linking feature can be built later, but it does not exist now.

Example B - existing local account collision:

```text
Existing HM password account:
person@example.com

New unlinked Google identity:
person@example.com

Expected behavior:
409 ACCOUNT_LINK_REQUIRED
```

The frontend must not treat password reset as a workaround. "Just reset the password and then Google becomes linked" is incorrect. The Google identity remains unlinked until HM implements a dedicated trusted account-linking flow.

> IMPORTANT - Password Reset Is Not Account Linking
>
> A Google-only HM user may be able to create a local password through HM's existing password-reset flow.
>
> This affects the same HM user account only.
>
> It does not link a new Google identity to a different existing password-based HM account.
>
> If Google Login returns `ACCOUNT_LINK_REQUIRED`, frontend must continue to show the existing-account guidance and must not use password reset as an account-linking workaround.

## 21. Account Linking Scope

Search confirmed no account-linking API exists for:

```text
link-google
account-link
unlink
link identity
```

Frontend must not build a "Link Google" API flow unless a future backend endpoint is delivered.

Unsupported frontend flows until backend APIs exist:

```text
Link Google
Unlink Google
Merge Accounts
```

## 22. Inactive/Suspended Accounts

Password login:

```text
User.isActive === false -> 403 User account is inactive
```

Google Login:

```text
Mapped Google identity + User.isActive === false -> 403 USER_INACTIVE
```

Response:

```json
{
  "success": false,
  "error": "USER_INACTIVE",
  "message": "User account is inactive"
}
```

Frontend UX: show an account-disabled message and do not continue to context bootstrap.

## 23. Reader Role Rule

Public registration and Google sign-up both create `reader`.

```text
Public register -> reader
Google new user -> reader
```

Frontend must never offer role selection on public registration or Google Login.

## 24. Author Workflow

Google Login does not grant author status.

Actual author workflow:

```text
reader
  -> POST /api/author-applications
  -> admin reviews application
  -> PUT /api/admin/author-applications/:id/status
  -> status approved
  -> User.role becomes author
```

User endpoint for checking application:

```http
GET /api/users/me/author-application
Authorization: Bearer <HM_ACCESS_TOKEN>
```

Application submit:

```http
POST /api/author-applications
Authorization: Bearer <HM_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "penName": "Author Pen Name",
  "bio": "Short author bio",
  "portfolioUrl": "https://example.com",
  "experience": "Writing experience"
}
```

## 25. Dashboard Entitlement

Author role is not the same as paid dashboard access.

Rules from `/api/users/me/context`:

| HM state | Meaning |
| --- | --- |
| `role=author` | Can publish |
| active `AuthorAccessEntitlement` | Can access author dashboard |
| revoked entitlement | Dashboard denied |
| pending purchase | Dashboard pending/payment state |
| admin | Always has dashboard/admin capabilities |

Google Login does not create, revoke, restore, or alter entitlements.

## 26. Existing Author Login

If a mapped Google identity belongs to an existing author:

- Login succeeds.
- Role remains `author`.
- `canPublish` is true.
- `canAccessAuthorDashboard` depends on entitlement.
- If entitlement is `ACTIVE`, dashboard access is allowed.
- If entitlement is `REVOKED` or missing, dashboard access is denied/paywalled.

## 27. Existing Admin Login

If a mapped Google identity belongs to an existing legitimate admin:

- Login succeeds.
- Role remains `admin`.
- `canAdminister` is true.

But:

```text
New Google account cannot become admin.
Client cannot send role=admin.
Google claim cannot assign admin.
```

## 28. Frontend Auth State

Recommended state:

```ts
type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  user: AuthUser | null;
  context: UserContext | null;
  status: 'anonymous' | 'authenticating' | 'context-loading' | 'authenticated' | 'error';
};
```

Password and Google login should write into the same auth state.

## 29. Google Login UI State Machine

These are frontend-derived UI states, not backend enums.

```text
IDLE
GOOGLE_PROMPT
GOOGLE_CREDENTIAL_RECEIVED
HM_AUTHENTICATING
CONTEXT_LOADING
AUTHENTICATED
ACCOUNT_LINK_REQUIRED
ACCOUNT_DISABLED
FAILED
```

State meaning:

| State | Meaning |
| --- | --- |
| `IDLE` | Login screen ready |
| `GOOGLE_PROMPT` | Google button/prompt opened |
| `GOOGLE_CREDENTIAL_RECEIVED` | Google callback returned a credential |
| `HM_AUTHENTICATING` | `POST /api/auth/google` in progress |
| `CONTEXT_LOADING` | HM tokens stored, `/api/users/me/context` in progress |
| `AUTHENTICATED` | Context loaded and app can route |
| `ACCOUNT_LINK_REQUIRED` | Backend returned `409 ACCOUNT_LINK_REQUIRED` |
| `ACCOUNT_DISABLED` | Backend returned inactive/suspended error |
| `FAILED` | Invalid credential, provider error, network failure, or unexpected backend error |

## 30. Loading UX

Frontend should:

- Disable the Google button while the Google callback is processing.
- Disable password login while Google login is in progress if both share one form.
- Prevent multiple simultaneous `POST /api/auth/google` calls for the same callback.
- Show "Signing in with Google..." during `HM_AUTHENTICATING`.
- Show "Loading your account..." during `CONTEXT_LOADING`.
- Re-enable the button only after success or handled failure.

## 31. Error UX

| HTTP | Error/code | Meaning | Frontend action | Retry? | User message |
| --- | --- | --- | --- | --- | --- |
| 400 | validation errors | Missing credential or forbidden fields | Fix frontend request; show generic failure to user | No until request fixed | "Google sign-in could not start. Please try again." |
| 401 | `INVALID_GOOGLE_CREDENTIAL` | Invalid, expired, forged, or unverifiable Google credential | Ask user to retry Google sign-in | Yes | "Google sign-in expired or failed. Please try again." |
| 401 | `GOOGLE_EMAIL_NOT_VERIFIED` | Google email missing or not verified | Ask user to verify Google email/use another account | No immediate retry | "Your Google account email must be verified." |
| 403 | `USER_INACTIVE` | HM account is inactive/suspended | Block app entry; show support path | No | "Your HM account is inactive. Contact support." |
| 409 | `ACCOUNT_LINK_REQUIRED` | Existing HM account uses this email but is not linked | Ask user to sign in with existing HM method | No | "An HM account already exists for this email. Sign in with your existing account." |
| 503 | `GOOGLE_AUTH_NOT_CONFIGURED` | Backend Google client ID missing/placeholder | Show service unavailable; alert operations | Later | "Google sign-in is temporarily unavailable." |
| 429 | rate limit | Too many auth attempts | Back off | Later | "Too many attempts. Please wait and try again." |
| 500 | none or server message | Unexpected backend failure | Show generic error; log client trace | Later | "Something went wrong. Please try again." |

## 32. Route Guards

Always guard frontend routes from HM context, not Google credential claims.

Examples:

| Route/screen | Guard |
| --- | --- |
| Customer account | HM access token exists and context loads |
| Author publishing | `context.capabilities.canPublish === true` |
| Author dashboard | `context.capabilities.canAccessAuthorDashboard === true` |
| Admin panel | `context.capabilities.canAdminister === true` |
| Become author | authenticated reader or author state |

## 33. Token Security

Token rules:

- Store and send HM access token for HM APIs.
- Store HM refresh token according to existing frontend security policy.
- Do not store Google credential as an HM session.
- Do not send Google credential in `Authorization` headers.
- Do not log HM token, refresh token, or Google credential.
- Clear HM tokens on logout.

HM API header:

```http
Authorization: Bearer <HM_ACCESS_TOKEN>
```

## 34. Sensitive Logging

Never log:

```text
Google credential / ID token
HM access token
HM refresh token
password
reset token
full auth response containing tokens
JWT secret
database URI
Google client secret
.env contents
```

Safe frontend analytics/logging may record:

```text
google_login_started
google_login_success
google_login_failed_code
```

Do not include email unless product/privacy policy explicitly allows it.

## 35. Frontend API Client

Framework-neutral TypeScript example:

```ts
const API_BASE_URL = getConfiguredApiBaseUrl();

function getConfiguredApiBaseUrl(): string {
  const value = readFrontendConfig('API_BASE_URL');
  if (!value) {
    throw new Error('API base URL is not configured');
  }
  return value.replace(/\/$/, '');
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Array<{ msg: string; path?: string }>;
};

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw Object.assign(new Error(payload.message || 'API request failed'), {
      status: response.status,
      payload
    });
  }
  return payload;
}
```

Use the frontend application's actual configuration reader for `readFrontendConfig()`. For example, Vite projects may expose `VITE_API_BASE_URL`, Next.js projects may expose `NEXT_PUBLIC_API_BASE_URL`, and other frontend stacks should use their existing environment/configuration mechanism.

## 36. TypeScript Types

These types match the current backend contracts.

```ts
export type Role = 'visitor' | 'reader' | 'author' | 'admin';

export type GoogleLoginRequest = {
  credential: string;
};

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthLoginData = {
  user: AuthUser;
  token: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type GoogleLoginResponse = {
  success: true;
  data: AuthLoginData;
};

export type UserContext = {
  user: {
    id: string;
    _id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    profilePicture: string | null;
    createdAt: string;
  };
  capabilities: {
    canPublish: boolean;
    canAccessAuthorDashboard: boolean;
    canAdminister: boolean;
  };
  states: {
    authorApplicationStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLICABLE' | string;
    dashboardAccessStatus: 'NOT_AUTHOR' | 'ACTIVE' | 'REVOKED' | 'VERIFICATION_PENDING' | 'PAYMENT_PENDING' | 'NOT_PURCHASED' | string;
    publishingStatus: 'NOT_APPLICABLE' | 'APPROVED' | 'NOT_APPROVED' | string;
  };
};

export type ApiErrorPayload = {
  success: false;
  error?: 'ACCOUNT_LINK_REQUIRED' | 'INVALID_GOOGLE_CREDENTIAL' | 'GOOGLE_EMAIL_NOT_VERIFIED' | 'USER_INACTIVE' | 'GOOGLE_AUTH_NOT_CONFIGURED' | string;
  message?: string;
  errors?: Array<{ msg: string; path?: string; location?: string }>;
};
```

## 37. Google Credential Callback

Framework-neutral pseudocode:

```ts
let googleLoginInFlight = false;

async function onGoogleCredential(credential: string) {
  if (googleLoginInFlight) return;
  googleLoginInFlight = true;

  try {
    setAuthUiState('HM_AUTHENTICATING');

    const login = await apiPost<AuthLoginData>('/api/auth/google', { credential });
    const { token, refreshToken, refreshTokenExpiresAt } = login.data!;

    saveHmTokens({ token, refreshToken, refreshTokenExpiresAt });

    setAuthUiState('CONTEXT_LOADING');
    const context = await apiGet<UserContext>('/api/users/me/context', token);
    saveUserContext(context.data!);

    setAuthUiState('AUTHENTICATED');
    navigateByCapabilities(context.data!.capabilities);
  } catch (error: any) {
    const status = error.status;
    const code = error.payload?.error;

    if (status === 409 && code === 'ACCOUNT_LINK_REQUIRED') {
      setAuthUiState('ACCOUNT_LINK_REQUIRED');
      return;
    }

    if (status === 403 && code === 'USER_INACTIVE') {
      setAuthUiState('ACCOUNT_DISABLED');
      return;
    }

    setAuthUiState('FAILED');
  } finally {
    googleLoginInFlight = false;
  }
}
```

## 38. Screen-to-API Matrix

| Screen / Action | Method | Endpoint | Trigger | Auth | Result |
| --- | --- | --- | --- | --- | --- |
| Login page password submit | POST | `/api/auth/login` | User clicks Sign In | Public | HM tokens returned |
| Login page Google submit | POST | `/api/auth/google` | Google credential callback | Public | HM tokens returned |
| Register page | POST | `/api/auth/register` | User submits form | Public | New reader + HM tokens |
| Auth bootstrap | GET | `/api/users/me/context` | After any successful login | HM bearer | Capabilities and route guards |
| Current user check | GET | `/api/auth/me` | Session restore/profile refresh | HM bearer | Current HM user |
| Refresh session | POST | `/api/auth/refresh` | Access token expired/refresh timer | Public/Bearer | New HM tokens |
| Logout | POST | `/api/auth/logout` | User clicks logout | Public/Bearer | Refresh session revoked |
| Become author status | GET | `/api/users/me/author-application` | Become author page load | HM bearer | Existing application or 404 |
| Submit author application | POST | `/api/author-applications` | Application form submit | HM bearer | Pending application |
| Author dashboard routing | GET | `/api/users/me/context` | App navigation guard | HM bearer | Check `canAccessAuthorDashboard` |
| Admin routing | GET | `/api/users/me/context` | App navigation guard | HM bearer | Check `canAdminister` |

## 39. Frontend Implementation Steps

1. Add public frontend Google client ID configuration.
2. Load/render Google Identity Services button.
3. Keep existing password login.
4. In Google callback, send only `{ credential }` to `POST /api/auth/google`.
5. Store returned HM `token`, `refreshToken`, and `refreshTokenExpiresAt`.
6. Call `GET /api/users/me/context` with HM bearer token.
7. Route user from HM `capabilities`.
8. Handle `ACCOUNT_LINK_REQUIRED` with existing-account UX.
9. Handle `USER_INACTIVE` with account-disabled UX.
10. Add tests for duplicate callback prevention and security injection fields.

## 40. QA Test Matrix

| Test | Expected |
| --- | --- |
| New Google user | Creates `reader`, returns HM tokens, context `canPublish=false` |
| Returning reader | Same HM user, no duplicate identity |
| Returning author | Role remains `author`, publishing capability true |
| Returning admin | Role remains `admin`, admin capability true |
| Existing email collision | `409 ACCOUNT_LINK_REQUIRED`, no auto-link |
| Invalid credential | `401 INVALID_GOOGLE_CREDENTIAL` |
| Expired credential | `401 INVALID_GOOGLE_CREDENTIAL` |
| Missing backend config | `503 GOOGLE_AUTH_NOT_CONFIGURED` |
| Inactive account | `403 USER_INACTIVE` |
| Refresh after Google login | New HM tokens returned |
| Logout after Google login | HM session revoked |
| Context after Google login | `/api/users/me/context` returns user/capabilities/states |
| Google-only password login | `401 Invalid credentials` |
| Double callback | Only one backend login attempt should be active |

## 41. Security Test Matrix

| Test | Expected |
| --- | --- |
| Send `role: admin` with Google credential | `400`, no admin created |
| Send `role: author` with Google credential | `400`, no author created |
| Send `email: victim@example.com` | `400`, client email not trusted |
| Send `googleId` | `400`, client provider ID not trusted |
| Decode Google credential in frontend and route by claim | Forbidden frontend behavior |
| Use Google token as HM bearer | HM API rejects/does not authenticate |
| New Google user checks admin route | 403 from admin APIs |
| New Google user checks author-only route | 403 until normal HM author approval |

## 42. Configuration Checklist

Backend:

- `GOOGLE_CLIENT_ID` configured in deployment environment.
- `JWT_SECRET` configured securely.
- `MONGODB_URI` configured securely.
- No Google client secret required for this ID-token flow.

Frontend:

- Public Google web client ID configured.
- Backend API base URL configured.
- API base URL comes from frontend environment/configuration.
- No backend secrets in frontend environment.
- Existing HM token storage reused.

Google Cloud Console:

- OAuth client type = Web application.
- Authorized JavaScript origins include local frontend origin.
- Authorized JavaScript origins include staging frontend origin if used.
- Authorized JavaScript origins include production frontend origin.
- Authorized redirect URIs are left empty for the current callback/popup flow.
- Frontend Google Client ID configured.
- Backend `GOOGLE_CLIENT_ID` configured.
- Frontend/backend use the same Web Client ID.
- No Google client secret exposed to frontend.
- The backend receives ID token credential from the frontend and verifies audience.

## 43. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `503 GOOGLE_AUTH_NOT_CONFIGURED` | Backend `GOOGLE_CLIENT_ID` missing/placeholder | Configure deployment env and redeploy |
| `401 INVALID_GOOGLE_CREDENTIAL` | Expired/invalid/wrong-audience credential | Retry Google sign-in; verify client IDs match |
| Existing HM email returns `409 ACCOUNT_LINK_REQUIRED` | Google identity is not linked to that existing HM account | Use the existing HM sign-in method. Do not auto-link and do not use password reset as a linking workaround |
| Google-only HM user cannot use password login | That HM user currently has no local password | Continue with Google, or use supported password-recovery flow if product policy allows it. This does not perform Google account linking |
| Google popup fails on frontend origin | Origin missing from Google Cloud Authorized JavaScript origins | Add the exact frontend origin, including scheme, host, and port |
| Developer added `/api/auth/google` as redirect URI but login still fails | Current implementation is not a server redirect flow | Leave redirect URIs empty for the current callback/popup flow and configure JavaScript origins instead |
| `403 USER_INACTIVE` | HM account suspended/inactive | Show support flow |
| Context shows reader after Google login | New Google users are readers by design | User must apply for author status |
| Dashboard blocked for author | No active entitlement or revoked entitlement | Show dashboard access purchase/status flow |

## 44. Backend Validation Evidence

Evidence inspected:

- `tests/auth.test.js` includes Google Login tests for new reader, returning mapped user, collision, author/admin preservation, inactive user, forbidden injection fields, invalid credential, missing config, refresh/logout/auth-me/context, and Google-only password login.
- Focused auth test run previously returned: `20 passed`.
- Phase 8 and author access focused suites previously returned: `15 passed`.
- Full regression final summary is not currently available; a full `npm test -- --runInBand --forceExit` attempt timed out in the tool window. Treat full regression as an operational release gate until it returns a final summary.

## 45. OpenAPI, Postman, API Inventory

Mechanically verified from current files:

| Artifact | Value |
| --- | --- |
| OpenAPI version | `3.1.0` |
| OpenAPI paths | `150` |
| OpenAPI schemas | `74` |
| Google OpenAPI path | `/api/auth/google` exists |
| Google request schema | `#/components/schemas/GoogleLoginRequest` |
| Postman | Google Login exists under Authentication |
| Unique APIs | `166` |
| Read APIs | `89` |
| Write APIs | `77` |
| Multipart APIs | `6` |

## 46. Scope Exclusions

Google Login does not provide:

- Gmail access
- Google Calendar access
- Google Drive access
- Google Contacts access
- Google Photos access
- Delegated Google API access
- Google OAuth access-token storage
- Google OAuth refresh-token storage
- Account linking API
- Admin privilege creation
- Author approval bypass
- Dashboard entitlement bypass
- Payment/publishing/royalty/settlement changes

## 47. Final Frontend Checklist

- Google Login endpoint integrated: `POST /api/auth/google`.
- Only `credential` sent.
- API base URL comes from frontend environment/configuration.
- Google authorized origins configured for actual frontend origins.
- Google redirect URIs not required for the current callback/popup flow.
- Same Google Web Client ID used by frontend and backend.
- HM tokens stored from response.
- Google credential not used as HM bearer token.
- `/api/users/me/context` called after login.
- Route guards use HM capabilities.
- `ACCOUNT_LINK_REQUIRED` UX implemented.
- `ACCOUNT_LINK_REQUIRED` not bypassed.
- Password reset not treated as account linking.
- `USER_INACTIVE` UX implemented.
- Invalid/expired Google credential retry UX implemented.
- Duplicate callback protection implemented.
- Sensitive token logging blocked.
- Password login remains available.
- Author application workflow remains unchanged.
- Dashboard entitlement workflow remains unchanged.

## 48. Final Handover Status

```text
HM FRONTEND GOOGLE LOGIN HANDOVER COMPLETE

FULL PROJECT ANALYZED
GOOGLE LOGIN CONTRACT VERIFIED
FRONTEND INTEGRATION DOCUMENT GENERATED
RUNTIME CODE UNCHANGED DURING THIS HANDOVER TASK
```

Final verification:

| Item | Status |
| --- | --- |
| Google Login endpoint verified | YES |
| New Google user -> reader verified | YES |
| Google admin escalation blocked | YES |
| Google author bypass blocked | YES |
| HM token/session reuse verified | YES |
| `ACCOUNT_LINK_REQUIRED` verified | YES |
| `/api/users/me/context` verified | YES |
| Frontend implementation steps included | YES |
| Security checklist included | YES |
| Testing checklist included | YES |
| Secrets found in generated document | NO |
| Frontend developer can implement Google Login using this MD alone | YES |
