# Nox7 MVP handoff

This repository is the Nox7 investor-demo **visual MVP**. The React + TypeScript + Vite application currently ships a starter page only.

The approved product specification is in [`docs/product-specification.md`](docs/product-specification.md). Canonical mock data is in [`docs/mock/meridian-organisation.json`](docs/mock/meridian-organisation.json). Demo notes are in [`docs/demo.md`](docs/demo.md).

This MVP uses in-app mock data only. Upload processing and Nox AI answers are produced from that dataset so the demo is reliable. There is no backend, database, paid service or external AI API. Do not describe that behaviour in the product UI; keep it in this README and `docs/demo.md`.

## Setup

Requires **Node.js 20+** (Node 22 is recommended) and **npm**.

```bash
npm install
```

## Start the app

Development server (binds to port **5173**):

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). You should see the Nox7 starter page with the supplied logos.

Production build and local preview (port **4173**):

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

## Important

- Files inside `reference/` are preserved source references. Do not edit or overwrite them. They are visual-language references only.
- Product behaviour follows `docs/product-specification.md`.
- Files inside `public/brand/` are the supplied Nox7 brand assets.
- The black backgrounds are currently part of the supplied logo images. Transparent production variants can be prepared during implementation.
- Rebuild approved screens as reusable React and TypeScript components from `docs/product-specification.md`; do not make the large reference HTML file the application architecture.
- In the UI, say **organisation**, never tenant. Record identifiers are secondary metadata only.
- No backend, database, production authentication, paid service, external AI API, or real customer data is required for the current visual MVP.
- Coding agents should follow `AGENTS.md` and the approved specification.

## Folder inventory

```text
Nox7-MVP/
├── public/
│   └── brand/
│       ├── nox7-owl-mark.png
│       └── nox7-wordmark.png
├── reference/
│   ├── Nox7_VC_Demo_QA_Final.html
│   ├── nox7_dashboard_v1_5.html
│   ├── nox7_dashboard_v1_6_demo.html
│   ├── nox7_expanded_concept_1.html
│   └── nox7_screenshots_master.html
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── docs/
│   ├── product-specification.md
│   ├── demo.md
│   └── mock/
│       └── meridian-organisation.json
├── AGENTS.md
├── index.html
├── package.json
└── README.md
```

## MVP deadline

Investor presentation: Friday, September 18, 2026.
