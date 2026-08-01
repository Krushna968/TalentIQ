# Background jobs and worker operations

TalentIQ uses Redis and BullMQ for work that must not block API requests. PostgreSQL stores the public, durable job record used by the UI and operations APIs.

## Local startup

```powershell
cd backend
docker compose up -d
npm run dev
npm run worker:dev
```

Use a second terminal for the worker. `REDIS_URL`, `QUEUE_PREFIX`, and `WORKER_CONCURRENCY` are configured in `.env`.

## Job contract

| Job | Trigger | Current behavior |
|---|---|---|
| `source.sync` | Candidate requests GitHub re-sync | Fetches and safely upserts GitHub evidence in the worker. |
| `upload.scan` | Client completes an attachment upload | Quarantines the attachment until a production malware-scanner adapter is approved. |
| `evidence.expiry` | Scheduled daily | Marks verified evidence past `expiresAt` as expired. |
| `notification.deliver` | New in-app notification | Delivers the in-app record; email/webhook delivery requires an approved adapter. |
| `webhook.process` | Provider webhook | Reserved and fails safely until a signed provider adapter exists. |
| `report.export` | Requested export | Reserved and fails safely until the report/export contract is finalized. |

Jobs have idempotency keys, five-attempt exponential backoff, durable status, and dead-letter state. Operators can use these protected endpoints after authentication is enabled:

- `GET /api/operations/queue/health`
- `GET /api/operations/jobs`
- `GET /api/operations/jobs/metrics`
- `POST /api/operations/jobs/:jobId/retry`

The GitHub dashboard reads `GET /api/candidates/:candidateId/github/sync-status` while a sync is queued or active.

## Storage safety contract

Upload intent only creates an attachment record and a private storage key. Direct object-store signing, scanner callbacks, and download URLs must be backed by the approved storage/scanner provider. Do not mark an attachment clean from browser input; only a trusted worker/provider callback may transition it to `CLEAN`.