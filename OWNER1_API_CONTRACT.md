# Owner 1 — Identity, Security & Shared API Foundation
## Complete Production API Contract for Feature Teams

This document defines the foundational API architecture, authentication mechanisms, Role-Based Access Control (RBAC), tenant boundaries, and error contracts for all TalentIQ product features. **All subsequent feature domain teams must conform to these conventions.**

---

## 1. Standard API Request & Response Envelopes

### Successful Responses (HTTP 200 / 201)
Every successful API endpoint returns a standardized JSON envelope containing `success: true`, the payload in `data`, and a tracking `requestId`:
```json
{
  "success": true,
  "data": {
    "id": "cm08x14a90000a2l5bcdef123",
    "name": "Alice Candidate",
    "role": "CANDIDATE"
  },
  "requestId": "9c1b3f6a-4d22-4a0b-8e1c-7b6f2e8d90fa",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```
*(Note: `meta` is optional and included for paginated queries).*

### Error Responses (HTTP 400 / 401 / 403 / 404 / 409 / 429 / 500)
All failures return a consistent JSON structure under `error` with a standardized machine-readable `code`, clear description in `message`, and optional validation field errors under `details`:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Invalid email address" },
      { "field": "password", "message": "Password must be at least 8 characters long" }
    ]
  },
  "requestId": "9c1b3f6a-4d22-4a0b-8e1c-7b6f2e8d90fa"
}
```

#### Standard Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Request parameters, query string, or body violated Zod validation schema. |
| `400 Bad Request` | `MALFORMED_JSON` | Syntax error in Request Body JSON payload. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing, expired, or invalid JWT access token or refresh cookie. |
| `403 Forbidden` | `UNAUTHORIZED` | User is authenticated but lacks required Role, Resource Ownership, or Org access. |
| `404 Not Found` | `NOT_FOUND` | Target entity does not exist or user lacks permission to discern existence. |
| `409 Conflict` | `CONFLICT` | Entity creation failed due to a uniqueness collision (e.g., duplicate email). |
| `429 Too Many Req.`| `RATE_LIMIT_EXCEEDED`| IP exceeded maximum allowed requests within a 15-minute rolling window. |
| `500 Internal Error`| `INTERNAL_SERVER_ERROR`| Unhandled server exception (stack traces and SQL internals are redacted). |

---

## 2. Authentication Architecture & Credentials

### Authentication Credentials (Tokens & Cookies)
TalentIQ uses a two-token session security architecture:
1. **Short-Lived Access Token (JWT):** Expired after 15 minutes. Must be transmitted on API calls via the HTTP `Authorization` header:
   ```http
   Authorization: Bearer <access_token>
   ```
2. **Rotating Refresh Token:** Valid for 7 days. Stored exclusively as an `HttpOnly`, `Secure` (in production), `SameSite=Strict` cookie named `talentiq_refresh`.
   - **Reuse Detection:** Every call to `/api/auth/refresh` revokes the current refresh token and issues a new one. If an old, already-revoked refresh token is submitted, the system flags token reuse/theft and immediately revokes **all sessions** for that user account.

### Frontend API Client Helper (`frontend/src/lib/api.js`)
Feature teams building React components should import `api` from `src/lib/api.js`. The helper automatically handles:
- Injecting the stored JWT into `Authorization` headers.
- Sending `credentials: 'include'` for secure cookie transmission.
- Transparently intercepting `401 Unauthenticated` responses, executing `/api/auth/refresh`, rotating tokens, and retrying the failed request once without kicking out the user.
- Unpacking the standardized `{ success: true, data: ... }` envelope and returning the payload directly.

---

## 3. Role-Based Access Control (RBAC) & Tenant Security Rules

### Supported Roles
Every authenticated user has one of three canonical uppercase roles:
- `CANDIDATE`: Individual tech professional building a Digital Talent Identity.
- `RECRUITER`: Hiring professional operating under an Organization tenant boundary.
- `ADMIN`: Platform system operator with full global oversight and audit privileges.

### Middleware Reference (`backend/src/middleware/auth.middleware.ts`)
When building new domain endpoints in `src/routes/`, apply the appropriate security guards:

| Middleware | Usage | Purpose |
|---|---|---|
| `requireAuth` (`authenticate`) | `router.use(requireAuth)` | Verifies valid JWT access token; attaches decoded identity to `req.user`. |
| `requireRole(...roles)` (`authorize`) | `router.get('/pipeline', requireRole('RECRUITER', 'ADMIN'), ...)` | Rejects request with HTTP 403 if `req.user.role` is not in allowed list. |
| `requireOwnership(paramName)` | `router.patch('/:id/status', requireOwnership('id'), ...)` | Prevents IDOR by verifying `req.user.id === req.params[id]` (Admins bypass). |
| `requireOrganizationAccess()` | `router.get('/pipeline', requireOrganizationAccess(), ...)` | Verifies Recruiter is bound to an active organization (`req.user.organizationId`). |

---

## 4. Endpoint Reference Catalog (Owner 1 Foundation)

### Authentication & Sessions (`/api/auth`)
| Method | Endpoint | Auth Required | Rate Limiter | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | `authRateLimiter` | Register new User; returns `accessToken` and sets `talentiq_refresh` cookie. |
| `POST` | `/api/auth/login` | No | `authRateLimiter` | Authenticate with email/password; issues tokens and logs audit trail. |
| `POST` | `/api/auth/logout` | No (Cookie) | None | Revokes `talentiq_refresh` token in DB, clears cookie, logs logout event. |
| `POST` | `/api/auth/refresh` | No (Cookie) | `authRateLimiter` | Rotates refresh token in cookie and issues fresh short-lived JWT access token. |
| `GET` | `/api/auth/me` | Yes | `apiRateLimiter` | Returns safe authenticated user profile (excludes password hash & secrets). |
| `PUT` | `/api/auth/me` | Yes | `apiRateLimiter` | Update current user profile metadata (`name`, `avatar`, `title`, etc.). |
| `POST` | `/api/auth/verify-email`| No | `authRateLimiter` | Consumes single-use token to verify account email address. |
| `POST` | `/api/auth/resend-verification`| No | `authRateLimiter` | Dispatches fresh verification link without exposing user existence. |
| `POST` | `/api/auth/forgot-password` | No | `authRateLimiter` | Dispatches 1-hour password recovery link without account enumeration leakage. |
| `POST` | `/api/auth/reset-password` | No | `authRateLimiter` | Resets user password with valid token and revokes all active sessions globally. |

### Privacy, Consent & GDPR Compliance (`/api/privacy`)
All endpoints below require authentication (`requireAuth`) and are scoped to the authenticated user's ownership:

| Method | Endpoint | Payload / Query | Description |
|---|---|---|---|
| `POST` | `/api/privacy/consent` | `{ consentType, status: "GRANTED" \| "REVOKED", version }` | Record granular consent for AI evaluations, verification, or public data use. |
| `GET` | `/api/privacy/consent` | None | Returns array of current user consent grant status and historical timestamps. |
| `PUT` | `/api/privacy/preferences` | `{ visibility: "PRIVATE" \| "ORGANIZATION_SHARED" \| "PUBLIC_PROFILE" }` | Updates recruiter visibility rules for Candidate data. |
| `GET` | `/api/privacy/preferences` | None | Retrieves current user privacy visibility settings. |
| `GET` | `/api/privacy/export` | None | Generates complete structured JSON export of profile, privacy history, and logs. |
| `DELETE` | `/api/privacy/account` | None | Executes soft account erasure (`DELETED`), anonymizes identity, revokes all sessions. |
| `GET` | `/api/privacy/audit-logs` | None | Returns chronological list of security audit logs for the authenticated user. |

### System Infrastructure & Probes (`/health`, `/ready`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` or `/api/health` | No | Liveness probe; returns `200 OK` if Express server process is running. |
| `GET` | `/ready` or `/api/ready` | No | Readiness probe; returns `200` if DB/adapter connection is healthy (`503` if down). |
