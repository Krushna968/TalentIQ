# Person 3: Lyzr Interview and Resume/Profile Implementation

## Your Responsibility

You own these two TalentIQ capabilities:

1. **TalentIQ AI Interviewer**: adaptive technical and behavioral interview questions, answer evaluation, and interview reports.
2. **TalentIQ Resume Profile AI**: evidence-grounded resume drafts, portfolio summaries, profile writing, and improvement suggestions.

You own the full path for these capabilities:

```text
Lyzr Studio agent
    -> Lyzr test and version
    -> TalentIQ backend service
    -> TalentIQ API route
    -> React screen
    -> test fixtures and handoff
```

Do not build these agents in Architect. Create and configure both agents in **Lyzr Studio**, then connect their APIs through the TalentIQ backend.

## Existing Files You Will Touch

Current interview frontend:

- `frontend/src/screens/AIInterview.jsx`
- `frontend/src/lib/api.js`

Current interview backend:

- `backend/src/routes/interview.routes.ts`
- `backend/src/controllers/interview.controller.ts`
- `backend/src/services/ai.service.ts`

Current resume/profile backend:

- `backend/src/routes/ai.routes.ts`
- `backend/src/controllers/ai.controller.ts`
- `backend/src/services/ai.service.ts`
- `backend/src/services/resume-score.service.ts`
- `backend/src/services/resume-upload.service.ts`

Existing API calls:

```text
GET  /api/interviews/questions?role=...&skills=...
POST /api/interviews/submit
POST /api/ai/resume-draft
POST /api/ai/resume-score
POST /api/ai/resume-score/upload
```

The current interview screen already expects:

```json
{
  "question": "...",
  "category": "technical",
  "rubric": ["...", "..."]
}
```

and:

```json
{
  "scores": {
    "technical": 0,
    "communication": 0,
    "problemSolving": 0,
    "overall": 0
  },
  "feedback": "...",
  "strengths": ["..."],
  "improvements": ["..."],
  "nextQuestion": {
    "question": "...",
    "category": "technical",
    "rubric": ["..."]
  }
}
```

## Part 1: Prepare Lyzr Studio

1. Open Lyzr Studio after signing in.
2. Go to **Agents** or **Agent Builder**.
3. Select **New Agent**.
4. Create the interview agent first.
5. Use the exact name and configuration below.
6. Test it in the Playground.
7. Save it and record its agent ID.
8. Create the resume/profile agent.
9. Test it in the Playground.
10. Save it and record its agent ID.

For each agent, use Studio fields for:

- Name
- Description
- Model
- Role
- Goal
- Instructions
- Temperature
- Tools
- Knowledge base
- Structured output, if available

Start without tools or a knowledge base. TalentIQ will provide candidate data directly as JSON. Add tools later only after the basic API path works.

## Part 2: Create Agent 1, AI Interviewer

### Basic fields

**Name**

```text
TalentIQ AI Interviewer
```

**Description**

```text
Runs fair, adaptive technical and behavioral practice interviews and returns structured questions, answer evaluations, and next-question recommendations grounded only in the candidate's role, skills, question, and answer.
```

**Role**

```text
You are a fair, supportive technical and behavioral interview coach for TalentIQ.
```

**Goal**

```text
Generate useful interview questions and evaluate candidate answers with consistent, evidence-based scoring and actionable feedback.
```

**Model**

Choose the lowest-cost capable model available in the workspace for development. A small or mini model is preferred for smoke tests. Use the same model for all initial tests so results and cost are comparable.

**Temperature**

```text
0.2
```

### Copy-paste system instructions

Paste this into the agent's main instructions field:

```text
You are the TalentIQ AI Interviewer. You conduct structured practice interviews for candidates applying to a stated role.

Your responsibilities:
1. Generate exactly one practical question at a time.
2. Adapt the next question to the stated role, skills, previous question, and previous answer when those inputs are provided.
3. Evaluate only the answer supplied in the current request. Do not infer ability, personality, education, age, gender, race, disability, nationality, religion, health, family status, or any other protected characteristic.
4. Give specific, respectful, useful coaching feedback.
5. Score technical quality, communication, problem solving, and overall answer quality from 0 to 100.
6. Keep scores consistent with the rubric and the evidence in the answer. A confident-sounding answer is not automatically a correct answer.
7. Identify what the answer demonstrated and what the candidate should improve.
8. If the answer is empty, irrelevant, unsafe, or impossible to evaluate, explain the limitation and lower confidence instead of inventing an evaluation.
9. Never request passwords, API keys, private credentials, financial details, or unnecessary personal information.
10. Do not make a hiring decision. Your output is a coaching and assessment signal only.

Question rules:
- Ask one question only.
- Prefer practical questions with clear context.
- For technical questions, test reasoning, tradeoffs, debugging, design, or implementation.
- For behavioral questions, use a professional situation and ask for the candidate's actions and outcome.
- The rubric must contain 2 to 5 short observable evaluation points.
- Category must be one of: technical, behavioral, system-design, problem-solving, communication.

Evaluation rules:
- Scores must be integers between 0 and 100.
- Feedback must refer to the supplied answer.
- Strengths and improvements must be short arrays of concrete points.
- The next question must be relevant to the role and the current performance.
- Never invent facts about the candidate.

Return only valid JSON. Do not return Markdown, code fences, explanations outside JSON, or extra keys.
```

### Interview question output schema

Configure structured output if Studio provides a schema field. Use this shape:

```json
{
  "question": "string",
  "category": "technical|behavioral|system-design|problem-solving|communication",
  "rubric": ["string", "string"],
  "confidence": 0.0
}
```

### Interview evaluation output schema

```json
{
  "scores": {
    "technical": 0,
    "communication": 0,
    "problemSolving": 0,
    "overall": 0
  },
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "nextQuestion": {
    "question": "string",
    "category": "technical|behavioral|system-design|problem-solving|communication",
    "rubric": ["string", "string"]
  },
  "confidence": 0.0,
  "warnings": ["string"]
}
```

### Interview test messages

Use short test messages first to control credits.

**Question test**

```json
{
  "mode": "question",
  "role": "Full-Stack Engineer",
  "skills": ["React", "Node.js", "TypeScript", "system design"],
  "previousAnswers": []
}
```

**Evaluation test**

```json
{
  "mode": "evaluate",
  "role": "Full-Stack Engineer",
  "question": "How would you design a rate-limited API for a multi-tenant application?",
  "answer": "I would use a token bucket per tenant in Redis, define limits by plan, return 429 responses, and monitor rejected requests. I would consider clock drift, Redis availability, and whether limits apply per user or per organization."
}
```

**Bad-input test**

```json
{
  "mode": "evaluate",
  "role": "Full-Stack Engineer",
  "question": "Explain caching.",
  "answer": ""
}
```

Expected behavior: return a warning or `needs_review`-style result, not a fabricated score.

## Part 3: Create Agent 2, Resume Profile AI

### Basic fields

**Name**

```text
TalentIQ Resume Profile AI
```

**Description**

```text
Creates accurate ATS-friendly resume and candidate profile content from supplied candidate facts and verified evidence without inventing employers, dates, credentials, achievements, or metrics.
```

**Role**

```text
You are an evidence-grounded resume editor and professional profile writer for TalentIQ.
```

**Goal**

```text
Transform supplied candidate facts and verified evidence into clear, accurate, role-targeted career documents and profile recommendations.
```

**Temperature**

```text
0.2
```

### Copy-paste system instructions

```text
You are the TalentIQ Resume Profile AI. You write resume and professional profile content using only the facts supplied in the request.

Rules:
1. Never invent employers, job titles, dates, degrees, certificates, awards, projects, users, revenue, performance metrics, technologies, responsibilities, or outcomes.
2. Never turn an unverified claim into a verified fact.
3. If an important detail is missing, write a neutral placeholder in missingFields instead of guessing.
4. Preserve the candidate's meaning while improving clarity, grammar, structure, and relevance to the target role.
5. Use concise ATS-friendly language without keyword stuffing.
6. Prefer measurable outcomes only when the supplied evidence includes the measurement.
7. Every generated achievement or project bullet must include one or more source IDs when source IDs are available.
8. Do not include protected characteristics or personal information that is unnecessary for the requested document.
9. Do not make promises about job outcomes or claim that the candidate is guaranteed to pass screening.
10. Return only valid JSON. Do not return Markdown, code fences, explanations outside JSON, or extra keys.

Writing rules:
- Keep the summary professional and specific to the target role.
- Use action verbs, but do not exaggerate ownership.
- Separate verified evidence from suggestions.
- Keep each experience bullet concise.
- Include improvement suggestions that the candidate can act on.
```

### Resume output schema

```json
{
  "headline": "string",
  "summary": "string",
  "keySkills": ["string"],
  "experienceBullets": [
    {
      "text": "string",
      "sourceIds": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "sourceIds": ["string"]
    }
  ],
  "profileSummary": "string",
  "improvements": ["string"],
  "missingFields": ["string"],
  "warnings": ["string"],
  "confidence": 0.0
}
```

Important: the existing `createResumeDraft()` function currently expects simple string arrays for `experienceBullets` and `projects`. When you connect this new schema, update the backend type and frontend rendering together, or temporarily map the objects to display text while preserving `sourceIds` in the backend.

### Resume test message

```json
{
  "targetRole": "Frontend Engineer",
  "candidate": {
    "name": "Demo Candidate",
    "currentRole": "Software Developer",
    "location": "",
    "skills": ["React", "JavaScript", "CSS"],
    "experience": [
      {
        "title": "Software Developer",
        "company": "Example Labs",
        "dates": "2024-2025",
        "facts": ["Built a React dashboard used by the internal support team"],
        "sourceIds": ["evidence_demo_1"]
      }
    ],
    "projects": [
      {
        "name": "Talent Dashboard",
        "facts": ["Created reusable table and filter components"],
        "technologies": ["React", "CSS"],
        "sourceIds": ["evidence_demo_2"]
      }
    ]
  },
  "verifiedEvidence": [
    {
      "sourceId": "evidence_demo_1",
      "type": "work-project",
      "claim": "Built a React dashboard used by the internal support team",
      "status": "verified"
    },
    {
      "sourceId": "evidence_demo_2",
      "type": "project",
      "claim": "Created reusable table and filter components",
      "status": "verified"
    }
  ]
}
```

## Part 4: Record Agent IDs

After saving both agents in Studio, record the IDs in a private team note first:

```text
TalentIQ AI Interviewer: <copy-from-Lyzr>
TalentIQ Resume Profile AI: <copy-from-Lyzr>
```

Then add them to the backend environment, never to frontend code:

```env
LYZR_API_KEY=server-only-secret
LYZR_BASE_URL=https://agent-prod.studio.lyzr.ai
LYZR_AGENT_INTERVIEWER=your-interviewer-agent-id
LYZR_AGENT_RESUME_PROFILE=your-resume-profile-agent-id
LYZR_TIMEOUT_MS=30000
LYZR_MAX_RETRIES=1
```

Do not commit this file if it contains real IDs together with secrets. Agent IDs are less sensitive than the API key, but keep all deployment configuration in environment variables.

## Part 5: Connect the Backend

The desired architecture is:

```text
AIInterview.jsx
  -> frontend/src/lib/api.js
  -> /api/interviews/questions or /api/interviews/submit
  -> interview.controller.ts
  -> ai.service.ts
  -> shared Lyzr client
  -> Lyzr agent
```

For resume/profile:

```text
Resume/profile screen
  -> frontend/src/lib/api.js
  -> /api/ai/resume-draft
  -> ai.controller.ts
  -> ai.service.ts
  -> shared Lyzr client
  -> Lyzr agent
```

Implementation order:

1. Add `LYZR_*` environment values to `backend/src/config/env.ts`.
2. Create one reusable Lyzr HTTP client under `backend/src/services/`.
3. Add an agent-name-to-agent-ID map in configuration.
4. Add timeout handling and one retry for transient errors.
5. Parse the Lyzr result as JSON.
6. Validate required fields before returning data to a controller.
7. Keep existing route paths stable.
8. Replace the current Groq calls in `ai.service.ts` only for the two Person 3 workflows.
9. Keep the existing response shapes until the frontend is updated.
10. Add logging with `requestId`, agent name, status, and latency.

Do not call Lyzr from React. Do not expose `x-api-key` in browser requests.

Lyzr's Studio Deploy screen provides the current API cURL and request format for the selected agent. Copy that request into the backend client rather than relying on an old example if the workspace shows a different API version.

## Part 6: Interview Backend Mapping

### Start or next question

Current route:

```text
GET /api/interviews/questions?role=Full-Stack%20Engineer&skills=React,Node.js,TypeScript
```

Backend input to the Lyzr agent:

```json
{
  "mode": "question",
  "role": "Full-Stack Engineer",
  "skills": ["React", "Node.js", "TypeScript"],
  "previousAnswers": []
}
```

Return only the question object expected by `AIInterview.jsx`:

```json
{
  "question": "string",
  "category": "technical",
  "rubric": ["string"]
}
```

### Submit answer

Current route:

```text
POST /api/interviews/submit
```

Request body:

```json
{
  "role": "Full-Stack Engineer",
  "question": "How would you design a rate-limited API?",
  "answer": "The candidate answer goes here.",
  "sessionId": "interview-session-123",
  "previousAnswers": []
}
```

Return:

```json
{
  "scores": {
    "technical": 78,
    "communication": 82,
    "problemSolving": 76,
    "overall": 79
  },
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "nextQuestion": {
    "question": "string",
    "category": "technical",
    "rubric": ["string"]
  }
}
```

The current UI updates `scores`, displays `feedback`, `strengths`, and `improvements`, and immediately uses `nextQuestion`. Do not remove these keys during the migration.

## Part 7: Resume/Profile Backend Mapping

Current route:

```text
POST /api/ai/resume-draft
```

Recommended request body:

```json
{
  "targetRole": "Frontend Engineer",
  "profile": {
    "name": "Demo Candidate",
    "summary": "Existing candidate summary",
    "skills": ["React", "JavaScript"],
    "experience": [],
    "projects": []
  },
  "verifiedEvidence": []
}
```

The existing backend currently accepts `targetRole`, `profile`, and `evidence`. Add `verifiedEvidence` without removing the old fields during the transition.

Recommended response:

```json
{
  "headline": "Frontend Engineer",
  "summary": "string",
  "keySkills": ["React", "JavaScript"],
  "experienceBullets": [
    {
      "text": "Built a React dashboard used by an internal support team.",
      "sourceIds": ["evidence_demo_1"]
    }
  ],
  "projects": [],
  "profileSummary": "string",
  "improvements": ["string"],
  "missingFields": [],
  "warnings": [],
  "confidence": 0.86
}
```

The uploaded resume scoring route is separate. Do not send raw uploaded files to the Resume Profile agent until the team explicitly approves the Lyzr file/multimodal flow, privacy handling, and credit cost. Continue using the existing extraction and scoring path first.

## Part 8: Frontend Connection

### Interview

The existing `frontend/src/lib/api.js` already exposes:

```js
interviewApi.getQuestion(role, skills)
interviewApi.evaluate(payload)
```

Keep these functions stable. Update `AIInterview.jsx` only if you add:

- Session IDs
- Interview history persistence
- A final report action
- `needs_review` warnings
- Streaming output

Do not add the Lyzr API key or direct Lyzr URL to `api.js`.

### Resume/Profile

Use `aiApi.resumeDraft(payload)` from `frontend/src/lib/api.js`. Add a dedicated candidate profile screen later if the existing route does not yet render the new fields.

The UI should show:

- Generated headline
- Summary
- Skills
- Experience bullets
- Projects
- Missing fields
- Evidence warnings
- Confidence or review state

Never show a generated claim without its source or warning state where the product expects evidence.

## Part 9: Your Test Checklist

### Interview tests

- [ ] Role and skills produce one question.
- [ ] Question has a category and rubric.
- [ ] Answer evaluation returns all four scores.
- [ ] Scores stay between 0 and 100.
- [ ] Empty answer is rejected by the backend.
- [ ] Irrelevant answer receives a warning or low-confidence result.
- [ ] Next question is relevant to the role.
- [ ] Previous answers can be passed without breaking the request.
- [ ] Two users have separate session IDs.
- [ ] Timeout returns a useful API error.
- [ ] Invalid Lyzr JSON does not reach the frontend.
- [ ] Prompt injection inside an answer does not override the interviewer rules.

### Resume/profile tests

- [ ] Complete profile creates a draft.
- [ ] Sparse profile returns `missingFields`.
- [ ] Missing metrics are not invented.
- [ ] Unverified claims remain warnings or placeholders.
- [ ] Source IDs are preserved.
- [ ] Conflicting dates are surfaced.
- [ ] Protected personal data is not added unnecessarily.
- [ ] Long profile input is bounded.
- [ ] Invalid Lyzr JSON is rejected.
- [ ] Retry does not duplicate database records.

## Part 10: Credit-Safe Testing

Use this order with the $20 balance:

1. Test one question request in Studio.
2. Test one answer evaluation in Studio.
3. Test one resume draft in Studio.
4. Run no more than five varied tests per agent initially.
5. Use short candidate fixtures.
6. Do not upload full PDFs repeatedly.
7. Cache repeated local requests where possible.
8. Record approximate usage after each test batch.
9. Keep at least 25% of the balance for final demo testing.

Stop testing if the agent repeatedly returns malformed JSON, invents facts, or consumes more credits than expected. Fix the prompt and input size before running more calls.

## Part 11: Definition of Done

Person 3 is complete when:

- [ ] Both agents exist in Lyzr Studio.
- [ ] Both agents have clear names, roles, goals, instructions, and versioned configurations.
- [ ] Both agent IDs are stored in backend environment configuration.
- [ ] The backend calls Lyzr through one shared client.
- [ ] The API key never reaches the frontend.
- [ ] Interview question and evaluation routes work.
- [ ] Resume draft route works.
- [ ] Existing interview UI still works.
- [ ] Resume/profile output is rendered or handed to the UI owner with its schema.
- [ ] Ten total fixture cases per agent have been tested.
- [ ] Error, timeout, malformed JSON, and `needs_review` behavior works.
- [ ] Usage and credit consumption are recorded.
- [ ] You hand off agent IDs, prompts, schemas, test results, and changed files to the team.

## Handoff Format

Send the team this summary when finished:

```text
Owner: Person 3
Agents:
- TalentIQ AI Interviewer: <agent ID>
- TalentIQ Resume Profile AI: <agent ID>

Backend routes:
- GET /api/interviews/questions
- POST /api/interviews/submit
- POST /api/ai/resume-draft

Changed files:
- <list files>

Tests:
- Interview: <pass count>/<total>
- Resume/profile: <pass count>/<total>

Known limitations:
- <list>

Approximate Lyzr usage:
- <record from workspace>
```

## Official References

- Lyzr Studio agent building: https://docs.lyzr.ai/enterprise/agent-studio/agents/studio
- Lyzr conversational builder: https://docs.lyzr.ai/enterprise/agent-studio/agents/conversational-builder
- Lyzr agent concepts and API modes: https://docs.lyzr.ai/enterprise/get-started/concepts/agents
- Lyzr API introduction: https://docs.lyzr.ai/api-docs/introduction/introduction
