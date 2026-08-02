# TalentIQ AI Work Allocation and Lyzr Integration

## Purpose

This document divides the six TalentIQ AIs between three people and defines the shared contract needed to build them independently. It also explains how to create the agents in Lyzr and connect them to the TalentIQ backend.

The six AIs are application capabilities, not six separate frontend pages:

1. Evidence Verification AI: checks whether submitted work and credentials are credible, relevant, and supported by evidence.
2. Skill Assessment AI: converts verified evidence into skill scores, confidence, strengths, and gaps.
3. Talent Matching AI: compares a candidate's verified profile against a job and explains the match.
4. AI Interviewer: asks adaptive technical and behavioral questions and produces a structured interview report.
5. Resume and Profile AI: creates resumes, portfolio summaries, and profile improvement recommendations from verified data.
6. Recruiter Intelligence AI: supports search, comparison, ranking, shortlisting, and risk explanations for recruiters.

## Three-Person Split

Each owner can develop and test their AIs using fixtures and the shared backend contract. No owner should call Lyzr directly from React or change another owner's agent prompt without a review.

### Person 1: Evidence and Candidate Intelligence

Owns:

- Evidence Verification AI
- Skill Assessment AI
- Evidence input normalization and verification result schemas
- Candidate evidence and skill-profile service boundaries

Deliverables:

- Agent IDs and prompts for verification and assessment
- `VerificationResult` and `SkillAssessmentResult` JSON schemas
- Backend service methods that accept evidence and return validated JSON
- Test fixtures for GitHub projects, certificates, hackathons, presentations, and incomplete evidence

### Person 2: Matching and Recruiter Intelligence

Owns:

- Talent Matching AI
- Recruiter Intelligence AI
- Job requirement normalization, candidate comparison, and ranking schemas
- Matching, recruiter search, compare, and pipeline service boundaries

Deliverables:

- Agent IDs and prompts for matching and recruiter workflows
- `MatchResult` and `RecruiterInsightResult` JSON schemas
- Backend service methods that accept candidate/job data and return explanations
- Test fixtures for strong matches, weak matches, missing skills, and conflicting evidence

### Person 3: Interview and Candidate Presentation

Owns:

- AI Interviewer
- Resume and Profile AI
- Interview session, question, report, resume, and profile schemas
- Interview and candidate-facing API integration

Deliverables:

- Agent IDs and prompts for interview and resume/profile workflows
- `InterviewTurnResult`, `InterviewReportResult`, and `ResumeDraftResult` schemas
- Backend service methods for interview turns, reports, resume drafts, and profile suggestions
- Test fixtures for technical interviews, behavioral interviews, and incomplete candidate profiles

## Shared Rules for Independent Work

The following rules prevent integration conflicts:

- All Lyzr calls happen in `backend/`; the frontend only calls TalentIQ's `/api` routes.
- Every AI response must be parsed as JSON and validated before it reaches a controller or the frontend.
- Every request carries a `requestId`, `candidateId` when available, and a stable `sessionId` for multi-turn interviews.
- Prompts must say that the model must not invent evidence, credentials, scores, employers, or interview answers.
- Evidence-based outputs must include citations or source IDs referring to the supplied input objects.
- Agents return recommendations and explanations; deterministic business rules decide hard eligibility, permissions, and final workflow state.
- Keep each agent prompt and Lyzr agent ID in configuration, not scattered through controllers.
- Use fixtures and mocked Lyzr responses while another person's backend changes are in progress.

## Shared AI Response Contract

Every agent should return this envelope, with an agent-specific `result` object:

```json
{
  "schemaVersion": "1.0",
  "agent": "evidence-verification",
  "requestId": "req_123",
  "status": "complete",
  "result": {},
  "citations": [
    { "sourceId": "evidence_123", "claim": "Repository contains a deployed demo" }
  ],
  "warnings": [],
  "confidence": 0.82
}
```

Allowed statuses are `complete`, `needs_review`, and `failed`. Confidence is a signal, not proof. A low-confidence or contradictory result should become `needs_review` instead of being silently accepted.

## Recommended Build Sequence

The owners can work in parallel after the contract is agreed, but the product dependency order is:

1. Agree on schemas, fixture format, logging fields, and environment variables.
2. Person 1 builds evidence verification and skill assessment with fixtures.
3. Person 2 builds matching and recruiter intelligence against fixture candidate profiles.
4. Person 3 builds interview and resume/profile against fixture candidate profiles.
5. Integrate all six through one Lyzr client and one backend AI service layer.
6. Connect the existing screens and replace static demo data route by route.
7. Run an evaluation set before spending more credits or exposing the agents to users.

## Lyzr Setup

Lyzr's current Agent API documentation lists this base URL:

```text
https://agent-prod.studio.lyzr.ai/
```

Create the agents in Lyzr Studio, record each returned agent ID, and keep the IDs in the backend environment. Use one saved agent per capability so prompts, model settings, tools, and usage can be changed independently.

### Account and key

1. Sign in to Lyzr Studio.
2. Open the organization menu and choose `Account & API Key`.
3. Create or copy the API key.
4. Add it only to the backend environment as `LYZR_API_KEY`.
5. Never commit the key, place it in `frontend/.env`, or send it to the browser.

### Agent configuration

For each agent configure:

- A narrow name and role, such as `TalentIQ Evidence Verification`.
- A system prompt with scope, refusal rules, input assumptions, and output schema.
- A low enough temperature for repeatable evaluation, normally around `0.1` to `0.3` for scoring.
- Structured JSON output if available in the selected Lyzr configuration.
- Only the tools and knowledge sources required for that capability.
- A bounded maximum iteration count so one request cannot consume the whole credit balance.

Do not make one giant general-purpose agent. Six narrow agents are easier to evaluate, replace, and budget.

### Creating an agent through the API

Lyzr documents agent creation as:

```text
POST https://agent-prod.studio.lyzr.ai/v3/agents/
x-api-key: <LYZR_API_KEY>
Content-Type: application/json
```

The exact model and credential fields depend on the Lyzr workspace configuration. Prefer creating the first six agents in Studio, then storing their IDs. A minimal shape is:

```json
{
  "name": "TalentIQ Evidence Verification",
  "description": "Verifies candidate evidence without inventing facts.",
  "system_prompt": "Return only the documented JSON schema...",
  "provider_id": "openai",
  "model": "gpt-4o-mini",
  "temperature": 0.2,
  "response_format": {}
}
```

Treat the fields shown by the Lyzr workspace as authoritative because available model and credential options can vary by account.

## TalentIQ Backend Connection

The backend should act as a thin, authenticated adapter around Lyzr:

```text
React screen -> TalentIQ /api route -> controller -> AI service -> Lyzr agent
                                              -> validate JSON -> database/audit log
```

Suggested backend environment variables:

```env
LYZR_API_KEY=replace-with-server-secret
LYZR_BASE_URL=https://agent-prod.studio.lyzr.ai
LYZR_AGENT_EVIDENCE_VERIFICATION=agent-id
LYZR_AGENT_SKILL_ASSESSMENT=agent-id
LYZR_AGENT_TALENT_MATCHING=agent-id
LYZR_AGENT_INTERVIEWER=agent-id
LYZR_AGENT_RESUME_PROFILE=agent-id
LYZR_AGENT_RECRUITER_INTELLIGENCE=agent-id
LYZR_TIMEOUT_MS=30000
LYZR_MAX_RETRIES=1
```

The backend client should:

1. Check that the API key and requested agent ID exist.
2. Send `x-api-key` and JSON content headers.
3. Use a timeout and at most one retry for transient failures.
4. Include a stable `session_id` only for conversational workflows.
5. Parse the Lyzr response and normalize it into the shared response envelope.
6. Validate the result against the agent's schema.
7. Log latency, agent name, status, token/credit metadata if returned, and request ID, but never log the API key or raw sensitive candidate documents.

Lyzr documents standard agent calls as `POST /v3/agent/{id}/chat`, with `stream-chat` and `multimodal-chat` available for streaming or file/image inputs. Use normal chat for evidence JSON, matching, scoring, resume drafts, and interview turns initially. Add multimodal input only when the file flow has an explicit privacy and retention decision.

Illustrative request shape:

```json
{
  "user_id": "talentiq-system",
  "session_id": "candidate-123-assessment",
  "message": "Evaluate the supplied evidence and return the required JSON object.",
  "metadata": {
    "requestId": "req_123",
    "candidateId": "candidate-123",
    "input": {}
  }
}
```

The exact chat payload should be confirmed against the selected Lyzr agent API version before implementation; keep it inside one client module so an endpoint change affects one file.

## Credit Plan for the $20 Balance

The exact credit cost depends on the selected model, input size, output size, tools, and iteration count. Do not treat the $20 balance as development capacity until the workspace shows the current pricing.

Use this operating policy:

- First spend only on six agent smoke tests, five to ten calls per agent.
- Use short fixtures and small outputs during development.
- Keep temperature and max iterations low for scoring agents.
- Cache identical fixture requests during local testing.
- Do not send full resumes, repositories, or PDFs repeatedly; preprocess and truncate inputs.
- Require a manual confirmation before expensive tools, multimodal calls, or long interviews.
- Reserve at least 25% of the balance for final integration and demo testing.
- Record cost or usage metadata per `requestId` so the team can see which agent consumes credits.

Suggested initial budget allocation:

| Work | Budget share | Purpose |
|---|---:|---|
| Agent setup and smoke tests | 15% | Confirm credentials, IDs, and response shape |
| Evidence and assessment | 20% | Highest dependency and evaluation priority |
| Matching and recruiter | 15% | Test ranking and explanations |
| Interview and resume/profile | 20% | Test multi-turn and longer outputs |
| Integration regression | 15% | Verify all six through TalentIQ routes |
| Final demo reserve | 15% | Keep credits available for the presentation |

## Definition of Done Per AI

An AI is ready for integration when it has:

- A named Lyzr agent and recorded agent ID.
- A versioned prompt and response schema.
- At least ten fixture tests covering success, missing input, contradiction, and failure.
- A backend service method that never exposes the Lyzr key.
- Timeout, retry, validation, and `needs_review` handling.
- At least one UI route consuming the TalentIQ API response.
- A usage log showing request count and approximate credit consumption.
- Human review of representative outputs before real candidate data is used.

## First Meeting Checklist

Before coding, the three people should agree on:

- The six agent names and owners.
- The shared response envelope and schema version.
- The fixture format and ten test cases per AI.
- The database fields needed for evidence, scores, matches, interviews, and reports.
- The Lyzr model, temperature, and max-iteration defaults.
- Who controls the Lyzr workspace and who may change agent prompts.
- The credit ceiling for development and the approval rule for spending beyond it.

## References

- Lyzr API introduction: https://docs.lyzr.ai/api-docs/introduction/introduction
- Lyzr agent creation: https://docs.lyzr.ai/agent-apis/agents/Create%20Agent
- Lyzr agent concepts and chat modes: https://docs.lyzr.ai/enterprise/get-started/concepts/agents
- Lyzr chat API reference: https://docs.lyzr.ai/agent-api/inferences/chat
