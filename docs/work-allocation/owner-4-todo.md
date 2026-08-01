# Owner 4 — Execution To-Do List

## Scope boundary

You own external integrations, reliability, deployment, testing, accessibility, and release quality. AI features are excluded. Do not redesign the candidate/evidence schema or authentication rules independently; coordinate those contracts with Owners 1 and 2.

## Full work list

### A. GitHub OAuth and sync reliability — P0

- [x] Map the present GitHub OAuth route, callback, state storage, token fields, and sync sequence. See `owner-4-integration-map.md`.
- [ ] Require a signed-in candidate before OAuth starts; derive candidate identity from the session, not a query parameter.
- [ ] Add OAuth state validation and PKCE if supported by the selected flow.
- [ ] Encrypt provider access/refresh tokens at rest; redact them from logs and API responses. GitHub and LinkedIn access-token encryption is implemented with AES-256-GCM and legacy-token migration compatibility; apply the same path to refresh tokens when a provider returns them.
- [ ] Add connect status, reconnect, disconnect, token refresh, and revoke flows. Connection status and local disconnect endpoint are implemented; provider token revocation and refresh remain.
- [ ] Replace destructive repository deletion with staging/upserts plus a transaction, so partial sync failures retain prior data. Upserts and delete-after-success behavior are implemented; wrap the full persistence section in a database transaction next.
- [ ] Add pagination, bounded concurrency, rate-limit handling, exponential backoff, and idempotency for GitHub API calls. Repository pages, bounded four-at-a-time detail fetches, 15-second request timeouts, and rate-limit retry/backoff are implemented; idempotency remains.
- [ ] Persist sync runs/status/error details and expose a safe status endpoint/UI state.
- [ ] Add mocked-provider tests for success, expired token, rate-limit, partial failure, retry, and disconnect.

### B. LinkedIn and evidence-source integrations — P1

- [ ] Remove or isolate the production `connection-preview` path.
- [ ] Implement consent, callback validation, token refresh/revoke, reconnect, and error state for LinkedIn.
- [ ] Confirm permitted LinkedIn APIs/data before importing any profile or experience data.
- [ ] Define source adapters for certification issuers, hackathon organizers, presentation links/uploads, and team/VCS sources.
- [ ] Send every imported item to Owner 2’s Evidence lifecycle with provenance, source ID, timestamp, consent, and re-sync rules.
- [ ] Add provider-webhook signature verification where a provider supports it.
- [ ] Test all provider adapters with recorded/mocked HTTP responses.

### C. Workers, uploads, and notifications — P1

- [ ] Select Redis plus a queue library and add local development configuration.
- [ ] Create durable job types for source sync, webhook processing, upload scanning, evidence expiry checks, report export, and notification delivery.
- [ ] Add idempotency keys, retries/backoff, dead-letter handling, job metrics, manual retry, and safe failure messages.
- [ ] Coordinate private object storage/presigned upload contracts with Owner 2.
- [ ] Add notification preferences and channels for sync failure, evidence decision, expiry, and pipeline/application events.

### D. Deployment, observability, and operations — P0

- [ ] Choose backend host/runtime and provision managed PostgreSQL, Redis, object storage, and secrets management.
- [ ] Add backend Dockerfile/process configuration, health and readiness checks, production environment validation, and `.env.example` without secrets. Dockerfile, health/readiness endpoints, and configuration guidance are complete; a hosting-provider runtime remains to be selected.
- [ ] Split frontend and backend deployment configuration; configure allowed origins and public API base URL per environment.
- [ ] Move development-only database credentials out of deployable configuration.
- [ ] Add structured redacted logs, error tracking, metrics, dashboards, and alert policies.
- [ ] Write database backup/restore, migration rollout, incident, and rollback runbooks.
- [ ] Add caching/CDN policy plus operational rate-limit and DDoS controls.

### E. CI/CD and automated tests — P0

- [ ] Add frontend lint/test scripts; add backend lint/typecheck/test scripts to CI. Typecheck/build/test CI baseline is complete; lint and frontend tests remain.
- [ ] Provision an isolated test database and reusable fixtures.
- [ ] Add API integration tests for OAuth, sync, evidence upload/review, auth guard behavior, and error responses. Added real HTTP tests for `/health` and both `/ready` outcomes; provider/auth/evidence coverage remains.
- [ ] Add frontend component tests for loading/error/empty states and protected routes.
- [ ] Add end-to-end tests for sign-in, GitHub connect/sync, evidence submit/review, candidate update, recruiter pipeline, and export.
- [ ] Add migration validation, dependency/security scanning, production build checks, coverage reporting, and required CI gates.

### F. Accessibility and release QA — P0

- [ ] Audit all interactive controls for keyboard navigation, logical focus, visible focus state, and modal focus trapping.
- [ ] Correct semantic markup, labels, accessible names, color contrast, error announcements, and responsive behavior.
- [ ] Standardize loading, empty, error, retry, and offline states across product screens.
- [ ] Fix visible character-encoding corruption such as `â€¦`, `Â·`, and malformed emoji.
- [ ] Run desktop/mobile browser smoke tests and maintain a release checklist.

## Start here: first implementation sequence

### Week 1 — establish the production safety rail

1. **Read and document the existing integration paths.** Trace `github.routes.ts`, `github.controller.ts`, `github.service.ts`, `linkedin.*`, `config/env.ts`, `docker-compose.yml`, and `netlify.toml`. Record endpoints, required environment variables, secrets, current failure cases, and data writes in a short integration map.
2. **Create the baseline quality gate.** Add CI that runs build, typecheck, and existing tests for frontend and backend. Add backend `/health` and `/ready` endpoints, an `.env.example`, and a safe configuration validation check.
3. **Harden GitHub authorization boundary.** Do this only after Owner 1 publishes the authenticated-principal contract. Remove client-controlled candidate IDs from OAuth start/sync endpoints and require the current authenticated candidate.

### Week 2 — make GitHub sync safe and observable

4. Encrypt provider credentials using the team-approved secret/key strategy; update schema migration and ensure log redaction.
5. Refactor sync into idempotent upserts or staging + transactional promotion. Add pagination, rate-limit handling, bounded concurrency, sync-run records, retries, and API-visible status.
6. Write mocked GitHub integration tests covering normal sync and all important recovery paths.

### Week 3 — package it for delivery

7. Add worker/Redis setup and run GitHub sync asynchronously, with status notifications. Coordinate evidence handoff with Owner 2.
8. Implement production deployment configuration, monitoring/error tracking, backup/migration runbooks, and environment-specific CORS/API configuration.
9. Add end-to-end smoke tests and complete the initial accessibility/encoding audit.

## Coordination checkpoints

| When | Ask | Owner |
|---|---|---|
| Before OAuth hardening | How is the authenticated user exposed and what roles own provider connections? | Owner 1 |
| Before writing evidence adapters/uploads | What exact Evidence status/attachment/provenance fields are available? | Owner 2 |
| Before pipeline notifications/export E2E tests | Which recruiter actions and report APIs are final? | Owner 3 |
| Before production deployment | Which environments, domains, and secret manager are approved? | Project owner |

## First PR recommendation

Create a small **Platform baseline** PR: CI workflow, backend health/readiness endpoints, `.env.example`, deployment configuration inventory, frontend/backend test commands, and a written GitHub integration map. This produces a safe foundation without conflicting with the schema/auth work being handled by Owners 1 and 2.

## Progress log

### 2026-08-01 — Platform baseline in progress

- Completed the integration/deployment inventory in `owner-4-integration-map.md`.
- Added `/health` and database-backed `/ready` endpoints, a 1 MB JSON request limit, production configuration checks for database/JWT secrets, and clearer environment guidance.
- Added GitHub Actions checks for backend typecheck/test/build and frontend typecheck/build. Local verification passed: backend 4 tests, backend typecheck/build, and frontend typecheck/build.
- Next: receive Owner 1's authenticated-principal contract, then secure the GitHub OAuth/sync ownership boundary.

### 2026-08-01 — Deployment baseline added

- Added a production backend Dockerfile, health check, Docker ignore rules, safer local PostgreSQL Compose configuration, and `backend/docs/DEPLOYMENT.md`.
- Local Compose now requires a developer-supplied `POSTGRES_PASSWORD` instead of shipping a reusable default password.
- Verified the Compose configuration and backend typecheck/test/build locally. Docker CLI is installed, but the local Docker Desktop Linux daemon is not running, so the image build itself is pending daemon availability.
- Next independent work: add real integration tests once an isolated test-database strategy is agreed; OAuth endpoint changes remain blocked on Owner 1's auth contract.

### 2026-08-01 — Baseline verification and test coverage

- Re-ran backend typecheck/test/build, frontend typecheck/build, Compose validation, and whitespace checks successfully.
- Added HTTP-level tests for `/health` plus healthy and unavailable `/ready` responses, so the operational endpoint contracts are covered by CI.
- Manually verified production configuration fails without `DATABASE_URL` and accepts a valid database URL plus 32-character JWT secret.
- Docker image execution remains pending because the local Docker Desktop Linux daemon is unavailable.

### 2026-08-01 — Docker build validation resumed

- Docker Desktop is now available. The first image build correctly exposed a Dockerfile defect: Prisma's post-install ran before `prisma/schema.prisma` was copied into the build stage.
- Updated the image build order, added OpenSSL/CA certificates for Prisma, and prevented an unnecessary Prisma post-install in the runtime stage. The rebuild exposed Prisma config's required datasource environment at client-generation time, so a non-secret build-only placeholder was added. Container health validation is in progress.
- Runtime validation exposed a Prisma packaging issue: the generated JavaScript client imports companion TypeScript files. The runtime image now copies the generated source tree to the resolved `dist/generated` path. Rebuild is required.
- External container validation confirms `/health` returns `200`. `/ready` correctly returns `503` on a failed readiness query; server-side diagnostic logging has been added so the precise database/Prisma error can be diagnosed without exposing it in the response.
- Completed Docker validation: image built successfully, backend connected to the Docker PostgreSQL service over the `backend_default` network, and both `/health` (`ok`) and `/ready` (`ready`) returned `200`. The existing local development database role password was reset to the documented local Compose value during this test.

### 2026-08-01 — GitHub credential protection started

- Added AES-256-GCM encryption for newly persisted GitHub provider tokens, with a production-only `TOKEN_ENCRYPTION_KEY` requirement and round-trip tests.
- Existing plaintext tokens remain usable once; the next successful sync rewrites them encrypted. GitHub manual sync now decrypts tokens before calling GitHub.
- Next: refactor repository sync to stage external data before database changes and replace delete-first writes with transactional upserts.

### 2026-08-01 — Non-destructive GitHub sync

- Replaced delete-first repository import with GitHub-ID upserts. Repository languages and commits are refreshed per repository.
- Stale repository removal now occurs only after all current repositories have been processed, preserving prior evidence if an import fails mid-sync.
- Language summaries are rebuilt after stale data is removed. Remaining improvement: prefetch source data and wrap all persistence in a single transaction.

### 2026-08-01 — GitHub source staging

- GitHub user, repository list, languages, and commits are now fetched before connection/repository persistence starts.
- Detail requests run with a bounded concurrency of four, avoiding unbounded GitHub API calls while improving sync time.
- A provider failure during source retrieval now leaves previously stored evidence untouched.

### 2026-08-01 — OAuth replay protection

- OAuth states are now consumed after their first successful validation and cannot be replayed during their 10-minute validity window.
- Added coverage for valid state consumption, callback replay rejection, and provider mismatch rejection.

### 2026-08-01 — GitHub API resilience

- GitHub API reads now time out after 15 seconds and detect GitHub's 429/secondary-rate-limit response patterns.
- Rate-limited requests retry up to three times, using provider retry/reset headers when available and bounded exponential backoff otherwise.
- Failed manual syncs now persist a `failed` status rather than leaving an outdated success state.

### 2026-08-01 — LinkedIn production guard

- LinkedIn OAuth access tokens now use the same encrypted-at-rest storage path as GitHub tokens.
- The demo-only LinkedIn preview endpoint is blocked in production so it cannot create fake provider connections in a live environment.

### 2026-08-01 — GitHub connection lifecycle

- GitHub OAuth now returns a clear service-unavailable response when provider credentials are not configured.
- Repository pagination has a 100-page ceiling to bound provider work.
- Added `DELETE /api/candidates/:candidateId/github` and frontend client support to remove a GitHub connection and its cascaded synced data.
- Added a candidate-dashboard Disconnect control with pending, success, and error feedback.

## Completion criteria

- Provider connections are session-bound, encrypted, recoverable, rate-limit aware, and observable.
- A new environment can deploy frontend, backend, database, worker, and storage from documented configuration.
- CI blocks failed builds, type errors, failed tests, insecure dependencies, and unverified migrations.
- Critical flows pass end-to-end and meet the agreed accessibility/release checklist.
