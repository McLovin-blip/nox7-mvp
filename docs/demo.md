# Nox7 investor demo notes

For the 18 September 2026 visual MVP. Product rules: [`docs/product-specification.md`](./product-specification.md).

## Honesty (not for the product UI)

The interface must describe what the user did in ordinary product language (uploaded, processing, indexed, duplicate found, waiting for approval, approved).

Do **not** put engineering phrases such as “deterministically simulated”, “mock engine” or “fixture-driven LLM” in the product UI.

This demo uses a shared in-app dataset (`docs/mock/meridian-organisation.json`). There is no backend, database, paid service or external AI API. Upload processing, duplicate detection, suggested mappings and Nox AI answers are produced from that dataset so the journey is reliable in the room.

## Script (about eight minutes)

1. Sign in as Layla Rahman (any demo credentials succeed).
2. Hub: show coverage, evidence health, the supplier-assurance gap, connected risks and the accountable action together. Do not pitch a single readiness number.
3. Ask Nox AI (right-side panel): “Which gap affects the most frameworks?”
4. Open the supplier-assurance gap and walk policy → overlapping obligations → partial control → missing evidence → third-party and regulatory risk.
5. Evidence: select several assessment files in one upload; show progress and suggested mappings; include the duplicate / missing-metadata fixtures if useful.
6. Review and **approve**. Reject is available but not the happy path.
7. Return to Hub: position has moved; Activity shows the approval.
8. Open Board Summary and ask Nox AI to show sources.

If asked whether this is only a briefing, open Regulatory overlap or the supplier-assurance control’s framework list. Same organisation data.

## Language

Say **organisation**, never tenant. Lead with executive wording. Identifiers stay in the metadata of a record, not in the spoken demo.

## Phishing demo path (final)

1. Hub → **Open phishing risk** (RSK-002)
2. Risk detail → what could happen, inherent/residual, appetite, next action
3. Linked controls → CTL-005 Phishing-resistant MFA, CTL-006 Email threat protection
4. Evidence → EVD-005 MFA coverage report, EVD-006 Email filtering test
5. Next action → Learning Manager, due date, Monitoring
6. Ask Nox → four contextual questions on the selected risk
7. Connect → focused relationship strip for the same records
8. Reports → Phishing Risk Summary

Shared mock: `docs/mock/meridian-organisation.json` (`demo` block).

