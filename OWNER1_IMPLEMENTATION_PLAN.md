# Owner 1 — Identity, Security & Shared API Foundation: Implementation Plan

## 1. Existing Architecture
TalentIQ is currently an AI-Verified Talent Intelligence Platform consisting of:
- **Frontend**: React 19 + Vite 8 + React Router 7 + Recharts, using a custom Space Fabric design system with CSS. Currently relies on static demo data (`frontend/src/data/candidates.js`) and mock API endpoints via `frontend/src/lib/api.js`.
- **Backend**: Node.js + Express 5 + TypeScript + Prisma 7 ORM connecting to PostgreSQL. Currently scaffolded with stub handlers and routes that return static mock data from `backend/src/data/demo.ts`.
- **State & Auth Flow**: Frontend state is managed in `AppContext.jsx`. `AuthScreen.jsx` mocks login/register without real authentication or session storage. The backend `auth.middleware.ts` blindly appends a hard-coded demo user (`id: 'demo-user', role: 'admin'`) to all incoming requests.

## 2. Security Weaknesses & Vulnerabilities Found
During our repository and security audit, we identified the following critical vulnerabilities:
1. **Mock Authentication & Hardcoded Credentials**: `backend/src/middleware/auth.middleware.ts` hard-codes `req.user = { id: 'demo-user', email: 'demo@talentiq.ai', role: 'admin' }`, effectively granting any anonymous request full Admin privileges.
2. **Missing Input Validation**: `backend/src/middleware/validation.middleware.ts` is a no-op stub (`validate = (_schema: string) => (req, res, next) => next()`), exposing endpoints to mass assignment, malformed payloads, and invalid data injection.
3. **Insecure Direct Object References (IDOR)**:
   - Candidate endpoints (`/api/candidates/:id`, `/api/candidates/:id/status`, profile/roadmap updates) trust client-supplied ID parameters without verifying ownership or authorization against the authenticated user.
   - GitHub integration routes (`/api/candidates/:candidateId/github/...`) accept any `candidateId` from path params without ensuring the requestor is the owner.
4. **Lack of Organization Isolation (Tenant Isolation)**: Recruiter pipelines, candidate searches, and comparisons lack organization scoping, meaning any recruiter could access hiring pipelines or candidate data belonging to another organization.
5. **Absence of API Protection & Headers**: Missing Rate Limiting (vulnerable to brute-force auth attacks & DDoS), missing Helmet security headers, missing body size limits, missing request IDs, and potential secret leakage in logs.
6. **No Session Governance**: No refresh token rotation, revocation mechanism, secure HttpOnly cookie configuration, or session expiration handling.
7. **Missing Privacy & Audit Trails**: No tracking of candidate consent, no privacy deletion request lifecycle, no GDPR/CCPA data export API, and no audit logs for security mutations.

## 3. Files Requiring Modification & Creation
### Backend
- **New Dependencies to Install**: `zod`, `bcryptjs` (or `argon2`), `jsonwebtoken`, `cookie-parser`, `helmet`, `express-rate-limit`, `morgan`, and types.
- **Database Schema**: Modify `backend/prisma/schema.prisma` to add required entities and relations.
- **Config & DB Layer**: Update `src/config/env.ts` to validate required production secrets; enhance `src/lib/prisma.ts` with graceful connection handling and read readiness check.
- **Models & Interfaces**: Extend `src/types/index.ts` and models for fully authenticated principals, pagination, and error contracts.
- **Services**: Create/update `src/services/auth.service.ts`, `src/services/user.service.ts`, `src/services/privacy.service.ts`, `src/services/audit.service.ts`, `src/services/email.service.ts`, `src/services/org.service.ts`.
- **Middleware**: Replace stubs in `src/middleware/auth.middleware.ts`, `src/middleware/validation.middleware.ts`, `src/middleware/error.middleware.ts`, and add `src/middleware/security.middleware.ts`.
- **Controllers & Routes**: Refactor `auth.controller.ts`, `candidate.controller.ts`, `recruiter.controller.ts`, `github.controller.ts`; add `privacy.controller.ts` and `health.controller.ts`. Update `src/routes/index.ts`.

### Frontend
- **API Client**: Refactor `frontend/src/lib/api.js` to support real authenticated HTTP calls with credentials/cookies, automatic retry/refresh rotation, standardized error extraction, and cancellation via AbortController.
- **State Management & UI Guards**: Update `frontend/src/context/AppContext.jsx` with secure auth state (`user`, `role`, `isAuthenticated`, `isLoading`, and methods for login, register, logout, refresh, password reset, and email verification).
- **Navigation Guards**: Implement `RequireAuth` and `RequireRole` components in `frontend/src/routes/AppRoutes.jsx` to secure candidate, recruiter, and admin views.

## 4. Database Schema Changes (PostgreSQL / Prisma)
We will add the following persistent entities to `schema.prisma`:
1. **User**: `id`, `email`, `passwordHash`, `role` (CANDIDATE, RECRUITER, ADMIN), `name`, `avatar`, `emailVerified`, `status` (ACTIVE, SUSPENDED, DELETED), `lastLoginAt`, `createdAt`, `updatedAt`.
2. **Session / RefreshToken**: `id`, `userId`, `tokenHash`, `expiresAt`, `isRevoked`, `replacedByTokenHash`, `ipAddress`, `userAgent`, `createdAt`.
3. **PasswordResetToken**: `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`.
4. **EmailVerificationToken**: `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`.
5. **Organization**: `id`, `name`, `createdAt`, `updatedAt`.
6. **OrganizationMember**: `id`, `organizationId`, `userId`, `role` (MEMBER, ADMIN), `createdAt`, `updatedAt`.
7. **ConsentRecord**: `id`, `userId`, `consentType`, `status`, `version`, `grantedAt`, `revokedAt`.
8. **PrivacyPreference**: `id`, `userId`, `visibility` (PRIVATE, ORGANIZATION_SHARED, PUBLIC_PROFILE), `createdAt`, `updatedAt`.
9. **DeletionRequest**: `id`, `userId`, `status` (PENDING, PROCESSING, COMPLETED, CANCELLED), `requestedAt`, `processedAt`.
10. **AuditLog**: `id`, `userId`, `action`, `ipAddress`, `userAgent`, `metadata`, `createdAt`.

*Candidate and Recruiter models will link via optional/required User relationships to enforce ownership.*

## 5. API Contracts & Standardized Format
All Owner-1 mutations and protected endpoints will abide by a strict JSON envelope:
- **Success**: `{ "success": true, "data": { ... }, "requestId": "..." }`
- **Error**: `{ "success": false, "error": { "code": "VALIDATION_ERROR | UNAUTHENTICATED | UNAUTHORIZED | NOT_FOUND | CONFLICT | RATE_LIMIT_EXCEEDED | INTERNAL_SERVER_ERROR", "message": "...", "details": [...] }, "requestId": "..." }`

## 6. Authentication & Authorization Strategy
- **Authentication Flow**:
  - Registration hashes passwords using bcrypt (cost factor 12) or argon2id.
  - Generates short-lived Access Token (JWT, TTL: 15 minutes) returned in JSON response payload.
  - Generates cryptographically random Refresh Token (TTL: 7 days), hashed via SHA-256 before saving to DB, and transmitted to the client strictly via a `Secure, HttpOnly, SameSite=Strict/Lax` cookie (`talentiq_refresh`).
  - Refresh rotation: Refreshing revokes the current token hash and generates a new pair. If a revoked token is replayed, the entire session chain is revoked immediately.
- **Authorization & Ownership Enforcement**:
  - Server-side JWT decoding attaches verified identity (`req.user`) to `AuthenticatedRequest`.
  - `requireAuth()` rejects requests lacking valid access tokens with 401.
  - `requireRole('CANDIDATE' | 'RECRUITER' | 'ADMIN')` enforces Role-Based Access Control (403 on mismatch).
  - `requireOwnership()` checks if target resource ID matches `req.user.id` or if the user holds an ADMIN role.
  - `requireOrganizationAccess()` ensures recruiter queries are scoped strictly to candidates shared with or added to their organization's tenant pipeline.

## 7. Migration & Rollout Strategy
1. Install new security and validation packages on the backend.
2. Update `prisma/schema.prisma` and execute a migration (`npx prisma migrate dev` or push in dev environment, followed by `npx prisma generate`).
3. Implement centralized services and middlewares, keeping existing non-auth AI features untouched while replacing insecure auth/validation middleware.
4. Integrate auth endpoints into `auth.routes.ts` and secure domain endpoints (`candidate`, `recruiter`, `github`, `privacy`).
5. Update frontend `api.js` client and `AppContext.jsx` to consume real APIs cleanly with fallback protection where needed.

## 8. Test & Verification Strategy
We will implement automated tests (Vitest + Supertest) covering:
- Registration success, duplicate email validation, invalid payloads.
- Login success, wrong password rejection, account lock/status checks.
- Token refresh rotation, revoked token replay handling, logout revocation.
- Password recovery (preventing email enumeration) and email verification token lifecycle.
- Role authorization (Candidate rejected from Recruiter views and vice versa).
- IDOR prevention (Candidate A cannot access or modify Candidate B's resume, roadmap, or GitHub integration).
- Cross-organization isolation (Recruiter A from Org A cannot access Org B's pipeline data).
- Rate limiting thresholds on authentication routes.
- Privacy features: Consent record modifications, data export API scoping, and account deletion workflow.
