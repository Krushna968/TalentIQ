# TalentIQ and Lyzr Step-by-Step Build Plan

## Outcome

Build six narrowly scoped Lyzr agents, connect them securely to the TalentIQ backend, and expose their results through the existing TalentIQ frontend routes.

Use Lyzr Studio to create, configure, test, version, and deploy the individual agents. Keep the main TalentIQ product in this repository. Use Architect only for optional multi-agent workflow experiments.

## Phase 0: Team Agreement

Complete this before anyone creates agents.

- [ ] Confirm the three owners:
  - Person 1: Evidence Verification and Skill Assessment
  - Person 2: Talent Matching and Recruiter Intelligence
  - Person 3: AI Interviewer and Resume/Profile
- [ ] Confirm the six agent names and owners.
- [ ] Agree that all Lyzr calls go through `backend/`.
- [ ] Agree that no Lyzr API key is placed in frontend code.
- [ ] Agree on the shared response envelope and `schemaVersion: "1.0"`.
- [ ] Agree on the first model, temperature, timeout, and maximum iterations.
- [ ] Decide who owns the Lyzr workspace and who can change production prompts.
- [ ] Set the development credit limit and keep a demo reserve.

Deliverable: a short team decision recorded in the repository issue or project notes.

## Phase 1: Prepare the Lyzr Workspace

1. Open Lyzr Studio and sign in.
2. Open the organization menu and locate `Account & API Key`.
3. Create or copy the Lyzr API key.
4. Store the key in the backend secret manager or local backend environment only.
5. Do not commit the key or paste it into React environment variables.
6. Confirm the workspace can create and test a small sample agent.
7. Confirm the available models and current credit usage page.

Deliverable: working Lyzr workspace access without exposing the key in Git.

## Phase 2: Create the Shared Backend Contract

Before connecting real agents, define the contract all six agents follow.

```json
{
  "schemaVersion": "1.0",
  "agent": "agent-name",
  "requestId": "req_123",
  "status": "complete",
  "result": {},
  "citations": [],
  "warnings": [],
  "confidence": 0.82
}
```

- [ ] Define `complete`, `needs_review`, and `failed` statuses.
- [ ] Define source citation format using evidence or input IDs.
- [ ] Define the result schema for each agent.
- [ ] Define maximum input size and output size.
- [ ] Define behavior for missing, contradictory, or unverified evidence.
- [ ] Define the request ID and session ID format.
- [ ] Create one fixture file per agent with realistic but fake data.

Deliverable: versioned schemas and fixtures that do not require Lyzr to run.

## Phase 3: Create the Six Agents in Studio

Create one agent at a time. Do not create a single general-purpose TalentIQ agent.

### Agent 1: Evidence Verification AI

- [ ] Name: `TalentIQ Evidence Verification`.
- [ ] Define role: evidence verification analyst.
- [ ] Define goal: assess whether submitted evidence supports the stated claim.
- [ ] Add rules against inventing facts or treating claims as proof.
- [ ] Require source IDs, verification status, reasons, warnings, and confidence.
- [ ] Start without external tools; pass normalized evidence as JSON.
- [ ] Test with valid, incomplete, contradictory, and suspicious evidence.
- [ ] Save and record the agent ID.

### Agent 2: Skill Assessment AI

- [ ] Name: `TalentIQ Skill Assessment`.
- [ ] Define role: evidence-grounded skills assessor.
- [ ] Define goal: infer skills only from verified evidence.
- [ ] Require skill name, level, score, confidence, supporting source IDs, and gaps.
- [ ] Do not allow the agent to upgrade unverified evidence.
- [ ] Test with strong, weak, and mixed skill evidence.
- [ ] Save and record the agent ID.

### Agent 3: Talent Matching AI

- [ ] Name: `TalentIQ Talent Matching`.
- [ ] Define role: candidate-to-job matching analyst.
- [ ] Define goal: compare verified candidate skills against explicit job requirements.
- [ ] Require match score, matched requirements, missing requirements, risks, and explanation.
- [ ] Test strong match, partial match, weak match, and missing job data.
- [ ] Save and record the agent ID.

### Agent 4: AI Interviewer

- [ ] Name: `TalentIQ AI Interviewer`.
- [ ] Define role: structured technical and behavioral interviewer.
- [ ] Define goal: ask adaptive questions and evaluate answers fairly.
- [ ] Require one question or one evaluation object per turn.
- [ ] Add rules against asking for secrets, protected personal information, or irrelevant data.
- [ ] Use a stable session ID for each interview.
- [ ] Test technical, behavioral, skipped-answer, and unclear-answer flows.
- [ ] Save and record the agent ID.

### Agent 5: Resume and Profile AI

- [ ] Name: `TalentIQ Resume Profile`.
- [ ] Define role: evidence-grounded career profile writer.
- [ ] Define goal: create accurate resume and profile content from supplied data.
- [ ] Require every achievement to trace back to an input source.
- [ ] Mark missing information instead of filling it with invented details.
- [ ] Test a complete profile, sparse profile, and conflicting dates.
- [ ] Save and record the agent ID.

### Agent 6: Recruiter Intelligence AI

- [ ] Name: `TalentIQ Recruiter Intelligence`.
- [ ] Define role: recruiter decision-support analyst.
- [ ] Define goal: summarize candidate evidence and surface useful comparison insights.
- [ ] Require neutral explanations, evidence references, risks, and recommended next actions.
- [ ] Do not allow automatic rejection based on protected characteristics or unsupported assumptions.
- [ ] Test candidate comparison, shortlist explanation, and missing-data cases.
- [ ] Save and record the agent ID.

Deliverable: six tested Studio agents and six recorded agent IDs.

## Phase 4: Add Backend Configuration

Add the following values to the backend secret environment. Use the real IDs from Studio.

```env
LYZR_API_KEY=server-only-secret
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

- [ ] Add environment validation so startup fails clearly when a required value is missing.
- [ ] Add `.env` files to `.gitignore` if not already covered.
- [ ] Confirm secrets are available in local development and deployment environments.
- [ ] Never return `LYZR_API_KEY` in an API response or error message.

Deliverable: backend configuration loaded only by the server.

## Phase 5: Implement One Shared Lyzr Client

Create one backend client instead of six separate HTTP implementations.

The client should:

- [ ] Build the URL from `LYZR_BASE_URL` and the configured agent ID.
- [ ] Send `x-api-key` and JSON headers.
- [ ] Accept `agent`, `message`, `sessionId`, and structured input.
- [ ] Apply a request timeout.
- [ ] Retry only one transient failure.
- [ ] Parse the Lyzr response.
- [ ] Normalize the response into the shared envelope.
- [ ] Reject malformed JSON and return `needs_review` or `failed`.
- [ ] Attach `requestId`, latency, and agent name to logs.
- [ ] Avoid logging raw resumes, documents, API keys, or sensitive candidate data.

Use normal agent chat first. Add streaming for the interview UI only after the non-streaming path is stable. Add multimodal file input only after privacy, retention, and cost decisions are approved.

Deliverable: one reusable Lyzr client with mocked tests.

## Phase 6: Implement AI Services and API Routes

Each owner implements service methods against fixtures first.

### Person 1

- [ ] Evidence verification service.
- [ ] Skill assessment service.
- [ ] Verification result persistence.
- [ ] Candidate skill profile persistence.
- [ ] Verification and assessment API routes.

### Person 2

- [ ] Job requirement normalization service.
- [ ] Talent matching service.
- [ ] Recruiter insight and comparison service.
- [ ] Match result persistence.
- [ ] Matching, recruiter search, compare, and pipeline API routes.

### Person 3

- [ ] Interview session and turn service.
- [ ] Interview report service.
- [ ] Resume and profile generation service.
- [ ] Interview and draft persistence.
- [ ] Interview, report, resume, and profile API routes.

Every route must authenticate the user, validate input, call a service, validate the AI result, and return a stable API response.

Deliverable: backend endpoints returning fixture-backed results before real Lyzr calls are enabled.

## Phase 7: Connect the Frontend

Connect one user flow at a time:

1. Candidate submits evidence.
2. Frontend calls TalentIQ verification API.
3. Verification result appears with sources, warnings, and confidence.
4. Skill profile is generated from verified evidence.
5. Recruiter uses matching and comparison.
6. Candidate starts an interview and receives a report.
7. Candidate generates a resume/profile draft.

- [ ] Replace static candidate data only after the corresponding API route works.
- [ ] Add loading, empty, retry, and `needs_review` states.
- [ ] Do not show raw Lyzr response details that are not part of the product contract.
- [ ] Show evidence sources wherever a score or recommendation is displayed.
- [ ] Keep deterministic permission and eligibility decisions outside the model.

Deliverable: at least one working frontend route per AI.

## Phase 8: Test and Evaluate

For each AI, run at least ten fixture cases:

- [ ] Normal successful input.
- [ ] Missing required input.
- [ ] Contradictory input.
- [ ] Low-confidence input.
- [ ] Prompt-injection attempt inside candidate text.
- [ ] Very long input.
- [ ] Malformed or unavailable Lyzr response.
- [ ] Timeout.
- [ ] Permission failure.
- [ ] Repeat request with the same fixture.

Record:

- [ ] Accuracy and groundedness.
- [ ] False-positive and false-negative behavior.
- [ ] Response latency.
- [ ] Credit or token usage where available.
- [ ] Schema validation failures.
- [ ] Human review notes.

Do not use real candidate data until the fixture evaluation passes and data retention has been approved.

## Phase 9: Credit Control

With the $20 balance:

- [ ] Use small fixtures and short outputs.
- [ ] Test each agent with five to ten initial calls.
- [ ] Cache repeated local requests.
- [ ] Keep max iterations low.
- [ ] Avoid repeatedly sending full PDFs, resumes, or repositories.
- [ ] Track usage by agent and request ID.
- [ ] Keep at least 25% of the balance for final integration and demo testing.
- [ ] Stop and review if any single agent consumes more than its planned share.

The team should confirm current Lyzr pricing and credit behavior inside the workspace before setting exact dollar limits.

## Phase 10: Release Checklist

- [ ] All six agent IDs are configured in deployment secrets.
- [ ] No API key exists in Git history, frontend code, or browser network payloads.
- [ ] Backend tests pass.
- [ ] Frontend tests/build pass.
- [ ] Every AI has timeout and malformed-response handling.
- [ ] Every score or recommendation has source references or an explicit warning.
- [ ] Logs contain request IDs but not sensitive raw documents.
- [ ] Usage and credit balance were checked after integration testing.
- [ ] Human reviewers approved representative outputs.
- [ ] The deployment environment has the same Lyzr base URL and agent configuration expected by the backend.

## Useful References

- Lyzr Studio agent building: https://docs.lyzr.ai/enterprise/agent-studio/agents/studio
- Lyzr conversational builder: https://docs.lyzr.ai/enterprise/agent-studio/agents/conversational-builder
- Lyzr agent concepts and API modes: https://docs.lyzr.ai/enterprise/get-started/concepts/agents
- Lyzr API introduction: https://docs.lyzr.ai/api-docs/introduction/introduction
