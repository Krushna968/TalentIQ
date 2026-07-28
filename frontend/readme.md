# TalentIQ — Frontend

### Verified Skill Intelligence for Modern Hiring

[Live Demo](https://talentiq-ai-platform.netlify.app) · [Project Root](../README.md) · [Route Map](docs/ROUTES.md) · [Architecture](docs/ARCHITECTURE.md)

Frontend for the TalentIQ talent intelligence platform. See the [root README](../README.md) for the full project overview, backend API, and production roadmap.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Components](#components)
- [Screens](#screens)
- [Data Layer](#data-layer)
- [Design System](#design-system)
- [Local Development](#local-development)
- [Environment](#environment)
- [Deployment](#deployment)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | Component-driven UI |
| Vite | 8 | Dev server and builds |
| React Router | 7 | Client-side routing |
| Recharts | 3 | Data visualizations |
| CSS | — | Space Fabric design system |
| Tailwind | 4 | Utility CSS (tooling available) |
| TypeScript | 6 | Config present, JSX active |

---

## Project Structure

```
src/
├── assets/         Static visual assets (hero.png, icons)
├── components/     Reusable UI primitives and data displays
│   ├── RadarChart.jsx         SVG competency radar
│   ├── ScoreRing.jsx         Animated circular score
│   ├── SpaceFabric.jsx       Particle network background
│   ├── TopNav.jsx            Role-aware navigation
│   └── VerificationStamp.jsx Gold verification badge
├── config/
│   └── productModules.js     Centralized module definitions
├── context/
│   └── AppContext.jsx        Shared state (candidates, pipeline)
├── data/
│   └── candidates.js        5 demo candidate records
├── features/                Reserved domain boundaries
├── routes/
│   ├── paths.js             Single source of truth for all routes
│   └── AppRoutes.jsx        Route registration with React Router
└── screens/                 Page-level components
    ├── LandingPage.jsx
    ├── AuthScreen.jsx
    ├── CandidateDashboard.jsx
    ├── RecruiterSearch.jsx
    ├── AIInterview.jsx
    ├── TalentReport.jsx
    └── ProductModule.jsx     Generic template for module routes

docs/
├── ARCHITECTURE.md
└── ROUTES.md
```

---

## Routes

| Audience | Experience | Route |
|---|---|---|
| Everyone | Landing page | `/` |
| Candidate or recruiter | Access gateway | `/auth` |
| Candidate | Talent cockpit | `/candidate` |
| Candidate | Digital Talent Identity | `/candidate/profile` |
| Candidate | Career roadmap | `/candidate/roadmap` |
| Candidate | Resume builder | `/candidate/resume-builder` |
| Candidate | Job recommendations | `/candidate/jobs` |
| Recruiter | Talent Search | `/recruiter` |
| Recruiter | Hiring pipeline | `/recruiter/pipeline` |
| Recruiter | Candidate comparison | `/recruiter/compare` |
| Recruiter | Intelligence Dossier | `/report/:id` |
| Everyone | Verification overview | `/verification` |
| Recruiter | Role matching | `/matching` |
| Recruiter | Hiring analytics | `/analytics` |
| Candidate | Interview practice | `/interview` |
| Candidate | Interview report | `/interview/report` |
| Candidate | Team contributions | `/team-contributions` |
| Candidate | Presentation intelligence | `/presentations/analyze` |
| Recruiter | Hackathon-to-hiring | `/hackathons` |
| Recruiter | Trust and fraud review | `/trust` |

Route constants: `src/routes/paths.js`. Register new routes in `src/routes/AppRoutes.jsx`.

---

## Components

### RadarChart.jsx
SVG-based radar/spider chart for competency matrix visualization. Accepts `data`, `size`, `maxValue` props.

### ScoreRing.jsx
Animated SVG circular progress ring for talent score display. Accepts `score`, `size`, `strokeWidth` props.

### SpaceFabric.jsx
Canvas-based animated particle network background with cursor interaction and twinkling nodes. Renders in a fixed fullscreen layer.

### TopNav.jsx
Sticky navigation bar with role-based links. Switches between candidate links and recruiter links based on context.

### VerificationStamp.jsx
Small gold verification badge icon. Accepts `size` and `className` props.

---

## Screens

### LandingPage
Product landing page with hero section ("Your skills, verified. Not just claimed."), signal statistics, and verification type cards. First route users see.

### AuthScreen
Authentication/role selection screen with candidate/recruiter toggle and simulated login. Demo credentials are pre-filled for quick access.

### CandidateDashboard
Talent cockpit with tabs (Overview, Commits, Skills, Network), competency radar chart, verified signals grid, career roadmap sidebar, and activity timeline.

### RecruiterSearch
Copilot-style talent search with filters (specialism, minimum score, verified only), animated match rings, candidate grid with sorting and status badges.

### AIInterview
Guided technical interview with 5 scripted questions, real-time scoring (Technical Accuracy, Communication, Problem Solving), and chat interface.

### TalentReport
Intelligence dossier page (`/report/:id`) with metric cards for each evidence category, decision bar (Reject/Hold/Hire), and animated score bars.

### ProductModule
Generic template for configurable module routes. Reads from `productModules.js` config. Used by 12 of 18 routes.

---

## Data Layer

Static demo data in `src/data/candidates.js` provides 5 candidate records with rich scoring across all evidence categories. This file is designed to be replaced with an API client when the backend is ready.

The `src/context/AppContext.jsx` provides shared state (`candidates` array and `setCandidateStatus` function) consumed by screens.

**Next step:** Replace `src/data/candidates.js` with a typed API client using `VITE_API_BASE_URL` from environment.

---

## Design System

### Space Fabric
- **Deep Void** backgrounds for focus and contrast
- **Cyan Starlight** and **Nebula Gold** for intelligence signals
- **Interactive particle networks** representing connected talent evidence
- **Deep Space Glass** surfaces with translucency and blur
- **Hover states** with restrained cyan/gold glow effects
- **Responsive breakpoints** at 900px and 640px

Styles are defined in `src/index.css` (301 lines). Reduced-motion preferences are respected.

---

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

### Production build
```bash
npm run build
npm run preview
```

---

## Environment

Copy `frontend/.env.example` to `frontend/.env`:

```bash
copy .env.example .env
```

| Variable | Purpose |
|---|---|
| `VITE_APP_NAME` | Public application name |
| `VITE_APP_ENV` | Environment label |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_ANALYTICS_KEY` | Analytics key |

Never place private keys in `VITE_` variables — they're exposed in the browser.

---

## Deployment

Configured for Netlify via `netlify.toml` in the project root.

| Setting | Value |
|---|---|
| Build command | `cd frontend && npm run build` |
| Publish directory | `frontend/dist` |
| SPA fallback | All paths → `index.html` |

---

## Design Principles

- Evidence before claims
- Explainability before opaque scoring
- High-signal evaluation over keyword matching
- Candidate agency alongside recruiter efficiency
- Responsive, accessible, high-contrast interactions
- Clear separation between demo data and production integrations
