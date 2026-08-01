# Proof-to-Hire Passport prototype

An isolated, dependency-free prototype of TalentIQ’s recommended USP. It uses seeded, clearly disclosed evidence to demonstrate the recruiter decision experience and deterministic scoring logic.

## Run locally

Serve this folder with any static server, for example:

```powershell
npx serve .
```

Then open the supplied local URL. Do not use `index.html` directly: ES modules require a local server in most browsers.

## Boundaries

- No data is externally verified in this prototype.
- Score inputs and sample evidence live in `src/passport.js`.
- `src/passport.js` is deliberately framework-independent so it can later move into the existing backend as a scoring service.
