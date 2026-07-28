# TalentIQ — Agent Guide

## Project
AI-Verified Talent Intelligence Platform. Candidates build a Digital Talent Identity from verified work (GitHub, hackathons, credentials, presentations, interviews). Recruiters discover, evaluate, and hire using evidence.

## Structure
```
talentiq-app/
├── frontend/          React 19 + Vite 8 + React Router 7 + Recharts
│   ├── src/
│   │   ├── components/   Reusable visual primitives (RadarChart, ScoreRing, etc.)
│   │   ├── config/       productModules.js — centralized module config
│   │   ├── context/      AppContext.jsx — shared state (candidates, pipeline)
│   │   ├── data/         candidates.js — 5 demo candidate records
│   │   ├── routes/       paths.js + AppRoutes.jsx — 18 routes
│   │   └── screens/      Page-level components
│   └── docs/             ARCHITECTURE.md, ROUTES.md
├── backend/           Node.js + Express + TypeScript (scaffolded)
│   └── src/
│       ├── routes/       12 route files matching frontend routes
│       ├── controllers/  Stub handlers per domain
│       ├── models/       TypeScript interfaces (user, candidate, etc.)
│       ├── services/     Business logic stubs
│       ├── middleware/   auth, validation, error handling
│       └── config/       env, database
└── netlify.toml       Build: cd frontend && npm run build, publish frontend/dist
```

## Routes (18 frontend → backend)
Frontend routes in `frontend/src/routes/paths.js`. Backend API under `/api`.

| Frontend Route | Backend Resource |
|---|---|
| `/auth` | `/api/auth` |
| `/candidate`, `/candidate/profile`, `/candidate/roadmap`, `/candidate/resume-builder`, `/candidate/jobs` | `/api/candidates` |
| `/recruiter`, `/recruiter/pipeline`, `/recruiter/compare` | `/api/recruiters` |
| `/verification` | `/api/verification` |
| `/matching` | `/api/matching` |
| `/analytics` | `/api/analytics` |
| `/interview`, `/interview/report` | `/api/interviews` |
| `/report/:id` | `/api/reports/talent/:id` |
| `/team-contributions` | `/api/team-contributions` |
| `/presentations/analyze` | `/api/presentations` |
| `/hackathons` | `/api/hackathons` |
| `/trust` | `/api/trust` |

## Conventions
- Frontend: JSX, no TypeScript runtime (config present for future), Space Fabric dark theme
- Backend: TypeScript, ESM (`"type": "module"`), Express
- State: React Context (AppContext.jsx)
- Data: Static demo data in `frontend/src/data/candidates.js`
- Styling: Custom CSS (`index.css`), Tailwind tooling available
- Imp. commands: `npm run dev` (frontend root), `npm run dev` (backend root)

## Key Files
- `frontend/src/routes/paths.js` — Single source of truth for all routes
- `frontend/src/config/productModules.js` — Module definitions for ProductModule screen
- `frontend/src/context/AppContext.jsx` — Global state provider
- `frontend/src/data/candidates.js` — Demo data (replace with API client)
- `frontend/src/index.css` — Complete Space Fabric design system

## Next Implementation Priorities
1. Replace `src/data/candidates.js` with typed API client
2. Connect `/auth` to authentication provider
3. Implement backend controller logic and DB models
4. Add real evidence ingestion (GitHub, certifications)
