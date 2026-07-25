# TalentIQ

### Verified Skill Intelligence for Modern Hiring

[Live Demo](https://talentiq-ai-platform.netlify.app) · [Route Map](docs/ROUTES.md) · [Architecture Notes](docs/ARCHITECTURE.md)

TalentIQ is a talent intelligence platform that helps candidates turn real technical work into a trusted Digital Talent Identity and helps recruiters discover, evaluate, and hire people using evidence rather than keyword-heavy resumes.

The project reframes hiring around demonstrated capability: projects, repositories, technical depth, hackathon outcomes, credentials, collaboration, presentations, and interview performance.

## The Problem

Traditional recruitment is still dominated by resumes, keyword matching, and manual screening. That creates two costly problems:

- Exceptional builders can be overlooked because their proof of work is fragmented across GitHub, hackathons, projects, communities, and credentials.
- Recruiters lose valuable time validating claims, comparing candidates inconsistently, and searching beyond obvious resume keywords.

TalentIQ creates one connected, explainable view of talent. Instead of asking only, Can this person get hired?, it helps answer:

- What can this person demonstrably do?
- How credible is the evidence behind their claims?
- Which role is the strongest fit?
- Where can they grow next?
- Why should a recruiter trust this hiring decision?

## The Solution

TalentIQ connects candidate evidence into a Digital Talent Identity and presents it through two focused experiences.

| For candidates | For recruiters |
| --- | --- |
| Build a profile from verified work and achievements | Search talent in natural language |
| Understand skill strength and career trajectory | Inspect the evidence behind a match |
| Practice interviews and review performance signals | Compare candidates consistently |
| Create role-ready career assets | Move high-confidence candidates through a pipeline |
| Discover relevant opportunities | Make more defensible hiring decisions |

## What Makes TalentIQ Different

### Evidence, not just claims

A candidate score is designed to be supported by a trail of technical evidence rather than a self-reported skill list. The product model brings together code activity, project delivery, hackathon performance, credentials, communication, collaboration, and open-source contribution.

### A living Digital Talent Identity

A resume is static. TalentIQ is designed as an evolving identity that can become richer as candidates add new projects, skills, credentials, and contributions.

### Explainable talent intelligence

Recruiters should be able to see why a candidate appears strong. TalentIQ pairs scores and match signals with clear categories of evidence, making the hiring discussion easier to defend.

### A bridge from hackathons to hiring

Great hackathon performance often disappears after the event. TalentIQ gives recruiter workflows a place to discover high-performing builders, inspect project evidence, and move them into an active hiring pipeline.

### Candidate growth and recruiter decision-making in one product

The platform serves both sides of the market. Candidates get clarity on how to improve, while recruiters get a faster path to high-signal talent.

## Core Product Experiences

| Module | What the demo shows |
| --- | --- |
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

## Mandatory Challenge Coverage

The organizer brief calls for a candidate intelligence platform, a recruiter platform, assessment and verification, presentation intelligence, hackathon hiring, fraud prevention, and hiring analytics. The prototype provides navigable, connected demo flows for each of these product areas.

Current demo capabilities are intentionally frontend-first. Candidate data, scores, and outputs are rich sample data used to demonstrate the intended product workflow. Live data ingestion, file analysis, persistent decisions, and model-backed scoring are the next implementation layer.

## The Space Fabric Design System

TalentIQ uses a custom visual language inspired by a knowledge graph: the Space Fabric design system.

- Deep Void backgrounds create focus and enterprise-grade contrast.
- Cyan Starlight and Nebula Gold signal intelligence, confidence, and activity.
- Interactive particle networks represent connected talent evidence.
- Deep Space Glass surfaces use translucency, blur, and subtle borders.
- Hover states lift interactive elements and add a restrained cyan or gold glow.
- Responsive layouts preserve the visual hierarchy across desktop and mobile.

The result is a product experience that feels less like a conventional applicant-tracking system and more like an intelligence cockpit.

## Product Flow

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

## Talent Intelligence Model

The current demo represents a configurable evidence model. In production, these inputs would be ingested and scored through backend services.

| Signal group | Example evidence | Product value |
| --- | --- | --- |
| Technical depth | Repository quality, languages, architecture, project complexity | Shows what the candidate can build |
| Delivery and consistency | Commit history, contributions, project continuity | Reveals sustained execution |
| Innovation | Hackathon outcomes, original projects, problem framing | Identifies builders who create new value |
| Collaboration | Pull requests, reviews, teamwork, community contribution | Adds context beyond individual coding |
| Communication | Presentations, documentation, interview responses | Measures clarity and influence |
| Credentials | Certifications and course completion | Adds verified learning evidence |
| Trust | Source-backed claims, duplicate checks, authenticity signals | Makes confidence visible |
| Role fit | Skill relevance, project relevance, readiness indicators | Supports better shortlisting |

## Application Routes

| Audience | Experience | Route |
| --- | --- | --- |
| Everyone | Product landing page | / |
| Candidate or recruiter | Access gateway | /auth |
| Candidate | Talent cockpit | /candidate |
| Candidate | Digital Talent Identity | /candidate/profile |
| Candidate | Career roadmap | /candidate/roadmap |
| Candidate | Resume and portfolio builder | /candidate/resume-builder |
| Candidate | Job recommendations | /candidate/jobs |
| Recruiter | Talent Search | /recruiter |
| Recruiter | Hiring pipeline | /recruiter/pipeline |
| Recruiter | Candidate comparison | /recruiter/compare |
| Recruiter | Candidate Intelligence Dossier | /report/:id |
| Everyone | Verification overview | /verification |
| Recruiter | Role matching | /matching |
| Recruiter | Hiring analytics | /analytics |
| Candidate | Interview practice | /interview |
| Candidate | Interview report | /interview/report |
| Candidate | Team contribution analytics | /team-contributions |
| Candidate | Presentation intelligence | /presentations/analyze |
| Recruiter | Hackathon-to-hiring | /hackathons |
| Recruiter | Trust and fraud review | /trust |

## Technology Stack

### Frontend

- React 19 for component-driven UI development
- Vite 8 for fast development and production builds
- React Router 7 for client-side routing and route-aware state transitions
- Recharts for radar and data visualisation components
- Modern CSS for the complete Space Fabric visual system, responsive layout, glassmorphism, particle-network effects, animations, and micro-interactions

### Tooling

- npm for dependency and script management
- Vite project structure with a clean, modular source layout
- Tailwind tooling is included in the development stack for future utility-based expansion
- TypeScript configuration is present for future typed feature modules

### Deployment

- Netlify for static deployment
- Netlify redirect configuration enables direct loading of every client-side route

### Planned Production Services

The frontend is structured so the following services can be integrated without changing the product navigation:

- Authentication provider: Clerk or Auth.js
- Backend API: FastAPI or Node.js
- Relational data: PostgreSQL
- Talent graph: Neo4j
- Search and similarity: Elasticsearch or pgvector
- Caching and queues: Redis
- File storage: Amazon S3 or Cloudinary
- AI orchestration and model services: LangChain, LangGraph, OpenAI-compatible models, or open-source inference services

## Architecture

### Current prototype architecture

    Browser
      -> React application
      -> React Router route registry
      -> Shared application context
      -> Demo candidate data and configurable product modules
      -> Responsive Space Fabric interface
      -> Netlify static deployment

### Target production architecture

    Candidate and recruiter clients
      -> API gateway and authentication
      -> Candidate profile and evidence services
      -> Verification, matching, interview, presentation, and analytics services
      -> PostgreSQL, Neo4j, Redis, search index, and object storage
      -> Explainable talent intelligence outputs

The current route registry and modular configuration make it straightforward to replace demo data with typed API clients when backend services are ready.

## Project Structure

    src/
    ├── assets/       Static visual assets
    ├── components/   Shared visual primitives and data displays
    ├── config/       Configuration for reusable product-area experiences
    ├── context/      Shared client-side application state
    ├── data/         Rich demo candidate records and score inputs
    ├── features/     Reserved product-domain boundaries
    ├── routes/       Central route constants and route registration
    └── screens/      Page-level product experiences

    docs/
    ├── ARCHITECTURE.md
    └── ROUTES.md

## Local Development

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

### Install and run

    npm install
    npm run dev

Open the local URL printed by Vite.

### Production build

    npm run build
    npm run preview

## Environment Configuration

Copy the example environment file before connecting real services.

    copy .env.example .env

Current variables are reserved for future client configuration.

| Variable | Purpose |
| --- | --- |
| VITE_APP_NAME | Public application name |
| VITE_APP_ENV | Current public environment label |
| VITE_API_BASE_URL | Future API base URL |
| VITE_ANALYTICS_KEY | Future public analytics configuration key |

Never place private API keys, database credentials, or model-provider secrets in variables prefixed with VITE_. Those values are exposed to the browser at build time.

## Deployment

The app is configured for Netlify.

| Setting | Value |
| --- | --- |
| Build command | npm run build |
| Publish directory | dist |
| SPA fallback | All paths resolve to index.html |

Any new route registered in src/routes/AppRoutes.jsx will work on direct refresh because of the Netlify history fallback.

## Design and Engineering Principles

- Evidence before claims
- Explainability before opaque scoring
- High-signal candidate evaluation over keyword matching
- Candidate agency alongside recruiter efficiency
- Responsive, accessible, high-contrast interactions
- Clear separation between UI prototype data and production integrations
- A modular frontend that can grow into an API-backed platform

## Roadmap

### Next implementation phase

- Connect real sign-in and role-aware access control
- Ingest GitHub, LinkedIn, portfolio, credential, and hackathon data
- Persist candidate profiles, shortlists, and hiring decisions
- Add upload and analysis workflows for resumes, project decks, and certificates
- Build model-backed scoring, verification, and role matching services
- Add recruiter job creation, saved searches, and candidate comparison persistence

### Future platform vision

- Graph-based Talent Intelligence Engine
- Campus and community talent heatmaps
- Salary and career-growth prediction
- Workforce skill intelligence for enterprises
- Company-wide talent graph and internal mobility insights
- Continuous career intelligence that evolves with new evidence

## Project Status

TalentIQ is a polished, frontend-first hackathon prototype. It demonstrates the complete product story and all major workflow surfaces with interactive routing, responsive UI, and realistic data. Backend intelligence, integrations, uploads, and persistence are intentionally represented as the next build phase.

## License

This project is currently shared for hackathon evaluation. Add a license before using it in a public or commercial production setting.
