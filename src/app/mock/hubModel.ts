import type { IndicatorDirection, MapNodeId, PositionState, Tone } from './types.ts'
import {
  coverageOf,
  currentUser,
  data,
  frameworkName,
  hubAnswerBefore,
  internationalFrameworks,
  layla,
  lookupSource,
  nadia,
  omar,
  organisation,
  personLabel,
  reportingPeriod,
} from './data.ts'

function directionTone(direction: IndicatorDirection): Tone {
  if (direction === 'improved') return 'assured'
  if (direction === 'deteriorated' || direction === 'requires-attention') return 'attention'
  return 'partial'
}

function sourceRef(id: string, position: PositionState) {
  const found = lookupSource(id, position)
  if (found) return { id, title: found.title, kind: found.kind }
  if (id === data.actions[0]?.id) {
    return { id, title: data.actions[0].title, kind: 'Action' as const }
  }
  return { id, title: id, kind: 'Record' as const }
}

export function buildHubView(position: PositionState) {
  const after = position === 'after'
  const pos = after ? data.position.after : data.position.before
  const frameworks = internationalFrameworks.map((item) => ({
    id: item.id,
    name: item.name,
    coverage: coverageOf(item.id, position),
    coverageBefore: item.coverageBefore,
  }))
  const coverageAverage = Math.round(frameworks.reduce((sum, item) => sum + item.coverage, 0) / frameworks.length)
  const leading = [...frameworks].sort((a, b) => b.coverage - a.coverage)[0]
  const catalogue = data.evidence.filter((item) => {
    if ('availableFromState' in item && item.availableFromState === 'after') return after
    return true
  })
  const missing = after ? 0 : 1
  const expired = catalogue.filter(
    (item) => item.freshness === 'expired' && !item.duplicateOf && !(after && item.id === 'ev-supplier-assessments-2023'),
  ).length
  const duplicate = catalogue.filter((item) => item.duplicateOf).length
  const expiring = catalogue.filter((item) => item.freshness === 'expiring').length
  const superseded = after ? 1 : 0
  const elevatedRisks = data.risks.filter((item) => (after ? item.levelAfter : item.levelBefore) === 'elevated').length

  const obligationRows = internationalFrameworks.map((framework) => {
    const items = data.obligations.filter((item) => item.frameworkId === framework.id)
    const supported = items.filter((item) => (after ? item.supportAfter : item.supportBefore) === 'supported').length
    const partial = items.find((item) => (after ? item.supportAfter : item.supportBefore) === 'partial')
    return {
      id: framework.id,
      name: framework.name,
      coverage: coverageOf(framework.id, position),
      previousCoverage: after ? framework.coverageBefore : undefined,
      supported,
      total: items.length,
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after
        ? `Improved +${coverageOf(framework.id, 'after') - framework.coverageBefore}`
        : 'Limited by supplier gap',
      materialGap: after
        ? 'Supplier assessments now support this framework'
        : (partial?.title ?? 'Supplier assurance'),
      askPrompt: after
        ? `How did ${framework.name} coverage change?`
        : `Why is ${framework.name} only partly covered?`,
      tone: directionTone(after ? 'improved' : 'requires-attention'),
      obligationId: partial?.id ?? items[0]?.id,
    }
  })

  const greeting = {
    kicker: 'Executive Hub',
    lede: after
      ? 'The supplier-assurance gap is closed for this review.'
      : 'One material gap requires attention before the governance review.',
  }

  const evidenceLabel = missing ? 'Attention' : duplicate || expiring ? 'Watch' : 'Current'

  const indicators = [
    {
      id: 'readiness' as const,
      label: 'Compliance readiness',
      value: String(pos.readinessValue),
      status: pos.readinessLabel,
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? 'Improved from 64' : 'Requires attention',
      why: after
        ? 'Moved from 64 because current critical-supplier assessments were approved.'
        : 'Held at Needs attention because current critical-supplier assessments are missing.',
      askPrompt: after ? 'Why did compliance readiness change?' : 'Why does compliance readiness need attention?',
      tone: directionTone(after ? 'improved' : 'requires-attention'),
    },
    {
      id: 'coverage' as const,
      label: 'Framework coverage',
      value: `${coverageAverage}%`,
      status: `${frameworks.length} in scope`,
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? 'Improved across four frameworks' : 'Limited by one gap',
      why: after
        ? `ISO 27001 ${coverageOf('fw-iso27001', 'after')}% · NIS2 ${coverageOf('fw-nis2', 'after')}% · GDPR ${coverageOf('fw-gdpr', 'after')}% · NCA ECC ${coverageOf('fw-nca-ecc', 'after')}%.`
        : `${leading?.name} leads at ${leading?.coverage}%. All four are limited by the same supplier-assurance gap.`,
      askPrompt: 'How do the four frameworks compare?',
      tone: directionTone(after ? 'improved' : 'requires-attention'),
    },
    {
      id: 'gaps' as const,
      label: 'Material assurance gaps',
      value: after ? '0' : '1',
      status: after ? 'Closed for this review' : 'Highest impact',
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? 'Improved' : 'Requires attention',
      why: after
        ? 'The material supplier-assurance gap is closed. Watch items remain in the evidence catalogue.'
        : 'Current assessment evidence is missing for several critical suppliers.',
      askPrompt: after ? 'Has our position improved?' : 'Which gap affects the most frameworks?',
      tone: directionTone(after ? 'improved' : 'requires-attention'),
    },
    {
      id: 'evidence' as const,
      label: 'Evidence health',
      value: evidenceLabel,
      status: after
        ? `${superseded} superseded · ${duplicate} duplicate · ${expiring} expiring`
        : `${missing} missing · ${expired} expired · ${duplicate} duplicate · ${expiring} expiring`,
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? 'Improved · watch remains' : 'Requires attention',
      why: after
        ? 'The 2026 pack is current. A duplicate questionnaire is still flagged and the continuity test is expiring.'
        : 'The critical pack is missing. An expired 2023 pack, a duplicate 2024 pack and an expiring continuity test remain.',
      askPrompt: 'Where are we missing evidence?',
      tone: missing ? 'attention' : duplicate || expiring ? 'partial' : 'assured',
    },
  ]

  const factIdsBefore = [
    { text: 'The supplier-assurance policy is current (version 3.0).', citationIds: ['ev-policy-supplier'] },
    {
      text: 'Current assessment evidence is missing for several critical suppliers.',
      citationIds: ['ev-audit-findings'],
    },
    {
      text: 'Four international obligations are only partly supported.',
      citationIds: ['obl-iso-a532', 'obl-nis2-supply', 'obl-gdpr-processor', 'obl-nca-third-party'],
    },
    {
      text: 'ISO 27001, NIS2, GDPR and NCA ECC are affected by the same control.',
      citationIds: ['ctl-supplier-assurance'],
    },
    {
      text: 'Two connected governance risks are elevated.',
      citationIds: ['risk-third-party', 'risk-regulatory'],
    },
  ]

  const factIdsAfter = [
    {
      text: '2026 critical-supplier assessments are current and approved.',
      citationIds: ['ev-supplier-assessments-2026'],
    },
    {
      text: 'Supplier assurance is assured (policy plus current assessments).',
      citationIds: ['ctl-supplier-assurance'],
    },
    {
      text: 'Coverage improved across ISO 27001, NIS2, GDPR and NCA ECC.',
      citationIds: ['obl-iso-a532'],
    },
    {
      text: 'Third-party assurance and regulatory exposure are reduced.',
      citationIds: ['risk-third-party', 'risk-regulatory'],
    },
  ]

  const facts = (after ? factIdsAfter : factIdsBefore).map((item, index) => ({
    id: `fact-${index}`,
    text: item.text,
    citationIds: item.citationIds,
  }))

  const sourceIds = [...new Set(facts.flatMap((item) => item.citationIds))]
  const briefing = {
    kicker: 'Nox AI briefing',
    title: after
      ? 'Current assessments are now in place across four frameworks.'
      : 'Supplier assurance is the highest-impact gap before the review.',
    facts,
    interpretation: after
      ? 'One approval moved coverage, control assurance and connected risk together. The duplicate questionnaire does not reopen the material gap.'
      : hubAnswerBefore.interpretation,
    confidence: after ? 'high' : hubAnswerBefore.confidence,
    freshness: after
      ? 'Policy current · 2026 assessments current · 2023 pack superseded'
      : hubAnswerBefore.freshness,
    recommendedAction: after
      ? 'Open the Board Summary and cite the approved 2026 assessments. Resolve the duplicate pack when convenient.'
      : `${omar?.name} should complete the critical-supplier evidence package before the review. ${layla?.name} approves.`,
    approval: after
      ? `Already approved by ${layla?.name}.`
      : 'Human approval required before coverage or risk changes.',
    sources: sourceIds.map((id) => sourceRef(id, position)),
    askPrompt: after ? 'Has our position improved?' : 'Which gap affects the most frameworks?',
  }

  const primary = data.actions[0]
  const actions = after
    ? [
        {
          id: primary.id,
          title: 'Critical-supplier evidence package completed',
          recordTitle: primary.title,
          owner: layla ? `${layla.name}` : 'Layla Rahman',
          ownerRole: layla?.role ?? 'Chief Compliance Officer',
          due: 'Completed',
          impact: primary.impact,
          approvalStatus: `Approved by ${layla?.name}`,
          primary: true,
          askPrompt: 'What should I prioritise?',
          cta: 'Open Board Summary',
          target: 'board' as const,
        },
        {
          id: 'act-duplicate-pack',
          title: 'Resolve duplicate 2024 supplier questionnaire pack',
          recordTitle: '2024 supplier questionnaire pack',
          owner: omar?.name ?? 'Omar Haddad',
          ownerRole: omar?.role ?? 'Head of Procurement',
          due: 'Still flagged',
          impact: 'Catalogue integrity — does not reopen the material gap.',
          approvalStatus: 'No further approval required',
          primary: false,
          askPrompt: 'Where are we missing evidence?',
          cta: 'Open evidence record',
          target: 'record' as const,
          recordId: 'ev-supplier-q-duplicate',
        },
        {
          id: 'act-continuity-watch',
          title: 'Review expiring business continuity test report',
          recordTitle: 'Business continuity test report',
          owner: nadia?.name ?? 'Nadia Chen',
          ownerRole: nadia?.role ?? 'Information Security Lead',
          due: 'Watch · not the primary action',
          impact: 'Continuity evidence approaching review.',
          approvalStatus: 'No approval required for this watch item',
          primary: false,
          askPrompt: 'What should I prioritise?',
          cta: 'Open evidence record',
          target: 'record' as const,
          recordId: 'ev-bc-test',
        },
      ]
    : [
        {
          id: primary.id,
          title: 'Complete critical-supplier evidence package',
          recordTitle: primary.title,
          owner: omar?.name ?? 'Omar Haddad',
          ownerRole: omar?.role ?? 'Head of Procurement',
          due: `Due in ${organisation.review.daysRemaining} days`,
          impact: primary.impact,
          approvalStatus: `Approval required · ${layla?.name}`,
          primary: true,
          askPrompt: 'What is the highest-impact action before the review?',
          cta: 'Open action detail',
          target: 'upload' as const,
        },
        {
          id: 'act-continuity-watch',
          title: 'Review expiring business continuity test report',
          recordTitle: 'Business continuity test report',
          owner: nadia?.name ?? 'Nadia Chen',
          ownerRole: nadia?.role ?? 'Information Security Lead',
          due: 'Watch · not the primary action',
          impact: 'Continuity evidence approaching review — not the material gap.',
          approvalStatus: 'No approval required for this watch item',
          primary: false,
          askPrompt: 'Where are we missing evidence?',
          cta: 'Open evidence record',
          target: 'record' as const,
          recordId: 'ev-bc-test',
        },
        {
          id: 'act-duplicate-pack',
          title: 'Resolve duplicate 2024 supplier questionnaire pack',
          recordTitle: '2024 supplier questionnaire pack',
          owner: omar?.name ?? 'Omar Haddad',
          ownerRole: omar?.role ?? 'Head of Procurement',
          due: 'Flagged in the evidence set',
          impact: 'Duplicate of an expired pack. Does not close the material gap.',
          approvalStatus: 'No approval required to inspect the record',
          primary: false,
          askPrompt: 'Where are we missing evidence?',
          cta: 'Open evidence record',
          target: 'record' as const,
          recordId: 'ev-supplier-q-duplicate',
        },
      ]

  const layers: {
    id: MapNodeId
    layer: string
    title: string
    detail: string
    status: Tone
    askPrompt: string
  }[] = [
    {
      id: 'frameworks',
      layer: 'Frameworks',
      title: 'Frameworks',
      detail: after ? `${coverageAverage}% avg coverage` : `${frameworks.length} in scope`,
      status: after ? 'assured' : 'partial',
      askPrompt: 'How do the four frameworks compare?',
    },
    {
      id: 'obligations',
      layer: 'Obligations',
      title: 'Obligations',
      detail: after ? 'Four international obligations supported' : 'Four international obligations partial',
      status: after ? 'assured' : 'partial',
      askPrompt: after ? 'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?' : 'Which obligations are not fully supported?',
    },
    {
      id: 'controls',
      layer: 'Controls',
      title: 'Controls',
      detail: after ? 'Supplier assurance assured' : 'Supplier assurance partial',
      status: after ? 'assured' : 'partial',
      askPrompt: 'Why is this control only partially assured?',
    },
    {
      id: 'evidence',
      layer: 'Evidence',
      title: 'Evidence',
      detail: after ? 'Critical pack current' : 'Critical pack missing',
      status: after ? 'partial' : 'attention',
      askPrompt: 'Where are we missing evidence?',
    },
    {
      id: 'risks',
      layer: 'Risks',
      title: 'Risks',
      detail: after ? 'Exposure reduced' : `${elevatedRisks} elevated`,
      status: after ? 'assured' : 'attention',
      askPrompt: 'What is our biggest current risk?',
    },
    {
      id: 'owners',
      layer: 'Owners',
      title: 'Owners',
      detail: after ? `${layla?.name} approved` : `${omar?.name} accountable`,
      status: after ? 'assured' : 'partial',
      askPrompt: 'What is the highest-impact action before the review?',
    },
  ]

  const changes = after
    ? [
        {
          id: 'ch-approved',
          time: 'Just now',
          title: 'Current assessments approved',
          detail: 'Coverage, control assurance and connected risk moved together.',
          sourceId: 'ev-supplier-assessments-2026',
          askPrompt: 'Why did compliance readiness change?',
        },
        {
          id: 'ch-duplicate',
          time: 'Still open',
          title: 'Duplicate questionnaire remains flagged',
          detail: '2024 supplier questionnaire pack. Catalogue issue only.',
          sourceId: 'ev-supplier-q-duplicate',
          askPrompt: 'Where are we missing evidence?',
        },
        {
          id: 'ch-policy',
          time: '20 Jan 2026',
          title: 'Supplier-assurance policy remains current',
          detail: 'Version 3.0 now sits beside the 2026 assessments.',
          sourceId: 'ev-policy-supplier',
          askPrompt: 'Has our position improved?',
        },
      ]
    : [
        {
          id: 'ch-remediation',
          time: '15 Aug 2026',
          title: 'Remediation opened',
          detail: 'Obtain and approve current critical-supplier assessments.',
          sourceId: primary.id,
          askPrompt: 'What is the highest-impact action before the review?',
        },
        {
          id: 'ch-audit',
          time: '21 Jun 2026',
          title: 'Audit recorded the missing pack',
          detail: 'Internal audit findings note that current assessments are missing.',
          sourceId: 'ev-audit-findings',
          askPrompt: 'Which gap affects the most frameworks?',
        },
        {
          id: 'ch-policy',
          time: '20 Jan 2026',
          title: 'Supplier-assurance policy marked current',
          detail: 'Version 3.0. Policy does not replace assessments.',
          sourceId: 'ev-policy-supplier',
          askPrompt: 'Which gap affects the most frameworks?',
        },
      ]

  const notifications = after
    ? [
        {
          id: 'n-closed',
          title: 'Material gap closed for this review',
          body: 'Board Summary can cite current assessments.',
          target: 'board' as const,
        },
        {
          id: 'n-dup',
          title: 'Duplicate questionnaire still flagged',
          body: '2024 supplier questionnaire pack',
          target: 'evidence' as const,
          recordId: 'ev-supplier-q-duplicate',
        },
        {
          id: 'n-review',
          title: `Governance review in ${organisation.review.daysRemaining} days`,
          body: `${organisation.name} · ${reportingPeriod}`,
          target: 'hub' as const,
        },
      ]
    : [
        {
          id: 'n-review',
          title: `Governance review in ${organisation.review.daysRemaining} days`,
          body: `${organisation.name} · ${reportingPeriod}`,
          target: 'hub' as const,
        },
        {
          id: 'n-gap',
          title: 'Critical-supplier assessments missing',
          body: 'Highest-impact gap before the review',
          target: 'gap' as const,
        },
        {
          id: 'n-dup',
          title: 'Duplicate questionnaire flagged',
          body: '2024 supplier questionnaire pack',
          target: 'evidence' as const,
          recordId: 'ev-supplier-q-duplicate',
        },
      ]

  return {
    greeting,
    indicators,
    briefing,
    actions,
    frameworks: obligationRows,
    layers,
    changes,
    notifications,
    reviewLine: `Governance review in ${organisation.review.daysRemaining} days`,
    userLine: `${currentUser.name}, ${currentUser.role}`,
    orgName: organisation.name,
    reportingPeriod,
    connectedLede: after
      ? 'The same objects now agree across frameworks, obligations, controls, evidence, risks and owners.'
      : 'One missing evidence pack sits under four frameworks, keeps the control partial and elevates two connected risks.',
  }
}

export function personLine(id: string) {
  return personLabel(id)
}

export function frameworkLabel(id: string) {
  return frameworkName(id)
}

export type HubView = ReturnType<typeof buildHubView>
export type HubIndicator = HubView['indicators'][number]
export type HubAction = HubView['actions'][number]
export type HubFramework = HubView['frameworks'][number]
export type HubLayer = HubView['layers'][number]
export type HubChange = HubView['changes'][number]
export type HubNotification = HubView['notifications'][number]
