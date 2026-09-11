# Executive Hub — component proposal

Awaiting product approval. No Hub implementation on this branch until approved.

Base: `main` (spec + foundation). Locked login will be ported from `design/visual-directions` without restyling. `/reference` stays frozen. `/explore.html` stays the visual lab and is not the production Hub.

Concept A is the Hub frame. Concept B’s connected-assurance map is an expandable section inside that frame — not a second Hub.

## What we take

**From Concept A (structure)**
- Left rail: Hub, Regulatory, Controls, Evidence, Risks, Reports, Activity, plus user card
- Top chrome: brand, organisation, review countdown, reporting period, Ask Nox AI ⌘K
- Greeting and one-line position
- Four balanced indicators (readiness is one tile, not the page)
- Nox AI briefing on the Hub canvas
- Numbered priority actions
- Right-side Ask Nox AI panel on the authenticated shell

**From Concept B (expandable section only)**
- Assurance map: highest-impact gap at the centre, linked to Frameworks, Controls, Evidence, Risks, and Owners
- Filter chips on the map (All / Frameworks / Evidence / Risks)
- Status legend (assured / partial / attention)
- Opening the map is the “connected gap” step in the demo journey

**From approved spec (copy and numbers)**
- Meridian International, Layla Rahman, 14-day review
- ISO 27001, NIS2, GDPR, NCA ECC
- Primary gap: supplier-assurance policy current; current critical-supplier assessments missing
- Omar Haddad accountable
- Mock JSON as the single store — not screenshot figures (76%, −3.2%, “four critical suppliers”, extra nav like Settings)

## What we do not take

- Locked login is unchanged
- No clone of the old HTML Hub (no 7-node cyber orbit, no giant organisation score as the story)
- No second Nox AI column inside the map; Concept B’s right-rail AI / recommended action / coverage maps onto the shared Ask Nox AI panel
- No backend, live AI, or new dependencies
- Other modules stay placeholders in the rail (navigable later)

## Expand behaviour

1. Default Hub = Concept A (greeting, four indicators, briefing, priority actions).
2. Control on the Hub: **Assurance map** (collapsed).
3. Expand replaces the four-indicator row with the Concept B map (briefing and actions stay).
4. Selecting a map node updates Ask Nox AI context. Citations still open seeded source cards.
5. Collapse returns to the four indicators.

## File tree (proposed)

```text
src/
  main.tsx
  App.tsx                          # login | authenticated views
  index.css
  app/
    mock/
      types.ts
      store.ts                     # reads docs/mock/meridian-organisation.json
    chrome/
      AppShell.tsx                 # rail + top bar + AI panel slot
      Sidebar.tsx
      TopBar.tsx
      UserCard.tsx
      chrome.css
    login/
      LoginScreen.tsx              # port of locked ReferenceLogin
      login.css                    # port as-is
    hub/
      ExecutiveHub.tsx             # Concept A composition
      HubGreeting.tsx
      PositionStrip.tsx            # four indicators
      AiBriefing.tsx
      PriorityActions.tsx
      AssuranceMap.tsx             # Concept B, collapsed | expanded
      hub.css
    ai/
      NoxAiPanel.tsx               # facts | interpretation | confidence | action
      SourceCard.tsx
      ai.css
    brand/
      Brand.tsx                    # owl + wordmark from public/brand
```

`src/explore/` is not on this base branch. It remains on `design/visual-directions` as the lab. Production Hub does not import lab direction files.

## Component contracts

| Component | Owns | Does not own |
|---|---|---|
| `App` | Login vs Hub view state | Visual layout |
| `AppShell` | Rail, top bar, Ask Nox AI open/close | Hub content |
| `ExecutiveHub` | Greeting, indicators, briefing, actions, map expand state | AI panel body |
| `PositionStrip` | Coverage, evidence health, material gaps, readiness | Map |
| `AiBriefing` | Hub-canvas briefing + follow-up prompts that open the panel | Sourced-fact ledger |
| `PriorityActions` | Numbered actions, owner, due, approval required | Approval execution (later) |
| `AssuranceMap` | Nodes, links, filters, legend | Page chrome |
| `NoxAiPanel` | Context, question, sourced facts + citations, interpretation, confidence/freshness, recommended action + human-approval line | Hub metrics |

## First implementation slice (after approval)

Login (ported, locked) → Executive Hub (Concept A) → Ask Nox AI panel → expandable Assurance map.

Not in this slice: evidence upload, approval execution, Board Summary, populated module pages beyond Hub.

## Approval needed

1. This tree and split (A = frame, B = expandable map).
2. Map replaces the four-indicator row when expanded (briefing + actions remain).
3. Spec/mock numbers, not screenshot numbers.
4. No Settings item; spec nav only.
5. Shared Ask Nox AI panel instead of Concept B’s in-canvas AI card.
