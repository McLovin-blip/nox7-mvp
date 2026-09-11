# Nox7 MVP handoff

This repository is the Nox7 investor-demo **visual MVP**. The React + TypeScript + Vite application currently ships a starter page only. Approved product screens have not been redesigned or migrated yet.

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

Visual exploration laboratory (not production navigation):

[http://localhost:5173/explore.html](http://localhost:5173/explore.html)

Use the laboratory switcher to compare directions A, B and C at the same viewport. Notes: [`docs/visual-directions.md`](docs/visual-directions.md).

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

- Files inside `reference/` are preserved source references. Do not edit or overwrite them.
- `reference/Nox7_VC_Demo_QA_Final.html` is the current primary visual and functional reference.
- Files inside `public/brand/` are the supplied Nox7 brand assets.
- The black backgrounds are currently part of the supplied logo images. Transparent production variants can be prepared during implementation.
- Rebuild approved screens as reusable React and TypeScript components; do not make the large reference HTML file the application architecture.
- No backend, database, production authentication, or real customer data is required for the current visual MVP.
- Coding agents should follow `AGENTS.md`.

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
├── AGENTS.md
├── index.html
├── package.json
└── README.md
```

## MVP deadline

Investor presentation: Friday, September 18, 2026.
