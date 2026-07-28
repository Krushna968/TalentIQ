# TalentIQ

### Verified Skill Intelligence for Modern Hiring

[Live Demo](https://talentiq-ai-platform.netlify.app) · [Frontend Docs](frontend/docs/ARCHITECTURE.md) · [API Docs](backend/docs/API.md) · [Agent Guide](AGENTS.md)

TalentIQ is a talent intelligence platform that helps candidates turn real technical work into a trusted Digital Talent Identity and helps recruiters discover, evaluate, and hire people using evidence rather than keyword-heavy resumes.

The project reframes hiring around demonstrated capability: projects, repositories, technical depth, hackathon outcomes, credentials, collaboration, presentations, and interview performance.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [What Makes TalentIQ Different](#what-makes-talentiq-different)
- [Core Product Experiences](#core-product-experiences)
- [User Journeys](#user-journeys)
- [Talent Intelligence Model](#talent-intelligence-model)
- [Application Routes](#application-routes)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Backend API](#backend-api)
- [Local Development](#local-development)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Production Roadmap](#production-roadmap)
- [Design Principles](#design-principles)
- [License](#license)

---

## The Problem

Traditional recruitment is still dominated by resumes, keyword matching, and manual screening. That creates two costly problems:

- Exceptional builders can be overlooked because their proof of work is fragmented across GitHub, hackathons, projects, communities, and credentials.
- Recruiters lose valuable time validating claims, comparing candidates inconsistently, and searching beyond obvious resume keywords.

TalentIQ creates one connected, explainable view of talent. Instead of asking only *Can this person get hired?*, it helps answer:

- What can this person demonstrably do?
- How credible is the evidence behind their claims?
- Which role is the strongest fit?
- Where can they grow next?
- Why should a recruiter trust this hiring decision?

---

## The Solution

TalentIQ connects candidate evidence into a Digital Talent Identity and presents it through two focused experiences.

| For candidates | For recruiters |
|---|---|
| Build a profile from verified work and achievements | Search talent in natural language |
| Understand skill strength and career trajectory | Inspect the evidence behind a match |
| Practice interviews and review performance signals | Compare candidates consistently |
| Create role-ready career assets | Move high-confidence candidates through a pipeline |
| Discover relevant opportunities | Make more defensible hiring decisions |

---

## What Makes TalentIQ Different

### Evidence, not just claims
A candidate score is supported by a trail of technical evidence rather than a self-reported skill list. The product model brings together code activity, project delivery, hackathon performance, credentials, communication, collaboration, and open-source contribution.

### A living Digital Talent Identity
A resume is static. TalentIQ is designed as an evolving identity that becomes richer as candidates add new projects, skills, credentials, and contributions.

### Explainable talent intelligence
Recruiters can see why a candidate appears strong. TalentIQ pairs scores and match signals with clear categories of evidence, making the hiring discussion easier to defend.

### A bridge from hackathons to hiring
Great hackathon performance often disappears after the event. TalentIQ gives recruiter workflows a place to discover high-performing builders, inspect project evidence, and move them into an active hiring pipeline.

### Candidate growth and recruiter decision-making in one product
The platform serves both sides of the market. Candidates get clarity on how to improve, while recruiters get a faster path to high-signal talent.

---

## Core Product Experiences

| Module | What the demo shows |
|---|---|
| Candidate Talent Cockpit | Talent score, competency matrix, verified signal categories, activity, roadmap, commits, skills, and network views |
| Digital Talent Identity | A connected profile model for work, credentials, skills, and proof points |
| Talent Search | Recruiter Copilot-style search, filters, ranked candidates, and animated match scores |
| Intelligence Dossier | Candidate-specific report with evidence-led metric cards and recruiter decisions |
| Job Matching | Transparent role-fit and matching signals |
| Verification and Trust | Evidence, authenticity, and risk-oriented review flows |
| Interview Practice | A guided technical interview with live scoring for technical depth, communication, and problem solving |
| Resume and Portfolio Builder | A route for turning verified achievements into role-ready career assets |
| Job Recommendations | Opportunity recommendations linked to demonstrated strengths and skill gaps |
| Team Contribution Analytics | A collaboration-evidence view for commits, pull requests, delivery, and ownership |
| Presentation Intelligence | Pitch and project presentation evaluation across clarity, feasibility, innovation, and quality |
| Hackathon-to-Hiring | Discovery flow for high-performing participants and project teams |
| Hiring Pipeline and Comparison | Shortlisting, comparison, and decision-oriented recruiter flows |
| Hiring Analytics | Talent-pool and hiring-signal overview |

---

## User Journeys

### Candidate journey
1. Create an account and choose the candidate role.
2. Build a Digital Talent Identity around skills, work, credentials, and achievements.
3. Review the Talent Cockpit for competency, activity, and career insight.
4. Strengthen evidence through interview practice, contribution history, and presentation quality.
5. Turn verified work into career assets and explore relevant opportunities.

### Recruiter journey
1. Enter Talent Search and describe the role or required capability.
2. Filter ranked candidates using role-fit and evidence signals.
3. Open an Intelligence Dossier to inspect score breakdowns and supporting context.
4. Compare candidates or move promising profiles into the hiring pipeline.
5. Use verification, trust, matching, and analytics views to support the final decision.

---

## Talent Intelligence Model

| Signal group | Example evidence | Product value |
|---|---|---|
| Technical depth | Repository quality, languages, architecture, project complexity | Shows what the candidate can build |
| Delivery and consistency | Commit history, contributions, project continuity | Reveals sustained execution |
| Innovation | Hackathon outcomes, original projects, problem framing | Identifies builders who create new value |
| Collaboration | Pull requests, reviews, teamwork, community contribution | Adds context beyond individual coding |
| Communication | Presentations, documentation, interview responses | Measures clarity and influence |
| Credentials | Certifications and course completion | Adds verified learning evidence |
| Trust | Source-backed claims, duplicate checks, authenticity signals | Makes confidence visible |
| Role fit | Skill relevance, project relevance, readiness indicators | Supports better shortlisting |

---

## Application Routes

| Audience | Experience | Route | Backend API |
|---|---|---|---|
| Everyone | Product landing page | `/` | — |
| Candidate or recruiter | Access gateway | `/auth` | `POST /api/auth/login` |
| Candidate | Talent cockpit | `/candidate` | `GET /api/candidates` |
| Candidate | Digital Talent Identity | `/candidate/profile` | `GET /api/candidates/profile` |
| Candidate | Career roadmap | `/candidate/roadmap` | `GET /api/candidates/roadmap` |
| Candidate | Resume and portfolio builder | `/candidate/resume-builder` | `GET /api/candidates/resume-builder` |
| Candidate | Job recommendations | `/candidate/jobs` | `GET /api/candidates/jobs` |
| Recruiter | Talent Search | `/recruiter` | `GET /api/recruiters/search` |
| Recruiter | Hiring pipeline | `/recruiter/pipeline` | `GET /api/recruiters/pipeline` |
| Recruiter | Candidate comparison | `/recruiter/compare` | `POST /api/recruiters/compare` |
| Recruiter | Candidate Intelligence Dossier | `/report/:id` | `GET /api/reports/talent/:id` |
| Everyone | Verification overview | `/verification` | `POST /api/verification/github` |
| Recruiter | Role matching | `/matching` | `POST /api/matching/match` |
| Recruiter | Hiring analytics | `/analytics` | `GET /api/analytics/hiring` |
| Candidate | Interview practice | `/interview` | `GET /api/interviews/questions` |
| Candidate | Interview report | `/interview/report` | `GET /api/interviews/report/:sessionId` |
| Candidate | Team contribution analytics | `/team-contributions` | `GET /api/team-contributions/:userId` |
| Candidate | Presentation intelligence | `/presentations/analyze` | `POST /api/presentations/analyze` |
| Recruiter | Hackathon-to-hiring | `/hackathons` | `GET /api/hackathons/:userId` |
| Recruiter | Trust and fraud review | `/trust` | `GET /api/trust/flags` |

Route constants live in `frontend/src/routes/paths.js`. Backend routes in `backend/src/routes/`. Full API reference: `backend/docs/API.md`.

---

## Technology Stack

### Frontend
- **React 19** — Component-driven UI development
- **Vite 8** — Fast development and production builds
- **React Router 7** — Client-side routing with route-aware state transitions
- **Recharts** — Radar and data visualization components
- **Modern CSS** — Complete Space Fabric visual system (dark theme, glassmorphism, particle networks, animations)
- **TypeScript config** — Present for future typed feature modules
- **Tailwind tooling** — Available for future utility-based expansion

### Backend
- **Node.js** — JavaScript runtime
- **Express** — HTTP server and routing framework
- **TypeScript** — Type-safe development with ESM modules
- **PostgreSQL** — Primary relational database (planned)
- **Neo4j** — Talent graph database (planned)
- **Redis** — Caching and job queues (planned)
- **Elasticsearch / pgvector** — Search and similarity (planned)

### AI & Intelligence
- **LangChain / LangGraph** — AI orchestration (planned)
- **OpenAI-compatible models** — Scoring, matching, verification (planned)

### Infrastructure
- **Netlify** — Frontend static hosting (current)
- **Cloud hosting** — Backend API deployment (planned)
- **Amazon S3 / Cloudinary** — File and asset storage (planned)
- **Clerk / Auth.js** — Authentication provider (planned)

---

## Architecture

### Current prototype architecture
```
Browser
  -> React application
  -> React Router route registry
  -> Shared application context
  -> Demo candidate data and configurable product modules
  -> Responsive Space Fabric interface
  -> Netlify static deployment
```

### Target production architecture
```
Candidate and recruiter clients
  -> CDN / Netlify (frontend)
  -> API gateway and authentication
  -> Candidate profile and evidence services
  -> Verification, matching, interview, presentation, and analytics services
  -> PostgreSQL, Neo4j, Redis, search index, and object storage
  -> Explainable talent intelligence outputs
```

### Data flow
```
Frontend (React) 
  -> HTTP requests to /api/*
  -> Express router -> Controller -> Service -> Model/DB
  -> JSON response -> UI state update
```

The current route registry and modular configuration make it straightforward to replace demo data with typed API clients when backend services are ready.

---

## Project Structure

```
talentiq-app/
├── frontend/                          # React 19 application
│   ├── public/                        # Static assets (favicon, icons)
│   ├── src/
│   │   ├── assets/                    # Visual assets
│   │   ├── components/                # Reusable UI primitives
│   │   │   ├── RadarChart.jsx
│   │   │   ├── ScoreRing.jsx
│   │   │   ├── SpaceFabric.jsx
│   │   │   ├── TopNav.jsx
│   │   │   └── VerificationStamp.jsx
│   │   ├── config/
│   │   │   └── productModules.js      # Module definitions
│   │   ├── context/
│   │   │   └── AppContext.jsx         # Global state
│   │   ├── data/
│   │   │   └── candidates.js          # 5 demo candidates
│   │   ├── features/                  # Domain boundaries
│   │   ├── routes/
│   │   │   ├── paths.js               # Route constants
│   │   │   └── AppRoutes.jsx          # Route registration
│   │   └── screens/                   # Page components
│   │       ├── LandingPage.jsx
│   │       ├── AuthScreen.jsx
│   │       ├── CandidateDashboard.jsx
│   │       ├── RecruiterSearch.jsx
│   │       ├── AIInterview.jsx
│   │       ├── TalentReport.jsx
│   │       └── ProductModule.jsx
│   ├── docs/
│   │   ├── ARCHITECTURE.md
│   │   └── ROUTES.md
│   └── readme.md                      # Frontend-specific docs
│
├── backend/                           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts                   # Entry point
│   │   ├── app.ts                     # Express app setup
│   │   ├── config/
│   │   │   ├── env.ts                 # Environment variables
│   │   │   └── database.ts            # Database connection
│   │   ├── routes/                    # 12 route files
│   │   │   ├── index.ts               # Route aggregator
│   │   │   ├── auth.routes.ts
│   │   │   ├── candidate.routes.ts
│   │   │   ├── recruiter.routes.ts
│   │   │   ├── verification.routes.ts
│   │   │   ├── matching.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── interview.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── team.routes.ts
│   │   │   ├── presentation.routes.ts
│   │   │   ├── hackathon.routes.ts
│   │   │   └── trust.routes.ts
│   │   ├── controllers/              # 12 controller stubs
│   │   ├── models/                    # TypeScript interfaces
│   │   │   ├── user.model.ts
│   │   │   ├── candidate.model.ts
│   │   │   ├── recruiter.model.ts
│   │   │   ├── verification.model.ts
│   │   │   └── interview.model.ts
│   │   ├── services/                  # Business logic stubs
│   │   │   ├── auth.service.ts
│   │   │   ├── candidate.service.ts
│   │   │   ├── verification.service.ts
│   │   │   ├── matching.service.ts
│   │   │   ├── ai.service.ts
│   │   │   └── github.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── helpers.ts
│   ├── tests/
│   ├── scripts/
│   │   └── seed.ts
│   └── docs/
│       └── API.md                     # Full API reference
│
├── AGENTS.md                          # AI agent project guide
├── .opencode.json                     # OpenCode configuration
└── netlify.toml                       # Netlify deployment config
```

---

## Backend API

Base URL: `/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | Candidate dashboard |
| GET | `/api/candidates/profile` | Get profile |
| PUT | `/api/candidates/profile` | Update profile |
| GET | `/api/candidates/roadmap` | Get career roadmap |
| PUT | `/api/candidates/roadmap` | Update roadmap |
| GET | `/api/candidates/resume-builder` | Get resume data |
| POST | `/api/candidates/resume-builder/generate` | Generate resume |
| GET | `/api/candidates/jobs` | Job recommendations |
| PUT | `/api/candidates/jobs/:id/apply` | Apply to job |

### Recruiters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recruiters/search` | Search candidates |
| GET | `/api/recruiters/pipeline` | Get hiring pipeline |
| PUT | `/api/recruiters/pipeline/:candidateId` | Update pipeline status |
| POST | `/api/recruiters/compare` | Compare candidates |

### Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification/github` | Verify GitHub |
| POST | `/api/verification/certification` | Verify certification |
| POST | `/api/verification/hackathon` | Verify hackathon |
| POST | `/api/verification/presentation` | Verify presentation |
| GET | `/api/verification/status/:id` | Get verification status |
| GET | `/api/verification/badges` | Get earned badges |

### Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matching/match` | Match candidate to role |
| GET | `/api/matching/scores/:candidateId` | Get match scores |
| GET | `/api/matching/recommendations` | Get recommendations |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/hiring` | Hiring analytics |
| GET | `/api/analytics/trends` | Talent trends |
| GET | `/api/analytics/skills-gap` | Skills gap analysis |
| GET | `/api/analytics/pipeline-metrics` | Pipeline metrics |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interviews/questions` | Get interview questions |
| POST | `/api/interviews/submit` | Submit answer |
| GET | `/api/interviews/sessions` | Get sessions |
| GET | `/api/interviews/sessions/:id` | Get session details |
| GET | `/api/interviews/report/:sessionId` | Get interview report |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/talent/:id` | Get talent report |
| GET | `/api/reports/talent/:id/pdf` | Export as PDF |
| POST | `/api/reports/talent/:id/share` | Share report |

### Team Contributions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team-contributions/:userId` | Get team contributions |
| GET | `/api/team-contributions/:userId/impact` | Get impact score |

### Presentations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/presentations/analyze` | Analyze presentation |
| GET | `/api/presentations/:userId/history` | Get history |

### Hackathons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hackathons/:userId` | Get hackathon profile |
| POST | `/api/hackathons/verify` | Verify participation |
| GET | `/api/hackathons/:userId/achievements` | Get achievements |

### Trust & Fraud
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trust/flags` | Get fraud flags |
| POST | `/api/trust/report` | Report fraud |
| PUT | `/api/trust/flags/:id/resolve` | Resolve flag |
| GET | `/api/trust/score/:userId` | Get trust score |

Full API documentation: `backend/docs/API.md`

---

## Local Development

### Prerequisites
- Node.js 20 or newer
- npm 10 or newer

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (default: `http://localhost:5173`).

### Backend setup
```bash
cd backend
npm install
npm run dev
```

The API server starts on `http://localhost:4000` by default.

### Production build
```bash
cd frontend
npm run build
npm run preview
```

### Running both simultaneously
Use two terminal windows:
```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && npm run dev
```

---

## Environment Configuration

### Frontend (.env)
Copy `frontend/.env.example` to `frontend/.env`:

```bash
copy frontend\.env.example frontend\.env
```

| Variable | Purpose |
|---|---|
| `VITE_APP_NAME` | Public application name |
| `VITE_APP_ENV` | Current public environment label |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_ANALYTICS_KEY` | Public analytics configuration key |

Never place private API keys, database credentials, or model-provider secrets in variables prefixed with `VITE_`. Those values are exposed to the browser at build time.

### Backend (.env)
Copy `backend/.env.example` to `backend/.env`:

```bash
copy backend\.env.example backend\.env
```

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default: 4000) |
| `NODE_ENV` | Environment (development/production) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiration (default: 7d) |
| `CLERK_SECRET_KEY` | Clerk authentication secret |
| `GITHUB_TOKEN` | GitHub API token |
| `OPENAI_API_KEY` | OpenAI API key |
| `S3_*` | AWS S3 credentials |

---

## Deployment

### Frontend (Netlify)
The app is configured for Netlify deployment.

| Setting | Value |
|---|---|
| Build command | `cd frontend && npm run build` |
| Publish directory | `frontend/dist` |
| SPA fallback | All paths resolve to `index.html` |

Any new route registered in `frontend/src/routes/AppRoutes.jsx` will work on direct refresh because of the Netlify history fallback.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com)

### Backend (production)
The backend can be deployed to:
- **Railway** — Simple Node.js deployment with PostgreSQL
- **Render** — Web service with auto-deploy from GitHub
- **AWS ECS / Fargate** — Containerized production deployment
- **DigitalOcean App Platform** — Managed Node.js hosting

---

## Production Roadmap

### Phase 1: Backend Foundation (Current → Week 4)
- [x] Project structure and route scaffolding
- [ ] Implement authentication middleware and JWT flow
- [ ] Set up PostgreSQL database with Prisma ORM or Drizzle
- [ ] Create database migrations for all models
- [ ] Implement session-based auth or Clerk integration
- [ ] Write controller logic for all 12 route domains
- [ ] Add request validation with Zod
- [ ] Implement error handling and logging (Winston/Pino)

### Phase 2: API Integration (Week 4 → Week 8)
- [ ] Create typed API client library in frontend
- [ ] Replace demo data with live API calls
- [ ] Implement CRUD endpoints for candidates and recruiters
- [ ] Connect auth frontend to backend
- [ ] Add loading states and error boundaries
- [ ] Implement optimistic updates for pipeline changes
- [ ] Add API rate limiting and caching headers

### Phase 3: Evidence Ingestion (Week 8 → Week 12)
- [ ] GitHub OAuth integration and commit/repo analysis
- [ ] Certification verification (credential parsing, hash checks)
- [ ] Hackathon data ingestion and verification
- [ ] Presentation upload and analysis pipeline
- [ ] File storage integration (S3/Cloudinary)
- [ ] Background job processing with Redis/Bull
- [ ] Webhook handlers for external data sources

### Phase 4: AI & Intelligence Services (Week 12 → Week 16)
- [ ] AI-powered skill extraction from GitHub repos
- [ ] Automated scoring engine for all evidence types
- [ ] Role matching algorithm (skill similarity + experience)
- [ ] AI interview question generation and answer scoring
- [ ] Resume generation from verified signals
- [ ] Presentation analysis (clarity, feasibility, innovation scoring)
- [ ] Trust scoring and fraud detection
- [ ] LangChain/LangGraph pipeline for multi-step AI workflows

### Phase 5: Recruiter Power Tools (Week 16 → Week 20)
- [ ] Natural language talent search with embeddings
- [ ] Saved searches and alerts
- [ ] Candidate comparison engine (side-by-side scoring)
- [ ] Pipeline management with drag-and-drop
- [ ] Bulk actions and team collaboration
- [ ] Export reports (PDF, CSV)
- [ ] Interview scheduling integration

### Phase 6: Production Hardening (Week 20 → Week 24)
- [ ] Comprehensive test suite (unit, integration, e2e)
- [ ] Performance optimization and load testing
- [ ] Security audit (OWASP, dependency scanning)
- [ ] Monitoring and observability (Datadog/Sentry)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database indexing and query optimization
- [ ] Caching strategy (Redis, CDN)
- [ ] Rate limiting and DDoS protection
- [ ] Documentation completion
- [ ] GDPR/compliance review

### Phase 7: Platform Scale (Post-Production)
- [ ] Graph-based Talent Intelligence Engine (Neo4j)
- [ ] Real-time notifications (WebSockets)
- [ ] Campus and community talent heatmaps
- [ ] Salary and career-growth prediction models
- [ ] Workforce skill intelligence for enterprises
- [ ] Company-wide talent graph and internal mobility
- [ ] Mobile app (React Native)
- [ ] Marketplace for third-party verification providers
- [ ] API marketplace for partner integrations

---

## Design Principles

- Evidence before claims
- Explainability before opaque scoring
- High-signal candidate evaluation over keyword matching
- Candidate agency alongside recruiter efficiency
- Responsive, accessible, high-contrast interactions
- Clear separation between UI prototype data and production integrations
- A modular frontend that can grow into an API-backed platform

---

## Project Status

Current: **Alpha (Frontend Prototype + Backend Scaffold)**

The demo demonstrates the complete product story and all major workflow surfaces with interactive routing, responsive UI, and realistic data. The backend is scaffolded with all route controllers, models, services, middleware, and configuration ready for implementation. Backend intelligence, integrations, uploads, and persistence are the next implementation phase.

---

## License

This project is currently shared for hackathon evaluation. Add a license before using it in a public or commercial production setting.
