# Nox7 project rules

This file is the source of truth for coding agents working on the Nox7 investor-demo visual MVP.

## Mission

Build a **visual MVP** of Nox7 as an enterprise compliance and risk intelligence platform. The investor presentation is **Friday, September 18, 2026**. The current application is a foundation starter only. Product screens have not been migrated yet.

Approved specification: `docs/product-specification.md`  
Canonical mock data: `docs/mock/meridian-organisation.json`  
Demo notes: `docs/demo.md`

## Non-negotiable constraints

- Follow `docs/product-specification.md`. Do not invent a parallel product story.
- Treat `reference/` as frozen source. Do **not** edit, overwrite, or generate into those HTML files. Use it for visual language only (surfaces, colour, typography, brand), not for IA or the demo narrative.
- Keep the supplied logos in `public/brand/`. The black backgrounds are part of the supplied images; transparent production variants can be prepared later.
- Rebuild screens as reusable React and TypeScript components. Do **not** turn the large reference HTML into the application architecture.
- In all user-facing copy say **organisation**, never tenant. Keep record identifiers as secondary metadata.
- Do **not** add a backend, database, authentication service, production identity provider, paid dependency, or external AI API.
- Do **not** use real customer data. Use the canonical mock dataset.
- Do **not** expose internal phrases such as “deterministically simulated” in the product UI. Record that behaviour only in README and `docs/demo.md`.
- Ask Nox AI is a contextual right-side panel on every authenticated screen. Every citation must open a seeded record.
- Prioritise the approved vertical journey before deepening other modules.
- Do not build product screens in a specification-only change.

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
docs/                Approved specification, demo notes, mock dataset
AGENTS.md            These project rules
README.md            Human setup and startup instructions
```

## Implementation rules

- Prefer small, reusable components over copying entire reference documents into one file.
- Match the approved visual language: dark surfaces, purple accent `#8B6FE8`, Inter / Space Grotesk / JetBrains Mono. Information architecture and narrative come from the product specification, not from the HTML prototypes.
- Keep TypeScript strict. Avoid `any`.
- Keep this specification change documentation-only. Do not add product screens until a later implementation task.
- Verify the app actually loads after setup or UI work.

## Out of scope for the current visual MVP

- Backend APIs
- Databases
- Authentication / authorization services
- Paid SaaS SDKs and external AI APIs
- Real customer or operational data
- Merging this work into `main` unless a human explicitly asks
