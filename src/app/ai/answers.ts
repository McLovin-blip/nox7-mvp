import type { AiPanelModel, GapStepId, ModuleId, PositionState } from '../mock/types.ts'
import {
  data,
  hubAnswerBefore,
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
    owner: extra.owner ?? (personLabel(hubAnswerBefore.ownerId).split(',')[0] || omar?.name || ''),
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

const afterFacts: AiPanelModel['facts'] = hubAnswerBefore.sourcedFacts.map((fact) => ({
  text: fact.text,
  citationId: fact.citationIds[0],
}))

function afterHub(): AiPanelModel {
  return base(
    `Executive Hub · ${org}`,
    'What should I focus on first?',
    hubAnswerBefore.executiveAnswer,
    afterFacts,
    hubAnswerBefore.interpretation,
    {
      prompts: prompts.hub,
      recommendedAction: hubAnswerBefore.recommendedAction,
      approval: 'Already reflected in the current demo snapshot.',
      expectedImpact: hubAnswerBefore.expectedImpact,
      owner: personLabel(hubAnswerBefore.ownerId).split(',')[0] || layla?.name || '',
      connected: connectedTitles,
      freshness: hubAnswerBefore.freshness,
    },
  )
}

function riskRecordAnswer(selectedId: string | undefined, question: string): AiPanelModel | null {
  const risk =
    data.risks.find((item) => item.id === selectedId) ??
    data.risks.find((item) => item.id === data.demo.focusRiskId) ??
    data.risks.find((item) => item.demoFocus)
  if (!risk) return null
  const controls = risk.controlIds
    .map((id) => data.controls.find((item) => item.id === id))
    .filter((item): item is (typeof data.controls)[number] => Boolean(item))
  const evidence = (risk.evidenceIdsBefore ?? [])
    .map((id) => data.evidence.find((item) => item.id === id))
    .filter((item): item is (typeof data.evidence)[number] => Boolean(item))
  const owner = personLabel(risk.ownerId)
  const q = question.toLowerCase()
  const list = prompts.risks

  if (q.includes('what is this risk') || q === list[0].toLowerCase()) {
    return base(
      `Risks · ${risk.code}`,
      question,
      `${risk.code} — ${risk.title}. ${risk.whatCouldHappen} Inherent ${risk.inherentLabel}; residual ${risk.residualLabel}; ${risk.appetiteLabel}.`,
      [
        { text: `${risk.code} residual is ${risk.residualLabel} and ${risk.appetiteLabel}.`, citationId: risk.id },
        { text: risk.whatCouldHappen, citationId: risk.id },
      ],
      risk.contributingGap,
      {
        prompts: list,
        owner: owner.split(',')[0],
        recommendedAction: `Open ${risk.code} and review linked controls and evidence.`,
        approval: 'Not required for this explanation.',
      },
    )
  }

  if (q.includes('protecting against') || q === list[1].toLowerCase()) {
    const blurb =
      risk.id === data.demo.focusRiskId || risk.demoFocus
        ? data.demo.controlBlurb
        : controls.map((item) => item.purpose).filter(Boolean).join(' ')
    return base(
      `Risks · ${risk.code}`,
      question,
      controls.length
        ? `${blurb ? `${blurb} ` : ''}Linked controls: ${controls.map((item) => `${item.code} ${item.title} (${item.effectivenessLabel})`).join('; ')}.`
        : 'No linked controls are seeded for this risk.',
      controls.map((item) => ({
        text: `${item.code} ${item.title} is ${item.effectivenessLabel}.`,
        citationId: item.id,
      })),
      blurb || risk.contributingGap,
      {
        prompts: list,
        owner: owner.split(',')[0],
        recommendedAction: `Review ${controls.map((item) => item.code).join(' and ') || 'linked controls'} from the risk record.`,
        approval: 'Not required for this explanation.',
        connected: controls.map((item) => item.title),
      },
    )
  }

  if (q.includes('evidence do we have') || q === list[2].toLowerCase()) {
    return base(
      `Risks · ${risk.code}`,
      question,
      evidence.length
        ? evidence.map((item) => `${item.code} ${item.title}: ${item.statusLabel} — ${item.resultOrGap ?? item.summary}`).join(' ')
        : 'No linked evidence is seeded for this risk.',
      evidence.map((item) => ({
        text: `${item.code}: ${item.statusLabel} — ${item.resultOrGap ?? item.summary}`,
        citationId: item.id,
      })),
      'Accepted evidence shows the linked phishing protections are working within their stated scope.',
      {
        prompts: list,
        owner: owner.split(',')[0],
        recommendedAction: `Open ${evidence.map((item) => item.code).join(' and ') || 'linked evidence'} from the risk record.`,
        approval: 'Not required for this explanation.',
        connected: evidence.map((item) => item.title),
      },
    )
  }

  if (q.includes('do next') || q === list[3].toLowerCase()) {
    return base(
      `Risks · ${risk.code}`,
      question,
      `Next action: ${risk.nextAction} Owner: ${owner}. Due: ${risk.dueDate}. Status: ${risk.actionStatus}.`,
      [
        {
          text: `Next action: ${risk.nextAction}. Owner: ${owner}. Due: ${risk.dueDate}.`,
          citationId: risk.id,
        },
      ],
      'Keep residual phishing exposure within appetite by completing the owned coaching action.',
      {
        prompts: list,
        owner: owner.split(',')[0],
        recommendedAction: risk.nextAction,
        approval: 'Owner accountability is recorded on the risk.',
        freshness: `Due ${risk.dueDate}`,
      },
    )
  }

  return null
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
          { text: 'The supplier assurance policy is current (version 3.0).', citationId: 'evd-005' },
          { text: '2026 critical-supplier assessments are current.', citationId: 'evd-005' },
        ],
        'Policy alone was never enough; the pair is what the review needs.',
        shared,
      ),
      obligations: base(
        `Overlapping obligations · ${org}`,
        'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?',
        'They overlap on supplier assurance. That overlap is now supported by the same current assessments.',
        [
          { text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.', citationId: 'ctl-005' },
          { text: '2026 critical-supplier assessments support those obligations.', citationId: 'evd-005' },
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
          { text: '2026 critical-supplier assessments are current.', citationId: 'evd-005' },
          { text: '2023 critical-supplier assessments are superseded.', citationId: 'evd-006' },
          { text: 'The 2024 supplier questionnaire pack is a duplicate.', citationId: 'evd-006' },
        ],
        'The duplicate does not reopen the material gap.',
        shared,
      ),
      risks: base(
        `Connected risks · ${org}`,
        'Which compliance gaps contribute to this risk?',
        'The contributing gap is closed. Third-party and regulatory exposure are reduced. Continuity evidence remains a watch item.',
        [
          { text: 'Third-party assurance is reduced.', citationId: 'risk-002' },
          { text: 'Regulatory exposure ahead of the review is reduced.', citationId: 'risk-002' },
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
        { text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.', citationId: 'ctl-005' },
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
        { text: 'Supplier assurance is partially assured.', citationId: 'ctl-005' },
        { text: 'Internal audit findings record that current critical-supplier assessments are missing.', citationId: 'evd-005' },
      ],
      'The control cannot move to assured until current assessments are uploaded and approved.',
      shared,
    ),
    evidence: base(
      `Missing assessments · ${org}`,
      'Which evidence is missing or outdated?',
      'Current critical-supplier assessments are missing. The 2023 pack is expired and is not acceptable for the review. A 2024 questionnaire pack is flagged as a duplicate.',
      [
        { text: 'Internal audit findings record that current critical-supplier assessments are missing.', citationId: 'evd-005' },
        { text: '2023 critical-supplier assessments are expired.', citationId: 'evd-006' },
        { text: 'The 2024 supplier questionnaire pack is a duplicate of an older pack.', citationId: 'evd-006' },
      ],
      'Fresh assessments are the missing piece. The current policy and the expired pack do not close the gap.',
      shared,
    ),
    risks: base(
      `Connected risks · ${org}`,
      'Which compliance gaps contribute to this risk?',
      'Third-party assurance and regulatory exposure are elevated because current assessments are missing. The same gap appears across several frameworks.',
      [
        { text: 'Third-party assurance is elevated because current assessments for critical suppliers are missing.', citationId: 'risk-002' },
        { text: 'Regulatory exposure ahead of the review is elevated by the same supplier-assurance gap.', citationId: 'risk-002' },
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
              hubAnswerBefore.executiveAnswer,
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
            ? hubAnswerBefore.executiveAnswer
            : hubAnswerBefore.recommendedAction,
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
            ? hubAnswerBefore.executiveAnswer
            : hubAnswerBefore.executiveAnswer,
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
              { text: '2026 critical-supplier assessments are current and approved.', citationId: 'evd-005' },
              { text: 'Supplier assurance is assured after approval.', citationId: 'ctl-005' },
            ]
          : [
              { text: `Readiness is ${readiness} (Needs attention).`, citationId: 'rep-board-summary' },
              { text: 'Current critical-supplier assessments are missing.', citationId: 'evd-005' },
              { text: 'Supplier assurance remains partially assured.', citationId: 'ctl-005' },
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
              { text: 'Third-party and regulatory exposure are reduced.', citationId: 'risk-002' },
              { text: 'International obligations are supported by the approved assessments.', citationId: 'ctl-005' },
            ]
          : [
              { text: 'Missing current assessments keep supplier assurance partial.', citationId: 'ctl-005' },
              { text: 'Two organisational risks remain elevated on the same gap.', citationId: 'risk-002' },
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
        { text: after ? 'The material supplier-assurance gap is closed for this review.' : 'The material gap is missing current critical-supplier assessments.', citationId: after ? 'evd-005' : 'ctl-005' },
      ],
      'Ask about assurance, priorities, regulatory exposure, or connected gaps.',
      { prompts: prompts.hub, connected: connectedTitles },
    )
  }

  if (module === 'regulatory') {
    const list = prompts.regulatory
    const selected = selectedId ? data.obligations.find((item) => item.id === selectedId) : undefined
    if (/counting a policy|only counting/.test(q.toLowerCase()) || q === list[1]) {
      return base(
        `Regulatory · ${org}`,
        q,
        after
          ? 'Supplier obligations are no longer policy-only. Privileged access and continuity still have evidence problems, so they are only partially supported.'
          : 'ISO 27001, NIS2, GDPR and NCA ECC supplier obligations are currently counting a current policy. Operating evidence is missing, so they are unverifiable — not failed.',
        after ? afterFacts : beforeFacts,
        'A documented policy is not the same as a supported requirement.',
        { prompts: list },
      )
    }
    if (/unverifiable|cybersecurity-related/.test(q.toLowerCase()) || q === list[2]) {
      return base(
        `Regulatory · ${org}`,
        q,
        after
          ? 'The supplier set is supported. Internal-audit action closure remains unverifiable because closure evidence is missing.'
          : 'The four international supplier obligations are unverifiable. Internal-audit action closure is also unverifiable.',
        [
          { text: after ? 'Supplier relationships — information security is now supported.' : 'Supplier relationships — information security is unverifiable.', citationId: 'obl-iso-a532' },
          { text: 'Internal audit management-action closure is unverifiable.', citationId: 'obl-internal-audit-close' },
        ],
        'Unverifiable means current evidence cannot prove support. Unsupported is reserved for HSE, where records prove the duty is not being met.',
        { prompts: list },
      )
    }
    if (/nis2/.test(q.toLowerCase()) || q === list[3]) {
      return base(
        `NIS2 · ${org}`,
        q,
        'Supply-chain security measures and continuity measures are the NIS2 obligations with the greatest reach. Supplier evidence lifts the first; the continuity test report is still expiring.',
        [
          { text: 'NIS2 supply-chain security measures map to supplier assurance.', citationId: 'obl-nis2-supply' },
          { text: 'NIS2 continuity measures rest on the business continuity test report.', citationId: 'obl-nis2-continuity' },
        ],
        after ? 'Supply-chain is now supported. Continuity remains partial.' : 'Closing supplier assessments is the highest-leverage NIS2 action still open.',
        { prompts: list },
      )
    }
    if (/missing, expiring or conflicting/.test(q.toLowerCase()) || q === list[4]) {
      return base(
        `Regulatory · ${org}`,
        q,
        after
          ? 'Supplier assessments are current. Watch the expiring continuity test, conflicting access packs, declarations awaiting approval, and missing audit-closure evidence.'
          : 'Current critical-supplier assessments are missing. Continuity evidence is expiring and privileged-access packs conflict.',
        [
          { text: after ? '2026 assessments are current.' : 'Current critical-supplier assessments are missing.', citationId: after ? 'evd-005' : 'obl-iso-a532' },
          { text: 'The business continuity test report is expiring.', citationId: 'evd-006' },
        ],
        'Work each evidence condition as its own record.',
        { prompts: list },
      )
    }
    if (/owner do next/.test(q.toLowerCase()) || q === list[5]) {
      return base(
        `Regulatory · ${org}`,
        q,
        after
          ? 'Yusuf Rahman should close overdue inspections. Nadia Chen should reconcile access evidence and refresh continuity testing.'
          : 'Omar Haddad should obtain current assessments. Layla Rahman approves.',
        after ? afterFacts : beforeFacts,
        'Human approval is required before support conclusions change.',
        { prompts: list },
      )
    }
    if (q === list[0] || /actually supported/.test(q.toLowerCase()) || selectedId?.startsWith('obl-')) {
      const name = selected?.title ?? selectedTitle ?? 'This obligation'
      const overall = after ? selected?.overallAfter : selected?.overallBefore
      return base(
        `${name} · ${org}`,
        q,
        selected
          ? overall === 'supported'
            ? `${name} is supported by current evidence.`
            : overall === 'unverifiable'
              ? `${name} is unverifiable: a policy or design exists, but current operating evidence does not.`
              : overall === 'unsupported'
                ? `${name} is unsupported because current records show the duty is not being met.`
                : `${name} is only partially supported.`
          : after
            ? 'Policy management, retention, physical security and payment authorisation are supported. Supplier obligations are now supported too. Do not rely on HSE or unverifiable audit closure.'
            : 'You can rely on policy management, retention, physical security and payment authorisation. You cannot yet rely on the international supplier set — those are unverifiable.',
        selected
          ? [{ text: selected.whyBefore && !after ? selected.whyBefore : selected.whyAfter, citationId: selected.id }]
          : after
            ? afterFacts
            : beforeFacts,
        'Support requires current evidence, not just a mapped control.',
        { prompts: list },
      )
    }
    return list.includes(q) ? gapAiFor(position).obligations : offScript('Regulatory', list)
  }

  if (module === 'controls') {
    const list = prompts.controls
    const selected = selectedId ? data.controls.find((item) => item.id === selectedId) : undefined
    if (/unverifiable|cybersecurity controls/.test(q.toLowerCase())) {
      return base(
        `Controls · ${org}`,
        q,
        after
          ? 'After the supplier approval, management-action follow-up remains unverifiable. Privileged-access review is only partially assured because two evidence packs conflict.'
          : 'Supplier assurance and management-action follow-up are unverifiable. That means current evidence is missing or insufficient — not that the controls have been tested and failed.',
        [
          { text: after ? 'Supplier assurance is effective.' : 'Supplier assurance is unverifiable because current assessments are missing.', citationId: 'ctl-005' },
          { text: 'Management action follow-up is unverifiable until closure evidence is attached.', citationId: 'ctl-audit-followup' },
          { text: 'Privileged-access review is partially assured because current evidence conflicts.', citationId: 'ctl-privileged-access' },
        ],
        'Keep unverifiable separate from ineffective. Safety inspection completion is the ineffective control in this inventory.',
        { prompts: list, owner: 'Amira Khalil' },
      )
    }
    if (/not be relied|why can this control/.test(q.toLowerCase()) || selectedId?.startsWith('ctl-')) {
      const name = selected?.title ?? selectedTitle ?? 'This control'
      const overall = after ? selected?.overallAfter : selected?.overallBefore
      return base(
        `${name} · ${org}`,
        q,
        overall === 'unverifiable'
          ? `${name} cannot be relied on because current operating evidence is insufficient. Design may still be sound. This is unverifiable, not failed.`
          : overall === 'ineffective'
            ? `${name} cannot be relied on because current evidence shows it is not operating as intended.`
            : overall === 'effective'
              ? `${name} can be relied on for this review. Design, operation and current evidence agree.`
              : `${name} is only partially assured. Some evidence exists, but not enough for full reliance.`,
        [
          { text: `${name} overall assurance is ${overall ?? 'known from the inventory'}.`, citationId: selected?.id ?? 'ctl-005' },
          { text: selected?.whyBefore && !after ? selected.whyBefore : selected?.whyAfter ?? 'See the control record for the sourced rationale.', citationId: selected?.evidenceIdsBefore?.[0] ?? selected?.id ?? 'ctl-005' },
        ],
        selected?.whatChangedBefore && !after ? selected.whatChangedBefore : selected?.whatChangedAfter ?? 'Review the control workspace for connected risks and obligations.',
        { prompts: list, owner: selected ? undefined : 'Omar Haddad', recommendedAction: after ? selected?.nextActionAfter : selected?.nextActionBefore },
      )
    }
    if (/missing, expiring or conflicting|evidence is missing/.test(q.toLowerCase())) {
      return base(
        `Evidence dependencies · ${org}`,
        q,
        after
          ? 'Supplier assessments are current. Watch the expiring continuity test, conflicting privileged-access packs, declarations awaiting approval, and the unowned safety-inspection pack.'
          : 'Current critical-supplier assessments are missing. The continuity test is expiring, privileged-access packs conflict, declarations await approval, and the safety-inspection pack has no evidence owner.',
        [
          { text: after ? '2026 critical-supplier assessments are current.' : 'Current critical-supplier assessments are missing.', citationId: after ? 'evd-005' : 'ctl-005' },
          { text: 'The business continuity test report is expiring.', citationId: 'evd-006' },
          { text: 'Privileged-access review Q2 conflicts with the IAM exception log.', citationId: 'ctl-privileged-access' },
        ],
        'Each evidence condition should be worked as its own record, not collapsed into a single failed control.',
        { prompts: list },
      )
    }
    if (/nis2/.test(q.toLowerCase())) {
      return base(
        `NIS2 leverage · ${org}`,
        q,
        'Supplier assurance and business continuity testing have the greatest NIS2 reach in this inventory. Improving supplier evidence lifts multiple NIS2-linked obligations at once.',
        [
          { text: 'Supplier assurance is mapped to NIS2 supply-chain security measures.', citationId: 'ctl-005' },
          { text: 'Business continuity testing supports ISO 27001 and NIS2 continuity expectations.', citationId: 'ctl-010' },
        ],
        after
          ? 'Supplier assurance is now effective for NIS2. Continuity evidence is still expiring.'
          : 'Closing supplier assessments is the highest-leverage NIS2 action still open.',
        { prompts: list },
      )
    }
    if (/insufficient for this risk|controls are insufficient/.test(q.toLowerCase())) {
      return base(
        `Risk protection · ${org}`,
        q,
        after
          ? 'Third-party assurance is now better controlled. Privileged access remains only partially controlled while access-review evidence conflicts. Continuity is weakened by overdue safety inspections.'
          : 'Third-party assurance is unverified because the mitigating control lacks current assessments. Privileged access is only partially controlled.',
        [
          { text: 'Third-party assurance is linked to the supplier-assurance control.', citationId: 'risk-002' },
          { text: 'Privileged access oversight is linked to privileged-access review.', citationId: 'risk-004' },
        ],
        'Open the risk chain on Controls to see risk → controls → evidence → obligations → frameworks.',
        { prompts: list },
      )
    }
    if (q === list[0] || /controls can we rely/.test(q.toLowerCase())) {
      const effectiveCount = data.controls.filter((item) => (after ? item.overallAfter : item.overallBefore) === 'effective').length
      return base(
        `Controls · ${org}`,
        q,
        after
          ? `${effectiveCount} controls are effective, including supplier assurance. Do not rely on safety inspections, unverifiable audit follow-up, or conflicting privileged-access review.`
          : `You can rely on policy management, data-retention review, payment authorisation and site access. You cannot yet rely on supplier assurance — it is unverifiable — or on safety inspections, which are ineffective.`,
        [
          { text: `Effective controls in this review: ${effectiveCount} of ${data.controls.length}.`, citationId: 'ctl-001' },
          { text: after ? 'Supplier assurance is effective.' : 'Supplier assurance is unverifiable.', citationId: 'ctl-005' },
          { text: 'Safety inspection completion is ineffective.', citationId: 'ctl-safety-inspection' },
        ],
        'Reliance requires design, operation and current evidence. Existence alone is not enough.',
        { prompts: list },
      )
    }
    if (q === list[6] || /owner do next/.test(q.toLowerCase())) {
      return base(
        `Controls · ${org}`,
        q,
        after
          ? 'Yusuf Rahman should close overdue plant inspections and assign an evidence owner. Nadia Chen should reconcile privileged-access evidence.'
          : 'Omar Haddad should obtain current critical-supplier assessments. Layla Rahman approves. Yusuf Rahman still owns overdue inspections.',
        after ? afterFacts : beforeFacts,
        'Human approval is the only trigger that changes the organisation position.',
        { prompts: list },
      )
    }
    return list.includes(q) ? gapAiFor(position).control : offScript('Controls', list)
  }

  if (module === 'evidence') {
    const list = prompts.evidence
    const selected = selectedId === 'evd-005'
      ? { id: 'evd-005', title: 'Current critical-supplier assessments' }
      : selectedId
        ? data.evidence.find((item) => item.id === selectedId)
        : undefined
    if (q === list[1] || /missing, expiring or conflicting/.test(q.toLowerCase())) {
      return base(
        `Evidence · ${org}`,
        q,
        after
          ? 'Supplier assessments are current. Residual conditions are the expiring continuity test, conflicting privileged-access packs, declarations awaiting approval, and the unowned HSE pack.'
          : 'Current critical-supplier assessments are missing. The 2023 pack is expired, the continuity test is expiring, privileged-access packs conflict, and the HSE pack has no evidence owner.',
        [
          { text: after ? '2026 critical-supplier assessments are current and approved.' : 'Current critical-supplier assessments are missing.', citationId: after ? 'evd-005' : 'evd-005' },
          { text: 'The business continuity test report is expiring.', citationId: 'evd-006' },
          { text: 'Privileged-access review Q2 conflicts with the IAM exception log.', citationId: 'evd-005' },
        ],
        'Missing, expired, conflicting and unowned are different problems. Do not collapse them into one failed pack.',
        { prompts: list },
      )
    }
    if (q === list[2] || /blocking our assurance/.test(q.toLowerCase())) {
      return base(
        `Evidence · ${org}`,
        q,
        after
          ? 'The blocking pack is no longer missing. Residual blockers are conflicting access evidence and overdue HSE inspections, not the supplier assessments.'
          : 'The missing 2026 critical-supplier assessments are blocking supplier assurance and the four overlapping international obligations. The current policy does not close that gap.',
        after ? afterFacts : beforeFacts,
        after
          ? 'Approval moved the organisation position. Remaining evidence conditions do not reopen the supplier gap.'
          : 'Upload and approve that pack. Duplicates and expired 2023 files do not substitute for it.',
        { prompts: list },
      )
    }
    if (q === list[4] || /when it expires/.test(q.toLowerCase())) {
      return base(
        `Evidence · ${org}`,
        q,
        'The business continuity test report is the pack approaching expiry. Continuity testing and the NIS2 continuity obligation would weaken first — not the supplier-assurance control.',
        [
          { text: 'Business continuity test report is expiring.', citationId: 'evd-006' },
          { text: 'Business continuity testing is the connected control.', citationId: 'ctl-010' },
          { text: 'NIS2 continuity measures depend on that test evidence.', citationId: 'obl-nis2-continuity' },
        ],
        'Treat expiry as a watch item. It is not the primary supplier-assurance action.',
        { prompts: list, owner: personLabel('person-nadia') },
      )
    }
    if (q === list[5] || /should i do next/.test(q.toLowerCase())) {
      return base(
        `Evidence · ${org}`,
        q,
        after
          ? 'Nadia Chen should reconcile the conflicting access packs and refresh the continuity test. Yusuf Rahman should assign an HSE evidence owner.'
          : 'Omar Haddad should upload current critical-supplier assessments. Layla Rahman approves. That is the only action that changes the organisation position.',
        after ? afterFacts : beforeFacts,
        'Human approval is required before evidence changes Hub, Regulatory, Controls, Risks, Reports or Activity.',
        { prompts: list },
      )
    }
    if (q === list[3] || /being used/.test(q.toLowerCase()) || selectedId?.startsWith('ev-')) {
      const name = selected?.title ?? selectedTitle ?? 'This evidence'
      return base(
        `${name} · ${org}`,
        q,
        selected?.id === 'evd-005'
          ? 'Used by supplier assurance and the overlapping supplier obligations. A current policy does not replace operating assessments.'
          : selected?.id === 'evd-005'
            ? 'Used by supplier assurance and the four international supplier obligations after approval.'
            : selected?.id === 'evd-005'
              ? 'Expected by supplier assurance and the four international supplier obligations. Until it exists, those requirements stay unverifiable.'
              : selected?.id === 'evd-006'
                ? 'Used by business continuity testing and the NIS2 continuity obligation.'
                : 'Open the record to see the controls, obligations and risks that reuse it.',
        selected?.id === 'evd-005' ? afterFacts : beforeFacts.slice(0, 1),
        'Reuse is visible on the record. Do not duplicate the pack under each framework.',
        { prompts: list },
      )
    }
    if (q === list[0] || /can we rely/.test(q.toLowerCase())) {
      return base(
        `Evidence · ${org}`,
        q,
        after
          ? 'You can rely on the approved 2026 assessments, the supplier policy, retention, physical-security and payment packs. Do not rely on the expired 2023 pack, the duplicate questionnaire, conflicting access files, or the unowned HSE pack.'
          : 'You can rely on the current supplier policy, retention schedule, physical-security and payment packs. You cannot yet rely on supplier-assurance operating evidence — that pack is missing.',
        after ? afterFacts : beforeFacts,
        'Current is not the same as missing, expired, conflicting or unowned.',
        { prompts: list },
      )
    }
    return list.includes(q) ? gapAiFor(position).evidence : offScript('Evidence', list)
  }

  if (module === 'risks') {
    const list = prompts.risks
    const curated = riskRecordAnswer(selectedId, q)
    if (curated) return curated
    if (/protecting against phishing|phishing risk|open the phishing/i.test(q)) {
      return riskRecordAnswer(data.demo.focusRiskId, list[0]) ?? beforeHub()
    }
    if (list.includes(q) || /what is this risk|protecting against|evidence do we have|should we do next/i.test(q)) {
      return riskRecordAnswer(selectedId ?? data.demo.focusRiskId, q) ?? beforeHub()
    }
    return offScript('Risks', list)
  }

  if (module === 'reports') {
    const list = prompts.reports
    if (q === list[0] || q === list[1]) {
      return base(
        `Board Summary · ${org}`,
        q,
        hubAnswerBefore.executiveAnswer,
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
