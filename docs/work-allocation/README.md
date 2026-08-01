# TalentIQ Non-AI Delivery Allocation

This folder divides all remaining **non-AI** delivery work across four owners. AI scoring, embeddings, interview evaluation, model orchestration, and fraud models are deliberately excluded.

## Delivery order

1. Owner 1 establishes secure identity and the shared API/data foundation.
2. Owner 2 builds persisted candidate and evidence workflows on that foundation.
3. Owner 3 delivers recruiter operations, reporting, and analytics using the same domain APIs.
4. Owner 4 completes external integrations, production readiness, and cross-product quality.

Each owner document contains a bounded scope, concrete tasks, dependencies, and definition of done. Shared changes require an API/schema review before merge; Owner 1 owns the initial contracts and Owner 4 owns the release quality gate.

## Current-state evidence

- Most advertised routes currently render the generic `ProductModule` placeholder.
- Many backend controllers return values from `backend/src/data/demo.ts`; the frontend primarily uses `frontend/src/data/candidates.js`.
- Authentication, validation, and authorization middleware are scaffolds rather than production controls.
- The existing deterministic GitHub/talent-score work remains in scope only for integration and operational reliability, not AI enhancement.
