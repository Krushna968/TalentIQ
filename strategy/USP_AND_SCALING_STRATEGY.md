# TalentIQ USP and Scale Strategy

## Decision

Build TalentIQ around a **Proof-to-Hire Passport**: a role-specific, explainable decision brief built from source-linked evidence, not a generic AI score.

**Pitch:** *TalentIQ turns scattered work into a verified Proof-to-Hire Passport that shows who can do the job, why the evidence is credible, and what hiring risk remains.*

This is a stronger USP than “AI recruitment” or an overall Talent Score. Most hiring products rank resumes; TalentIQ makes a decision defensible from real work across code, hackathons, team delivery, presentations, and interviews.

## The product moment to demo

A recruiter asks: “Can I safely interview this candidate for a junior AI engineer role?”

TalentIQ returns a one-page Passport:

- **Role readiness:** a clear `Ready / Develop / Insufficient evidence` outcome, with a match range rather than false precision.
- **Proof cards:** repository, hackathon, presentation, team contribution, interview, and credential claims, each linking back to the original source.
- **Evidence quality:** source authority, recency, depth, and cross-source consistency for every proof card.
- **Trust and risk:** duplicate/copied-content indicators, unverifiable claims, stale evidence, and explicit uncertainty.
- **Explainable recommendation:** why the candidate fits, the strongest evidence, gaps against this role, and the single best next evaluation step.
- **Candidate-owned sharing:** candidates choose which proof is visible to a company and can see exactly what was used.

The key visual is a **Proof Graph**: each role competency connects to the independent evidence supporting it. A recruiter should be able to go from a conclusion to the source in one click.

## Why it wins

| Evaluation area | How the Passport demonstrates it |
| --- | --- |
| Innovation & originality | Reframes recruitment from resume ranking into auditable proof and residual-risk assessment. |
| AI implementation | AI extracts structured claims, maps evidence to role competencies, detects conflicts, summarizes findings, and proposes the next best assessment. |
| Technical complexity | Evidence normalization, provenance, trust scoring, semantic matching, fraud signals, async ingestion, and explainability are connected in one coherent system. |
| User experience | One decision-ready screen replaces multiple dashboards and avoids black-box scores. |
| Scalability & architecture | Evidence processing is asynchronous and modular; online search and the API stay lightweight. |
| Business impact | Reduces recruiter verification work and unlocks an immediate talent pipeline from hackathons and communities. |

## Scoring model: no magic number

Keep the existing Talent Score for discovery, but make the Passport the hiring product. For a given role, calculate four visible dimensions:

```text
Role Readiness = competency evidence × relevance × recency
Evidence Confidence = source authority × depth × cross-source consistency
Trust Risk = plagiarism + duplication + identity mismatch + unverifiable-claim signals
Decision = readiness, confidence, risk, and remaining evidence gap
```

The exact weights are configurable by role and must be shown in the explanation. Do not claim that the model “proves” a candidate’s ability; it prioritizes and explains evidence for human review. This is both more credible to judges and safer for a real hiring product.

## Feasible hackathon scope

Implement a convincing vertical slice around one role, such as **Junior AI/Full-stack Engineer**.

### Must build

1. Candidate connects GitHub or selects a seeded repository; upload/select a hackathon project and a PDF/PPT.
2. Backend creates normalized evidence records with source URL, timestamp, owner, extracted competencies, and verification status.
3. AI analysis produces a short repository/project summary, contribution signals, presentation summary, competency mapping, and explanations.
4. Recruiter opens the role-specific Passport, inspects source-linked proof, sees confidence/risk, and moves the candidate into a pipeline.
5. A “what would change this decision?” card recommends a targeted interview question or a short task for the largest evidence gap.

### Deliberately simulate for the demo

- A small, documented set of candidate evidence and analysis outputs.
- Basic duplicate/plagiarism indicators based on content similarity and URL/hash matches.
- AI interview scoring from a scripted or recorded response.

Never simulate external verification as if it were real. Mark seeded data and prototype signals clearly.

## Architecture that can actually scale

```text
Sources (GitHub, hackathon, uploads, interview)
  -> connector adapters -> evidence store + object storage
  -> queue -> extractors / AI evaluators -> normalized evidence + provenance
  -> scoring service -> Passport materialization + search index
  -> API -> recruiter and candidate applications
```

- **Ingestion is asynchronous:** webhook or scheduled connectors place jobs on a queue; slow file parsing and AI calls never block the user request.
- **Evidence is immutable and versioned:** retain source URL/hash, collection time, parser/model version, and consent state. Re-score from stored evidence when scoring changes.
- **AI is bounded:** use deterministic checks for identity, hashes, timestamps, and scoring policy; use LLMs for extraction, summaries, and explanations with schema validation.
- **Search is two-stage:** vector/keyword retrieval narrows the pool, then role-aware ranking computes the Passport only for the top candidates.
- **Storage fit:** PostgreSQL for users, roles, consent, evidence metadata, and pipeline; object storage for uploads; Redis/queue for jobs; pgvector initially for retrieval. Add graph storage only after evidence relationships justify it.
- **Privacy by design:** candidate consent gates employer visibility; PII is separated from evidence; audit every recruiter view; provide deletion/export.

This is feasible from the current Express + Prisma foundation. It does not require adopting Neo4j, microservices, or a multi-agent framework during the hackathon.

## Business model and go-to-market

### Beachhead: hackathon organizers and campuses

Organizers already have participants, project submissions, judges, and employers. TalentIQ turns the end of a hackathon into a consented, evidence-backed hiring pool instead of a lost spreadsheet.

- **Organizer SaaS:** per-event fee for submissions, judging, Proof Passports, rankings, and employer access.
- **Recruiter SaaS:** recruiter-seat subscription plus usage/shortlist credits for verified Passport access.
- **Campus/community tier:** cohort dashboard and placement analytics; free candidate Passport builds supply.
- **Enterprise expansion:** ATS integrations, private talent pools, audit exports, SSO, and governance controls.

### Business outcome metrics to track

- Time from event close to first recruiter shortlist.
- Recruiter verification time per candidate.
- Passport-to-interview conversion versus resume-only candidates.
- Interview-to-offer conversion for high-confidence candidates.
- Candidate consent/share rate and evidence completion rate.

Frame projected improvements as hypotheses to validate, not invented percentages.

## Presentation narrative

1. **Problem:** a capable builder’s proof is fragmented; a recruiter cannot trust a resume quickly.
2. **Demo:** show a role query, open a Passport, follow a proof card back to GitHub/hackathon/pitch evidence, expose one honest risk, then move the candidate forward.
3. **Why AI:** AI converts unstructured work into structured, explainable evidence; it does not replace the hiring decision.
4. **Why now:** hackathons and developer communities create rich, underused work signals.
5. **Scale and business:** connector-to-queue architecture, consented evidence, organizer-first distribution, recurring recruiter value.

## Implementation order after approval

1. Add a `strategy`-isolated technical spec and data model for evidence, provenance, competency mappings, and Passport results.
2. Add the Passport experience as a new route without destabilizing existing dashboards.
3. Implement seeded end-to-end evidence analysis first, then a real GitHub connector.
4. Add queue-backed ingestion, object storage, and re-scoring before broadening connector coverage.

