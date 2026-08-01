# Owner 4 — Integration & Platform Baseline Map

Last reviewed: 2026-08-01

## Current provider paths

| Area | Current implementation | Production gap / follow-up |
|---|---|---|
| GitHub OAuth | OAuth state is signed and replay-protected; GitHub credentials are encrypted at rest; sync uses paged, bounded-concurrency source fetches, retries, and non-destructive upserts. The frontend provides connect, status, sync, and disconnect. | Bind candidate identity to Owner 1 auth session; add PKCE, provider revocation/refresh, durable sync runs, and worker-backed retries. |
| LinkedIn | Backend service uses OpenID userinfo; access tokens are encrypted at rest; the demo preview endpoint is unavailable in production. | Bind identity to auth session; validate consent/callbacks; add token refresh/revocation; confirm allowed profile imports before implementation. |
| Evidence | Candidate can submit URL/JSON evidence through `evidenceApi`. | Owner 2 owns evidence lifecycle and attachments; Owner 4 will provide storage, upload safety, source adapters, and worker triggers. |
| Frontend deployment | Netlify builds `frontend` and serves SPA fallback. | Set `VITE_API_BASE_URL` for each deployed environment; never expose server secrets as `VITE_*` variables. |
| Backend deployment | Dockerfile, health/readiness endpoints, safer local PostgreSQL Compose configuration, and a deployment guide are included. | Select host, managed PostgreSQL, Redis/worker, object storage, secrets manager, monitoring, and operational runbooks. |

## Environment contract

- Backend: `DATABASE_URL`, `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, provider credentials/callback URLs, `FRONTEND_URL`, and `CORS_ORIGIN` are documented in `backend/.env.example`.
- Frontend: only public `VITE_*` configuration belongs in `frontend/.env.example`; production needs `VITE_API_BASE_URL` set to the backend origin.
- The process now fails fast in production when `DATABASE_URL`, a sufficiently strong `JWT_SECRET`, or `TOKEN_ENCRYPTION_KEY` is missing.

## Baseline verification

On 2026-08-01: backend typecheck/build passed; 6 test files / 11 tests passed; frontend typecheck/build passed. The Vite build reports a JavaScript chunk above 500 kB, to be addressed later through route/component splitting after functional delivery is stable.

## Next dependency

Wait for Owner 1 to publish the authenticated-principal and role contract before changing OAuth start, callback, sync, or connection endpoints.
