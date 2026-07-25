# Frontend Architecture

src/components: reusable visual primitives and data visualisations
src/config: product module configuration used by route views
src/context: shared client-side application state
src/data: demo candidate data for the hackathon build
src/features: reserved product-domain boundaries
src/routes: URL constants and React Router registration
src/screens: complete page-level experiences
src/assets: static UI assets

## Demo boundaries

This repository focuses on the hackathon-ready frontend: clear flows, connected routes, interactive visualisation, and believable data. API integrations, authentication, storage, and automated intelligence services can be added behind the existing route and state boundaries without changing product navigation.

## Recommended next integrations

1. Replace src/data/candidates.js with a typed API client.
2. Connect /auth to the chosen authentication provider.
3. Persist pipeline decisions through a backend endpoint.
4. Attach real evidence sources to candidate reports.
