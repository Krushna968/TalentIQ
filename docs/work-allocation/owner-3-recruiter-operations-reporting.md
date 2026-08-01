# Owner 3 — Recruiter Operations, Reporting & Analytics

## Mission

Build the non-AI recruiter experience for searching, organizing, reviewing, and reporting on candidates. Ranking intelligence is excluded; this track consumes the data and APIs created by Owners 1 and 2.

## Work items

### 1. Recruiter organizations, jobs, and requisitions — P0

Add organization/team membership, recruiter roles, job requisitions, and recruiter-to-job permissions to the domain model. Provide CRUD APIs and screens for creating a role, assigning collaborators, opening/closing a requisition, and selecting candidate visibility rules.

All recruiter actions must be tenant-scoped and auditable. Agree schema and permission boundaries with Owner 1 before implementation.

### 2. Production talent search and shortlist actions — P1

Replace static in-memory data in `RecruiterSearch.jsx` with server-side search, filters, sorting, pagination, and shareable query URLs. Preserve a transparent non-AI filter set: location, verified evidence, skills, score ranges, source, and availability.

Add shortlist, notes, assigned recruiter, and saved view actions. Semantic/embedding search and AI-generated match rationales are intentionally excluded.

### 3. Pipeline and decision management — P0

Build `/recruiter/pipeline` as a persisted hiring workspace with stages, movement rules, bulk actions, notes, owner assignment, decision reasons, and an immutable decision timeline. Support optimistic UI updates with rollback and permission-aware collaboration.

The current React-context Hire/Hold/Reject state must be replaced with database-backed actions that survive refresh and record who changed what and when.

### 4. Candidate compare and dossier review — P1

Implement a comparison workspace with selected candidates, evidence-category views, verified-signal details, filters, and export/share controls. Build real dossier views from stored candidate/evidence data, including source attribution and access checks.

Do not add AI summaries in this task; reports should use deterministic templates and verified records only.

### 5. Analytics, operational reporting, and exports — P1

Replace the placeholder analytics route with date-filtered, organization-scoped metrics: funnel conversion, stage aging, time-to-decision, source performance, verification workload, and recruiter activity. Add CSV and deterministic PDF exports, with audit logging for shared reports.

Expose APIs that aggregate safely and avoid leaking candidate PII across organizations.

## Dependencies

Requires Owner 1’s auth/RBAC/API client and Owner 2’s candidate/evidence/job domain records. Align report/export storage and access with Owner 4’s production deployment plan.

## Definition of done

- Recruiters can manage real jobs, shortlists, pipelines, decisions, and comparisons after refresh.
- Search and analytics use paginated, tenant-scoped server APIs rather than static frontend arrays.
- All recruiter actions have authorization checks and audit data.
- Reporting/export flows are tested for permissions and empty/error states.
