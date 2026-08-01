# Owner 1 — Identity, Security & Shared API Foundation

## Mission

Make TalentIQ safe to use with real accounts, role-based access, validated requests, and a frontend client that can consume production APIs. This owner unblocks all other owners.

## Work items

### 1. Production authentication and account lifecycle — P0

Implement a `User`/account model, registration, login, logout, refresh rotation, password reset, and email verification, or integrate an approved identity provider. Replace the demo tokens and hard-coded admin user in `backend/src/controllers/auth.controller.ts`, `services/auth.service.ts`, and `middleware/auth.middleware.ts`.

Use secure HTTP-only session cookies or a documented token strategy. Add candidate, recruiter, and admin roles and lifecycle tests for login, refresh, logout, and account recovery.

### 2. Authorization and ownership enforcement — P0

Bind every read/write action to the authenticated principal instead of user IDs supplied in a URL or query. Protect candidate, evidence, GitHub, LinkedIn, recruiter, report, and trust routes against cross-account access (IDOR).

Implement reusable ownership/tenant checks and route guards in the frontend. Verify that a recruiter can access only their organization’s candidate workflow data and that candidates can access only their own private evidence.

### 3. Request validation and baseline API security — P0

Replace the no-op `validate()` middleware with schema validation for every mutation and query parameter. Add consistent validation errors, request-size limits, safe CORS configuration, security headers, rate limits, request IDs, and redacted structured logs.

Include health/readiness endpoints and ensure the global error handler records internal failures without exposing secrets or stack traces to clients.

### 4. Complete shared frontend API and state layer — P0

Replace demo-backed `AppContext` and the minimal `get`/`post` wrapper in `frontend/src/lib/api.js` with an authenticated API client. Support GET/POST/PUT/PATCH/DELETE, standardized errors, cancellation, retries where safe, and upload requests.

Create domain hooks/state conventions with loading, empty, error, and retry states. Migrate shared candidate/session state first so Owners 2 and 3 can build without local mock data.

### 5. Privacy, consent, and data-subject controls — P0

Add consent records, account/data export, deletion requests, retention rules, and access audit logs for candidate PII. Store sensitive provider credentials encrypted and never log tokens, email addresses, or raw evidence unnecessarily.

Document recruiter visibility rules and candidate privacy settings so later product screens can apply them consistently.

## Dependencies

Decide the authentication approach and PostgreSQL deployment before implementation. Coordinate schema changes with Owner 2; publish API contracts before Owner 3 consumes them.

## Definition of done

- No route relies on a hard-coded demo user or client-provided identity for authorization.
- All mutation endpoints validate input and return consistent error shapes.
- Frontend authentication, protected navigation, and shared API requests work against a non-demo backend.
- Auth/security integration tests pass in CI.
