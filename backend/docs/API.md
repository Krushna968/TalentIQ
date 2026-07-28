# TalentIQ API

Base URL: `/api`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET  /api/auth/me`
- `PUT  /api/auth/me`

## Candidates
- `GET   /api/candidates`
- `GET   /api/candidates/profile`
- `PUT   /api/candidates/profile`
- `GET   /api/candidates/roadmap`
- `PUT   /api/candidates/roadmap`
- `GET   /api/candidates/resume-builder`
- `POST  /api/candidates/resume-builder/generate`
- `GET   /api/candidates/jobs`
- `PUT   /api/candidates/jobs/:id/apply`

## Recruiters
- `GET  /api/recruiters/search`
- `GET  /api/recruiters/pipeline`
- `PUT  /api/recruiters/pipeline/:candidateId`
- `POST /api/recruiters/compare`

## Verification
- `POST /api/verification/github`
- `POST /api/verification/certification`
- `POST /api/verification/hackathon`
- `POST /api/verification/presentation`
- `GET  /api/verification/status/:id`
- `GET  /api/verification/badges`

## Matching
- `POST /api/matching/match`
- `GET  /api/matching/scores/:candidateId`
- `GET  /api/matching/recommendations`

## Analytics
- `GET /api/analytics/hiring`
- `GET /api/analytics/trends`
- `GET /api/analytics/skills-gap`
- `GET /api/analytics/pipeline-metrics`

## Interviews
- `GET  /api/interviews/questions`
- `POST /api/interviews/submit`
- `GET  /api/interviews/sessions`
- `GET  /api/interviews/sessions/:id`
- `GET  /api/interviews/report/:sessionId`

## Reports
- `GET  /api/reports/talent/:id`
- `GET  /api/reports/talent/:id/pdf`
- `POST /api/reports/talent/:id/share`

## Team Contributions
- `GET /api/team-contributions/:userId`
- `GET /api/team-contributions/:userId/impact`

## Presentations
- `POST /api/presentations/analyze`
- `GET  /api/presentations/:userId/history`

## Hackathons
- `GET  /api/hackathons/:userId`
- `POST /api/hackathons/verify`
- `GET  /api/hackathons/:userId/achievements`

## Trust & Fraud
- `GET  /api/trust/flags`
- `POST /api/trust/report`
- `PUT  /api/trust/flags/:id/resolve`
- `GET  /api/trust/score/:userId`
