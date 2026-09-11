# Nox7 project rules

This file is the source of truth for coding agents working on the Nox7 investor-demo visual MVP.

## Mission

Build a **visual MVP** of the approved Nox7 prototype in React, TypeScript, and Vite. The investor presentation is **Friday, September 18, 2026**. The current application is a foundation starter only. Product screens have not been migrated yet.

## Non-negotiable constraints

- Treat `reference/` as frozen source. Do **not** edit, overwrite, or generate into those HTML files.
- `reference/Nox7_VC_Demo_QA_Final.html` is the current primary visual and functional reference.
- Keep the supplied logos in `public/brand/`. The black backgrounds are part of the supplied images; transparent production variants can be prepared later.
- Rebuild approved screens as reusable React and TypeScript components. Do **not** turn the large reference HTML into the application architecture.
- Do **not** add a backend, database, authentication service, production identity provider, or paid dependency.
- Do **not** use real customer data. Mock data is required for the visual MVP.
- Do **not** redesign product screens unless a later task explicitly asks for a visual change.

## Stack

- React 19
- TypeScript
- Vite
- npm
- Oxlint for linting

No extra UI kit, router, state library, or styling framework is required until a later task needs it.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

The development server binds to `0.0.0.0:5173`. Open `http://localhost:5173`.

## Repository layout

```text
src/                 React application (starter shell only)
public/brand/        Canonical Nox7 logos
reference/           Frozen HTML prototypes — do not edit
AGENTS.md            These project rules
README.md            Human setup and startup instructions
```

## Implementation rules

- Prefer small, reusable components over copying entire reference documents into one file.
- Match the approved visual language from the primary reference when screens are later rebuilt: dark surfaces, purple accent `#8B6FE8`, Inter / Space Grotesk / JetBrains Mono.
- Keep TypeScript strict. Avoid `any`.
- Keep changes scoped. Do not migrate screens, add routing, or invent product flows in a foundation-only change.
- Verify the app actually loads after setup or UI work.

## Out of scope for the current visual MVP

- Backend APIs
- Databases
- Authentication / authorization services
- Paid SaaS SDKs
- Real customer, tenant, or operational data
- Merging this work into `main` unless a human explicitly asks
