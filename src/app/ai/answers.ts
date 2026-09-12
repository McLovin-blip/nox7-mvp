import type { AiPanelModel, GapStepId, ModuleId, PositionState } from '../mock/types.ts'
import {
  data,
  hubAnswerBefore,
  internationalFrameworks,
  layla,
  omar,
  organisation,
  personLabel,
  prompts,
  supplierControl,
} from '../mock/data.ts'

const org = organisation.name

const connectedTitles = [
  ...hubAnswerBefore.connected.obligationIds.map((id) => data.obligations.find((item) => item.id === id)?.title),
  ...hubAnswerBefore.connected.controlIds.map((id) => data.controls.find((item) => item.id === id)?.title),
  ...hubAnswerBefore.connected.riskIds.map((id) => data.risks.find((item) => item.id === id)?.title),
].filter((item): item is string => Boolean(item))

function base(
  context: string,
  question: string,
  executiveAnswer: string,
  facts: AiPanelModel['facts'],
  interpretation: string,
  extra: Partial<AiPanelModel> & { prompts: string[] },
): AiPanelModel {
  const after = extra.approval?.startsWith('Already') || extra.recommendedAction?.startsWith('No further')
  return {
    context,
    question,
    executiveAnswer,
    facts,
    interpretation,
    connected: extra.connected ?? connectedTitles,
    freshness: extra.freshness ?? (after ? 'Policy current; 2026 assessments current; 2023 pack superseded' : hubAnswerBefore.freshness),
    confidence: extra.confidence ?? 'high',
    owner: extra.owner ?? (omar?.name ?? ''),
    recommendedAction: extra.recommendedAction ?? hubAnswerBefore.recommendedAction,
    approval: extra.approval ?? 'Human approval required before coverage or risk changes.',
    expectedImpact: extra.expectedImpact ?? hubAnswerBefore.expectedImpact,
    prompts: extra.prompts,
  }
}

const beforeFacts = hubAnswerBefore.sourcedFacts.map((fact) => ({
  text: fact.text,
  citationId: fact.citationIds[0],
}))

const afterFacts: AiPanelModel['facts'] = [
  {
    text: '2026 critical-supplier assessments are current and approved.',
    citationId: 'ev-supplier-assessments-2026',
  },
  {
    text: 'Supplier assurance is assured (policy + current assessments).',
    citationId: 'ctl-supplier-assurance',
  },
  {
    text: 'Third-party assurance and regulatory exposure are reduced.',
    citationId: 'risk-third-party',
  },
]

function afterHub(): AiPanelModel {
  return base(
    `Executive Hub · ${org}`,
    'Why did compliance readiness change?',
    'Readiness moved from 64 to 72 because current critical-supplier assessments were approved. Coverage rose across ISO 27001, NIS2, GDPR and NCA ECC. The change is the same approval, not four separate projects.',
    afterFacts,
    'The board can now cite current assessments. A duplicate questionnaire pack is still flagged and does not reopen the gap.',
    {
      prompts: prompts.hub,
      recommendedAction: 'No further approval is required for this pack. Resolve the duplicate questionnaire when convenient.',
      approval: 'Already approved by Layla Rahman.',
      expectedImpact: 'Coverage is 86 / 82 / 80 / 79 across the four frameworks; control assured; two risks reduced; Board Summary cites the 2026 pack.',
      owner: layla?.name ?? '',
      connected: ['2026 critical-supplier assessments', 'Supplier assurance', 'Third-party assurance', 'Board Summary'],
    },
  )
}

function beforeHub(): AiPanelModel {
  return base(
    `${hubAnswerBefore.screen} · ${org}`,
    hubAnswerBefore.question,
    hubAnswerBefore.executiveAnswer,
    beforeFacts,
    hubAnswerBefore.interpretation,
    { prompts: prompts.hub },
  )
}

export function hubAiFor(position: PositionState): AiPanelModel {
  return position === 'after' ? afterHub() : beforeHub()
}

export function gapAiFor(position: PositionState): Record<GapStepId, AiPanelModel> {
  if (position === 'after') {
    const shared = {
      prompts: prompts.controls,
      recommendedAction: 'Open the Board Summary and cite the 2026 assessments.',
      approval: 'Already approved by Layla Rahman.',
      owner: layla?.name ?? '',
    }
    return {
      overview: base(
        `Supplier assurance · ${org}`,
        'What changes if the recommendation is approved?',
        'The recommendation has already been approved. The control is assured, four obligations are supported, and two connected risks are reduced.',
        afterFacts,
        'The walk now reads as a closed loop rather than a gap.',
        shared,
      ),
      policy: base(
        `Supplier assurance policy · ${org}`,
        'Does a current policy close this gap?',
        'The policy is still current. The gap is closed because current assessments now sit beside it.',
        [
          { text: 'The supplier assurance policy is current (version 3.0).', citationId: 'ev-policy-supplier' },
          { text: '2026 critical-supplier assessments are current.', citationId: 'ev-supplier-assessments-2026' },
        ],
        'Policy alone was never enough; the pair is what the review needs.',
        shared,
      ),
      obligations: base(
        `Overlapping obligations · ${org}`,
        'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?',
        'They overlap on supplier assurance. That overlap is now supported by the same current assessments.',
        [
          { text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.', citationId: 'ctl-supplier-assurance' },
          { text: '2026 critical-supplier assessments support those obligations.', citationId: 'ev-supplier-assessments-2026' },
        ],
        'One approval moved four obligations together.',
        shared,
      ),
      control: base(
        `Supplier assurance control · ${org}`,
        'Why is this control only partially assured?',
        'It is no longer partial. Policy and current assessments are both in place.',
        afterFacts.slice(0, 2),
        'Nadia Chen remains control owner; Omar obtained the pack; Layla approved.',
        shared,
      ),
      evidence: base(
        `Assessments · ${org}`,
        'Which evidence is missing or outdated?',
        'The critical pack is current. The 2023 pack is superseded. A 2024 questionnaire pack is still a duplicate.',
        [
          { text: '2026 critical-supplier assessments are current.', citationId: 'ev-supplier-assessments-2026' },
          { text: '2023 critical-supplier assessments are superseded.', citationId: 'ev-supplier-assessments-2023' },
          { text: 'The 2024 supplier questionnaire pack is a duplicate.', citationId: 'ev-supplier-q-duplicate' },
        ],
        'The duplicate does not reopen the material gap.',
        shared,
      ),
      risks: base(
        `Connected risks · ${org}`,
        'Which compliance gaps contribute to this risk?',
        'The contributing gap is closed. Third-party and regulatory exposure are reduced. Continuity evidence remains a watch item.',
        [
          { text: 'Third-party assurance is reduced.', citationId: 'risk-third-party' },
          { text: 'Regulatory exposure ahead of the review is reduced.', citationId: 'risk-regulatory' },
        ],
        'Both elevated risks moved on the same approval.',
        shared,
      ),
    }
  }

  const shared = { prompts: prompts.controls }
  return {
    overview: base(
      `Supplier assurance · ${org}`,
      'Why is supplier assurance only partially assured?',
      'The control is partial because the policy is current and current assessments for several critical suppliers are missing. That one gap sits under four international frameworks and keeps two connected risks elevated.',
      beforeFacts,
      hubAnswerBefore.interpretation,
      shared,
    ),
    policy: base(
      `Supplier assurance policy · ${org}`,
      'Does a current policy close this gap?',
      'No. The supplier assurance policy is current, but it is not a substitute for current critical-supplier assessments.',
      beforeFacts.slice(0, 2),
      'Counting a current policy under each framework makes coverage look stronger than the evidence supports.',
      shared,
    ),
    obligations: base(
      `Overlapping obligations · ${org}`,
      'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?',
      'All four have a supplier-related obligation that is only partly supported. They share the same policy and the same control.',
      [
        { text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.', citationId: 'ctl-supplier-assurance' },
        { text: 'Supplier relationships — information security is only partially supported.', citationId: 'obl-iso-a532' },
      ],
      'Because the overlap is the same missing evidence, closing one pack improves all four obligations together.',
      { ...shared, connected: data.obligations.filter((item) => item.frameworkId !== 'fw-internal' && item.supportBefore === 'partial').map((item) => item.title) },
    ),
    control: base(
      `Supplier assurance control · ${org}`,
      'Why is this control only partially assured?',
      supplierControl?.partialReason ?? 'Policy is current. Current assessments for critical suppliers are missing.',
      [
        { text: 'Supplier assurance is partially assured.', citationId: 'ctl-supplier-assurance' },
        { text: 'Internal audit findings record that current critical-supplier assessments are missing.', citationId: 'ev-audit-findings' },
      ],
      'The control cannot move to assured until current assessments are uploaded and approved.',
      shared,
    ),
    evidence: base(
      `Missing assessments · ${org}`,
      'Which evidence is missing or outdated?',
      'Current critical-supplier assessments are missing. The 2023 pack is expired and is not acceptable for the review. A 2024 questionnaire pack is flagged as a duplicate.',
      [
        { text: 'Internal audit findings record that current critical-supplier assessments are missing.', citationId: 'ev-audit-findings' },
        { text: '2023 critical-supplier assessments are expired.', citationId: 'ev-supplier-assessments-2023' },
        { text: 'The 2024 supplier questionnaire pack is a duplicate of an older pack.', citationId: 'ev-supplier-q-duplicate' },
      ],
      'Fresh assessments are the missing piece. The current policy and the expired pack do not close the gap.',
      shared,
    ),
    risks: base(
      `Connected risks · ${org}`,
      'Which compliance gaps contribute to this risk?',
      'Third-party assurance and regulatory exposure are elevated because current assessments are missing. The same gap appears across several frameworks.',
      [
        { text: 'Third-party assurance is elevated because current assessments for critical suppliers are missing.', citationId: 'risk-third-party' },
        { text: 'Regulatory exposure ahead of the review is elevated by the same supplier-assurance gap.', citationId: 'risk-regulatory' },
      ],
      'Approving current assessments reduces both risks together, rather than remediating them as separate issues.',
      shared,
    ),
  }
}

function offScript(screen: string, list: string[]): AiPanelModel {
  return base(
    `${screen} · ${org}`,
    'I can answer from this organisation’s records.',
    `Ask one of the questions listed for this screen. I will not invent obligations, evidence, scores or mappings.`,
    beforeFacts.slice(0, 1),
    'I will only use records already in this organisation. I will not invent obligations, evidence, scores or mappings.',
    {
      prompts: list,
      recommendedAction: hubAnswerBefore.recommendedAction,
      connected: list.slice(0, 3),
    },
  )
}

export function answerFor(options: {
  module: ModuleId | 'gap'
  position: PositionState
  question: string
  selectedTitle?: string
  selectedId?: string
}): AiPanelModel {
  const { module, position, selectedTitle, selectedId } = options
  const after = position === 'after'
  const fallback =
    module === 'gap'
      ? gapAiFor(position).overview.question
      : module === 'hub' || module === 'connect'
        ? hubAiFor(position).question
        : prompts[module][0]
  const q = options.question.trim() || fallback

  if (module === 'gap') {
    const pack = gapAiFor(position)
    const match = Object.values(pack).find((item) => item.question === q)
    return match ?? pack.overview
  }

  if (module === 'hub') {
    const hub = hubAiFor(position)
    if (!q || q === hub.question || prompts.hub.includes(q)) {
      if (q === 'Why did compliance readiness change?' || (after && !q)) return afterHub()
      if (q === 'What requires my attention today?') {
        return after
          ? afterHub()
          : base(
              `Executive Hub · ${org}`,
              q,
              'The highest-impact item is missing current critical-supplier assessments. Continuity evidence is expiring and a 2024 questionnaire pack is a duplicate — neither is the primary action.',
              beforeFacts,
              hubAnswerBefore.interpretation,
              { prompts: prompts.hub },
            )
      }
      if (q === 'What is the highest-impact action before the review?') {
        return base(
          `Executive Hub · ${org}`,
          q,
          after
            ? 'That action is complete. Layla Rahman approved the 2026 assessments.'
            : 'Obtain and approve current critical-supplier assessments. Omar Haddad is accountable. Layla Rahman approves.',
          after ? afterFacts : beforeFacts,
          after
            ? 'Coverage, assurance and risk already reflect the approval.'
            : 'One pack moves four frameworks, the control, and two risks.',
          { prompts: prompts.hub, recommendedAction: after ? afterHub().recommendedAction : hubAnswerBefore.recommendedAction, approval: after ? afterHub().approval : hubAnswerBefore.approvalRequired ? 'Human approval required before coverage or risk changes.' : 'Not required.' },
        )
      }
      if (q === 'Summarise our current position for the board.') {
        return base(
          `Executive Hub · ${org}`,
          q,
          after
            ? 'The material gap is closed for this review. Readiness 72 (Improved). Four frameworks up. Control assured. Two risks reduced. Duplicate pack still flagged.'
            : 'Needs attention (64). Policy current. Current assessments missing. Four international obligations partial. Two risks elevated. Omar Haddad accountable.',
          after ? afterFacts : beforeFacts,
          'Open the Board Summary for the sourced narrative.',
          { prompts: prompts.hub },
        )
      }
      return q === 'Which gap affects the most frameworks?' || !q ? hub : hub
    }
    return offScript('Executive Hub', prompts.hub)
  }

  if (module === 'connect') {
    const readiness = after ? data.position.after.readinessValue : data.position.before.readinessValue
    if (/why.*assurance|assurance.*why|why is our assurance/i.test(q)) {
      return base(
        `Nox Connect · ${org}`,
        q,
        after
          ? `Assurance improved to ${readiness}% after current critical-supplier assessments were approved. That evidence strengthened supplier assurance, supported related regulatory obligations, and reduced the elevated organisational risks.`
          : `Assurance is at ${readiness}% primarily because controls still lack sufficient evidence. The supplier-assurance control is only partially assured, which leaves related obligations partly covered and keeps the highest organisational risks elevated.`,
        after
          ? [
              { text: `Readiness is ${readiness} (Improved).`, citationId: 'rep-board-summary' },
              { text: '2026 critical-supplier assessments are current and approved.', citationId: 'ev-supplier-assessments-2026' },
              { text: 'Supplier assurance is assured after approval.', citationId: 'ctl-supplier-assurance' },
            ]
          : [
              { text: `Readiness is ${readiness} (Needs attention).`, citationId: 'rep-board-summary' },
              { text: 'Current critical-supplier assessments are missing.', citationId: 'ev-audit-findings' },
              { text: 'Supplier assurance remains partially assured.', citationId: 'ctl-supplier-assurance' },
            ],
        after
          ? 'One evidence approval moved control, regulatory and risk position together.'
          : 'The connected gap is concentrated on supplier evidence, not scattered unrelated issues.',
        {
          prompts: [
            'What should I focus on next?',
            'Show me our biggest organisational risks',
            'What is driving our regulatory exposure?',
            'Explore connected exposure',
          ],
          connected: connectedTitles,
          recommendedAction: after ? 'Prepare the Board Summary from the improved position.' : 'Explore the connected supplier-assurance gap and upload the missing assessments.',
        },
      )
    }
    if (/focus|priorit|next|biggest risk|regulatory exposure|evidence gap|connect/i.test(q)) {
      return base(
        `Nox Connect · ${org}`,
        q,
        after
          ? 'The estate is more connected after approval. Review residual watch items, then prepare the Board Summary.'
          : 'Focus on the supplier evidence gap first — it links the highest risks, partially assured control, and regulatory obligations with insufficient coverage.',
        after
          ? [
              { text: 'Third-party and regulatory exposure are reduced.', citationId: 'risk-third-party' },
              { text: 'International obligations are supported by the approved assessments.', citationId: 'ctl-supplier-assurance' },
            ]
          : [
              { text: 'Missing current assessments keep supplier assurance partial.', citationId: 'ctl-supplier-assurance' },
              { text: 'Two organisational risks remain elevated on the same gap.', citationId: 'risk-third-party' },
            ],
        'Nox Connect summarises the estate so executives see exposure, cause and next action without opening every module.',
        {
          prompts: [
            after ? 'Why is our assurance position 72%?' : 'Why is our assurance position 64%?',
            'Show me our biggest organisational risks',
            'What is driving our regulatory exposure?',
          ],
          connected: connectedTitles,
          recommendedAction: after ? 'Open Board Summary.' : 'Open the connected supplier-assurance gap.',
        },
      )
    }
    return base(
      `Nox Connect · ${org}`,
      q,
      after
        ? `Nox Connect shows the organisation estate after approval. Overall assurance is ${readiness}%.`
        : `Nox Connect shows where ${org} is exposed across risks, controls, regulatory obligations, evidence and actions. Overall assurance is ${readiness}%.`,
      [
        { text: after ? 'The material supplier-assurance gap is closed for this review.' : 'The material gap is missing current critical-supplier assessments.', citationId: after ? 'ev-supplier-assessments-2026' : 'ctl-supplier-assurance' },
      ],
      'Ask about assurance, priorities, regulatory exposure, or connected gaps.',
      { prompts: prompts.hub, connected: connectedTitles },
    )
  }

  if (module === 'regulatory') {
    const list = prompts.regulatory
    if (q === list[0] || q === 'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?') {
      return gapAiFor(position).obligations
    }
    if (q === list[1]) {
      return base(
        `Regulatory · ${org}`,
        q,
        after
          ? 'The four supplier-related obligations are now supported. Internal contractual commitments are supported. Business continuity remains supported.'
          : 'Supplier-related obligations under ISO 27001, NIS2, GDPR, NCA ECC and internal commitments are only partially supported.',
        after ? afterFacts : beforeFacts,
        after ? 'The overlap closed together.' : 'They share one missing pack.',
        { prompts: list },
      )
    }
    if (q === list[2]) {
      return base(
        `Regulatory · ${org}`,
        q,
        'Supplier assurance is the control that satisfies the overlapping supplier requirements across the four international frameworks.',
        [{ text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.', citationId: 'ctl-supplier-assurance' }],
        'Mapping once is more efficient than a control per framework.',
        { prompts: list },
      )
    }
    if (q === list[3] || selectedId?.startsWith('obl-')) {
      return base(
        `${selectedTitle ?? 'Obligation'} · ${org}`,
        list[3],
        after
          ? 'This obligation is supported by the supplier-assurance policy and the 2026 assessments.'
          : 'This obligation is currently backed by the supplier-assurance policy. Current assessments are still missing.',
        after
          ? [
              { text: 'Supplier assurance policy is current.', citationId: 'ev-policy-supplier' },
              { text: '2026 critical-supplier assessments are current.', citationId: 'ev-supplier-assessments-2026' },
            ]
          : [
              { text: 'Supplier assurance policy is current.', citationId: 'ev-policy-supplier' },
              { text: 'Internal audit findings record that current assessments are missing.', citationId: 'ev-audit-findings' },
            ],
        'Identifiers stay in the record metadata.',
        { prompts: list },
      )
    }
    if (q === list[4]) {
      return base(
        `Regulatory · ${org}`,
        q,
        'Every seeded obligation has an accountable owner. Nadia, Omar, Tomas and Sara own the supplier-related set. Layla approves.',
        beforeFacts.slice(2, 3),
        'Owner gaps are not the material issue in this review.',
        { prompts: list, owner: omar?.name ?? '' },
      )
    }
    return list.includes(q) ? gapAiFor(position).obligations : offScript('Regulatory', list)
  }

  if (module === 'controls') {
    const list = prompts.controls
    if (q === list[0] || selectedId === 'ctl-supplier-assurance') {
      return base(
        `Supplier assurance · ${org}`,
        list[0],
        `This control supports ${internationalFrameworks.map((item) => item.name).join(', ')} and internal commitments.`,
        [{ text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.', citationId: 'ctl-supplier-assurance' }],
        after ? 'Those frameworks now share current assessments.' : 'Those frameworks currently share a missing pack.',
        { prompts: list },
      )
    }
    if (q === list[1]) return gapAiFor(position).control
    if (q === list[2]) return gapAiFor(position).evidence
    if (q === list[3]) return gapAiFor(position).risks
    if (q === list[4]) {
      return base(
        `Controls · ${org}`,
        q,
        after
          ? 'Nadia Chen remains control owner. No further pack is required for this review.'
          : 'Omar Haddad should obtain current assessments. Layla Rahman approves. Nadia Chen owns the control.',
        after ? afterFacts : beforeFacts,
        'Human approval is the only trigger that changes the position.',
        { prompts: list },
      )
    }
    return list.includes(q) ? gapAiFor(position).control : offScript('Controls', list)
  }

  if (module === 'evidence') {
    const list = prompts.evidence
    if (q === list[0] || selectedId?.startsWith('ev-')) {
      return base(
        `${selectedTitle ?? 'Evidence'} · ${org}`,
        list[0],
        selectedId === 'ev-policy-supplier'
          ? 'Used by the supplier-assurance control and the overlapping supplier obligations. It does not replace assessments.'
          : selectedId === 'ev-supplier-assessments-2026'
            ? 'Used by supplier assurance and the four international supplier obligations after approval.'
            : 'Open the record to see the controls, obligations and risks that reuse it.',
        selectedId === 'ev-supplier-assessments-2026'
          ? afterFacts
          : beforeFacts.slice(0, 1),
        'Reuse is visible on the record, not as a separate mapping exercise.',
        { prompts: list },
      )
    }
    if (q === list[1]) return gapAiFor(position).evidence
    if (q === list[2]) {
      return base(
        `Evidence · ${org}`,
        q,
        'The supplier-assurance policy already supports several obligations. Current assessments, once approved, support the same set.',
        beforeFacts,
        'Do not duplicate the pack under each framework.',
        { prompts: list },
      )
    }
    if (q === list[3]) {
      return base(
        `Evidence · ${org}`,
        q,
        after
          ? 'The approved pack is complete. A separate note in the last upload was missing owner and review date and was not required to close the gap.'
          : 'Current assessments are missing. One upload fixture arrives without owner and review date and must be completed before it can be indexed as evidence.',
        after ? afterFacts : beforeFacts.slice(1, 2),
        'Missing metadata is a review item, not an automatic mapping.',
        { prompts: list },
      )
    }
    if (q === list[4]) {
      return base(
        `Evidence · ${org}`,
        q,
        'The 2024 supplier questionnaire pack is a duplicate of an older pack and stays flagged. The 2026 assessments are a newer version, not a duplicate.',
        [{ text: 'The 2024 supplier questionnaire pack is a duplicate of an older pack.', citationId: 'ev-supplier-q-duplicate' }],
        'Duplicates do not close the gap.',
        { prompts: list },
      )
    }
    if (q === list[5]) {
      return base(
        `Evidence · ${org}`,
        q,
        'The business continuity test report is expiring and sits under the continuity control — not the primary supplier-assurance action.',
        [{ text: 'Business continuity test report is expiring.', citationId: 'ev-bc-test' }],
        'Treat it as a watch item.',
        { prompts: list, owner: personLabel('person-nadia') },
      )
    }
    return list.includes(q) ? gapAiFor(position).evidence : offScript('Evidence', list)
  }

  if (module === 'risks') {
    const list = prompts.risks
    if (q === list[0]) return gapAiFor(position).risks
    if (q === list[1]) {
      return base(
        `Risks · ${org}`,
        q,
        'Supplier assurance is the control that reduces third-party and regulatory exposure. Continuity testing covers the watch item.',
        [{ text: 'Supplier assurance is the control connected to both elevated risks.', citationId: 'ctl-supplier-assurance' }],
        after ? 'That control is now assured.' : 'That control is still partial.',
        { prompts: list },
      )
    }
    if (q === list[2]) return gapAiFor(position).evidence
    if (q === list[3]) {
      return base(
        `Risks · ${org}`,
        q,
        after
          ? 'The efficient remediation is complete: one approved pack reduced both elevated risks.'
          : 'Upload and approve current critical-supplier assessments. That is more efficient than treating each framework or risk as a separate project.',
        after ? afterFacts : beforeFacts,
        hubAnswerBefore.interpretation,
        { prompts: list },
      )
    }
    if (q === list[4]) {
      return after
        ? afterHub()
        : base(
            `Risks · ${org}`,
            q,
            hubAnswerBefore.expectedImpact,
            beforeFacts,
            'Nothing in the position changes until a human approves.',
            { prompts: list },
          )
    }
    return list.includes(q) ? gapAiFor(position).risks : offScript('Risks', list)
  }

  if (module === 'reports') {
    const list = prompts.reports
    if (q === list[0] || q === list[1]) {
      return base(
        `Board Summary · ${org}`,
        q,
        after
          ? 'The material movement is the closed supplier-assurance gap: readiness 72, four frameworks up, control assured, two risks reduced, citing the 2026 assessments.'
          : 'The material movement to explain is the missing current assessments under four frameworks, with readiness at 64 and two elevated risks.',
        after ? afterFacts : beforeFacts,
        'The summary is generated from the same position as Hub.',
        { prompts: list, recommendedAction: after ? 'Cite the 2026 assessments in the board pack.' : hubAnswerBefore.recommendedAction, approval: after ? 'Already approved by Layla Rahman.' : 'Human approval required before coverage or risk changes.' },
      )
    }
    if (q === list[2] || q === list[4]) {
      return base(
        `Board Summary · ${org}`,
        q,
        after
          ? 'Improved coverage, assured control and reduced risk are sourced to the 2026 assessments, the supplier-assurance control, and the connected risks.'
          : 'The gap narrative is sourced to the current policy, internal audit findings, and the partial supplier-assurance control.',
        after ? afterFacts : beforeFacts,
        'Every statement in the summary has a citation.',
        { prompts: list },
      )
    }
    if (q === list[3]) {
      return base(
        `Board Summary · ${org}`,
        q,
        after
          ? 'Escalate the closed gap as an improvement, and note the remaining duplicate pack and expiring continuity report as watch items.'
          : 'Escalate the missing current assessments as the item that must be closed before the review.',
        after ? afterFacts : beforeFacts,
        'Do not escalate four framework projects. Escalate one pack.',
        { prompts: list },
      )
    }
    return list.includes(q) ? answerFor({ ...options, question: list[0] }) : offScript('Reports', list)
  }

  const list = prompts.activity
  if (q === list[0]) {
    return base(
      `Activity · ${org}`,
      q,
      after
        ? 'Nothing is waiting on this pack. Layla Rahman has already approved it.'
        : 'The open item is waiting on current assessments, then on Layla Rahman’s approval.',
      after ? afterFacts : beforeFacts,
      'Approval is the only trigger.',
      { prompts: list },
    )
  }
  if (q === list[1]) return answerFor({ module: 'hub', position, question: 'What changes if the recommendation is approved?' === q ? 'Why did compliance readiness change?' : 'Which gap affects the most frameworks?' })
  if (q === list[2]) {
    return base(
      `Activity · ${org}`,
      q,
      after
        ? 'Layla Rahman last approved the 2026 critical-supplier assessments.'
        : 'Layla Rahman is the approver for this pack. She has not yet approved it.',
      after ? afterFacts.slice(0, 1) : beforeFacts.slice(0, 1),
      'The same person approves evidence and remediation.',
      { prompts: list, owner: layla?.name ?? '' },
    )
  }
  return list.includes(q)
    ? base(`Activity · ${org}`, q, after ? 'The approval is complete.' : 'Upload, then approve.', after ? afterFacts : beforeFacts, 'Activity is the history of this organisation’s position.', { prompts: list })
    : offScript('Activity', list)
}
