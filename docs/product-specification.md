# Nox7 approved product specification

Approved for the 18 September 2026 visual MVP, with product amendments applied.  
This document is the implementation source of truth for information architecture, mock data, AI behaviour and acceptance. Do not build screens in the specification branch.

Related files:

- Canonical mock dataset: [`docs/mock/meridian-organisation.json`](./mock/meridian-organisation.json)
- Demo notes (including mock-processing honesty): [`docs/demo.md`](./demo.md)

`reference/` remains frozen. Do not add a backend, database, paid service or external AI API.

---

## 1. Design principles

1. **Compliance-led.** Nox7 is an enterprise compliance and risk intelligence platform. The story is multi-framework readiness, not a security incident.
2. **Say “Organisation”, never “Tenant”, in the UI.**
3. **No single-score product.** The Hub and Board Summary always balance:
   - framework coverage
   - evidence health
   - material gaps
   - control assurance
   - connected risks
   - accountable actions  
   A readiness figure may appear as one indicator. It must not be the whole story.
4. **Executive language first.** Prefer: compliance readiness, framework coverage, material gaps, evidence health, control assurance, connected risks, accountable owners, recommended actions, regulatory exposure, board reporting. Record identifiers are secondary metadata on detail views only.
5. **One polished vertical journey.** Other modules are populated and navigable. Deep authoring is out of scope.
6. **Ask Nox AI is a consistent right-side panel** on every authenticated screen. It is not a standalone chatbot page.
7. **AI inherits context:** current screen, selected record, filters and connected data.
8. **Every citation opens a seeded source record.** AI must not invent requirements, evidence, scores or relationships.
9. **Sourced facts, AI interpretation and recommended action are visually distinct.**
10. **Humans approve. Rules then update the position.** AI explains and proposes only.
11. **One shared store.** After approval, Hub, Regulatory, Controls, Evidence, Risks, Reports, Activity and the AI panel agree.
12. **Honest UI copy.** Do not describe mock or fixture behaviour with internal engineering language in the product interface. Document that behaviour in README and `docs/demo.md` only.
13. Keep supplied brand language: dark surfaces, purple `#8B6FE8`, logos in `public/brand/`. Do not clone the reference HTML as architecture.

---

## 2. Approved information architecture

### Shell

```text
Enterprise login
→ Authenticated app
   Chrome: brand, organisation, user, review countdown, Ask Nox AI
   Nav: Hub · Regulatory · Controls · Evidence · Risks · Reports · Activity
   Right-side panel: Ask Nox AI (contextual, same on every screen)
```

Login is required and looks like an enterprise product. It is not a numbered demo stage.

### Modules

| Module | Purpose in this MVP | Depth |
|---|---|---|
| Executive Hub | Balanced position: coverage, evidence health, gaps, assurance, risks, actions | Polished |
| Regulatory | Obligations across ISO 27001, NIS2, GDPR, NCA ECC, internal/contractual | Populated, navigable |
| Controls | Control library and multi-framework support | Populated, navigable |
| Evidence | Catalogue, health, reuse, multi-file upload and review | Polished (upload + approval) |
| Risks | Connected third-party and regulatory risks | Populated, navigable |
| Reports | Board Summary from current state; other report types listed | Board Summary polished |
| Activity | Uploads, proposals, approvals, rejections | Populated history |
| Nox AI panel | Contextual Q&A on every authenticated screen | Polished |

No create/edit/delete authoring workflows except the demo upload-and-approve path.

### Primary journey (build this first)

```text
Login
→ Hub
→ Contextual Nox AI
→ Connected compliance gap
→ Multi-file evidence upload
→ Review and approval
→ Updated position
→ Board Summary
```

### Connected model (user-facing)

```text
Frameworks → Obligations → Internal policies → Controls
→ Evidence → Risks → Owners → Remediation actions → Executive reports
```

Opening any record shows its neighbours in this chain. A change to one approved record updates every connected view.

---

## 3. Canonical mock dataset

**Source file:** `docs/mock/meridian-organisation.json`  
**Organisation:** Meridian International  
**User:** Layla Rahman, Chief Compliance Officer  
**Review:** governance and compliance review in **14 days**  
**Frameworks:** ISO 27001, NIS2, GDPR, NCA ECC, plus internal policy and contractual commitments

### People

| Name | Role | Accountability |
|---|---|---|
| Layla Rahman | Chief Compliance Officer | Approves evidence and remediation |
| Omar Haddad | Head of Procurement | Critical-supplier assessments |
| Nadia Chen | Information Security Lead | Supplier-assurance control owner |
| Tomas Berg | Privacy Lead | GDPR processor / supplier diligence |
| Sara Al-Mutairi | Regional Compliance (KSA) | NCA ECC overlap |

### Seeded evidence (already in the catalogue)

| Title | Health | Notes |
|---|---|---|
| Information security policy | Current | Reused across ISMS obligations |
| Enterprise risk assessment | Current | Supports risk register |
| Supplier assurance policy | Current | Policy exists; does **not** replace assessments |
| Business continuity test report | Expiring | Secondary health signal |
| Data-retention standard | Current | GDPR / internal policy |
| Internal audit findings | Current | Flags supplier-assessment gap |
| Management attestations | Current | |
| Previous regulatory assessment | Current | |
| Remediation action register | Current | Open action: obtain supplier assessments |
| 2024 supplier questionnaire pack | Duplicate | Older copy of a retired pack |
| 2023 critical-supplier assessments | Expired | Not acceptable for the review |

### The material gap

Meridian has a documented **supplier-assurance policy**, but **current assessment evidence is missing for several critical suppliers**. That gap leaves related obligations only partly covered under ISO 27001, NIS2, GDPR and NCA ECC, weakens the supplier-assurance control, and elevates third-party and regulatory risk.

This is not a cyberattack, infrastructure path or security-incident story.

### Highest-impact action

Upload and approve **current critical-supplier assessments** (multi-file). Accountable owner: **Omar Haddad**. Approver: **Layla Rahman**.

JSON IDs exist for implementation. In the UI they appear only as secondary metadata.

---

## 4. Before / after state

Values below are indicators among several. Do not present readiness as the product.

| Indicator | Before approval | After approval |
|---|---|---|
| Compliance readiness | Needs attention (64) | Improved (72) |
| ISO 27001 coverage | 78% | 86% |
| NIS2 coverage | 71% | 82% |
| GDPR coverage | 69% | 80% |
| NCA ECC coverage | 66% | 79% |
| Evidence health | 1 missing critical pack, 1 expired, 1 duplicate, 1 expiring | Critical pack current; expired pack superseded; duplicate still flagged |
| Material gap | Critical-supplier assessments missing | Gap closed for the review |
| Supplier-assurance control | Partially assured (policy only) | Assured (policy + current assessments) |
| Third-party risk | Elevated | Reduced |
| Regulatory exposure | Elevated ahead of review | Reduced |
| Accountable action | Obtain and approve assessments — Omar Haddad | Completed; approved by Layla Rahman |
| Board Summary | Describes the material gap and missing evidence | Describes improved coverage and cites new evidence |

Approval is the only trigger. Reject / cancel leaves the **before** state everywhere, including the AI panel and Board Summary.

---

## 5. Nox AI response contract

**Placement:** persistent **Ask Nox AI** control opens a **right-side panel**. Same layout on Hub, Regulatory, Controls, Evidence, Risks, Reports and Activity.

**Context object** (always sent into the answer; never shown as engineering payload in the UI):

- `screen`
- `selectedRecord` (id, type, title — or none)
- `filters`
- `approvalState` (`before` \| `after`)
- `connectedRecordIds`

**Every response renders these blocks, in order:**

1. Question and screen context (plain language, e.g. “From Executive Hub”)
2. Concise executive answer
3. **Sourced facts** — only statements backed by seeded records
4. **AI interpretation** — labelled as interpretation, not fact
5. **Recommended action** — labelled separately; not applied until approval
6. Connected obligations, controls and risks
7. Evidence freshness
8. Confidence
9. Accountable owner
10. Human approval required? (yes/no)
11. Expected effect on coverage, assurance, risks and reporting

**Citations:** every sourced fact cites one or more seeded records. The citation is a control that opens that record in the product (Evidence, Regulatory, Control, Risk, Report or Activity). Broken or empty citations fail acceptance.

**Allowed answers:** only questions listed in the mock file for that screen, plus a constrained off-script reply that restates the demo graph and offers those questions. No external model.

**Prohibited:** inventing obligations, documents, scores or links; applying mappings; changing readiness or risk; using the words tenant, simulation, mock engine, or similar in panel copy.

Screen question sets are defined in `docs/mock/meridian-organisation.json` → `ai.prompts`.

---

## 6. Multi-file upload (vertical journey)

In one action the user selects several files representing **current critical-supplier assessments**.

The UI must show: multiple selection, progress, processing, suggested classification, suggested framework/control mappings, duplicate detection, missing metadata, human review, approve or reject.

After **approve**, apply the after-state in section 4 across all modules.  
After **reject**, remain on the before-state.

Fixture outcomes (duplicate, missing metadata, success) are defined in the mock file. How those outcomes are produced is documented in `docs/demo.md`, not in the UI.

---

## 7. MVP acceptance criteria

### Must pass

- [ ] Login is an enterprise screen and is not counted as a narrative stage.
- [ ] Authenticated chrome uses **Organisation** (Meridian International), never Tenant.
- [ ] Hub shows coverage, evidence health, material gaps, control assurance, connected risks and accountable actions together — not a single score story.
- [ ] Ask Nox AI is a right-side panel on every authenticated module, inheriting screen, selection and connected data.
- [ ] Every AI citation opens a real seeded record.
- [ ] Facts, interpretation and recommended action are visually distinct.
- [ ] User can walk policy → obligations → control → missing evidence → connected risks without identifier-led navigation.
- [ ] Multi-file upload, processing states, review and approve/reject work in one session.
- [ ] Approve updates Hub, Regulatory, Controls, Evidence, Risks, Reports, Activity and the AI panel consistently; reject does not.
- [ ] Board Summary is generated from current shared state and cites seeded sources.
- [ ] Regulatory, Controls, Evidence, Risks, Reports and Activity are populated and navigable.
- [ ] Identifiers appear only as secondary metadata.
- [ ] UI copy has no internal mock/simulation phrasing.
- [ ] `reference/` is unchanged.
- [ ] No backend, database, paid service or external AI API.

### Out of scope (do not build)

Production authentication; persistence; live AI; arbitrary-document extraction; live regulatory feeds; production scoring; complex authoring; multi-tenant admin; real customer data; HTML clone; incident/attack-path story.
