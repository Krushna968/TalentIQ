# Backend Deployment Baseline

## Container

Build the backend image from the `backend` directory:

```powershell
docker build -t talentiq-backend .
```

The image runs the compiled Express application on port `4000` and exposes `/health` (process liveness) and `/ready` (database readiness). A deployment platform should use `/health` for liveness and `/ready` before routing traffic after a database migration.

## Required production configuration

Set these in the deployment platform's secret manager, never in the image, source control, or `VITE_*` variables:

- `DATABASE_URL`
- `JWT_SECRET` — at least 32 random characters
- `GITHUB_CLIENT_SECRET` and `LINKEDIN_CLIENT_SECRET`, when their integrations are enabled

Also configure the public callback URLs, `FRONTEND_URL`, and `CORS_ORIGIN` for the deployed frontend. Set `NODE_ENV=production`; the server fails during startup if `DATABASE_URL`, a strong `JWT_SECRET`, or `TOKEN_ENCRYPTION_KEY` is missing.

## Local PostgreSQL

Copy `backend/.env.example` to `backend/.env`, choose a local `POSTGRES_PASSWORD`, and run:

```powershell
docker compose up -d postgres
```

Do not reuse local credentials for staging or production. The compose service includes a PostgreSQL health check; application startup should wait for it or retry the connection in the chosen deployment workflow.

## Before production release

1. Run database migrations using the production migration command in a controlled deployment step.
2. Confirm `/health` and `/ready` return `200` after the migration.
3. Configure centralized redacted logs, error tracking, backups, monitoring, and alerts.
4. Document rollback and restore procedures for the selected hosting provider.
