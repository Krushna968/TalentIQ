# Owner 2 — Candidate, Evidence & Verification Workflows

## Mission

Turn the candidate-side prototype into persisted, reviewable workflows. This scope covers non-AI data capture, review, and presentation of evidence; it excludes AI analysis/scoring.

## Work items

### 1. Complete the core domain schema and services — P0

Extend Prisma beyond the current Candidate/provider records with profile, roadmap, resume version, job, application, evidence review, badge, verification run, attachment, audit-log, and relevant recruiter-facing relations. Add migrations, enums, constraints, indexes, seed data, transactional service methods, filtering, and pagination.

Replace candidate/evidence/hackathon/trust demo responses with database-backed services. Keep deterministic talent-score storage wired to verified evidence, but do not add AI logic in this track.

### 2. Candidate profile and talent identity workspace — P1

Build the real `/candidate/profile` workspace: editable personal profile, public visibility controls, linked accounts, selected projects, work history, credentials, preview, draft/publish, and validation. Replace the static dashboard activity, skills, commits, and roadmap sections with paginated API data and source-sync status.

Ensure every editable field has save/cancel/retry behavior and users can understand what recruiters can see.

### 3. Evidence library and human review lifecycle — P0

Create a candidate evidence library with source-specific fields, drafts, URL previews, upload attachments, filtering, edit/delete/resubmit actions, and visible status history. Implement a controlled lifecycle: draft → submitted → under review → verified/rejected/expired, including reviewer, timestamp, reason, and candidate appeal/correction flow.

Build reviewer/admin queue screens or APIs with pagination, ownership checks, audit history, and explicit status transition rules. Verification must be based on real source/reviewer records rather than fixed controller responses.

### 4. Candidate product workflows — P1

Deliver roadmap CRUD, manual resume composition/versioning/template choice/PDF export, job save/apply/ignore tracking, and application status history. These are standard product workflows; automated resume generation and recommendation intelligence remain out of scope as AI work.

Build dedicated screens for profile, roadmap, resume builder, jobs, verification, hackathons, presentations submission/history, team contributions, trust review, and interview report instead of generic `ProductModule` content.

### 5. File storage and evidence safety — P0

Implement private object storage with presigned upload flow, attachment metadata, type/size validation, malware scanning policy, and safe download authorization. Do not store files directly in the application database or expose private evidence through predictable URLs.

Add expiry/reverification jobs and candidate notifications for expiring credentials or failed uploads.

## Dependencies

Requires Owner 1’s authenticated API client, RBAC rules, and initial account schema. Coordinate evidence data contracts with Owner 4’s source integrations.

## Definition of done

- Candidate data and evidence persist after refresh and are scoped to the signed-in user.
- Evidence statuses, review decisions, and audit history are real and traceable.
- All candidate routes are functional workspaces, not static placeholder modules.
- Upload and workflow integration tests cover authorization and failed states.
