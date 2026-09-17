import type { IndicatorDirection, MapNodeId, NotificationTarget, PositionState, Tone } from './types.ts'
import {
  coverageOf,
  currentUser,
  data,
  demo,
  frameworkName,
  hubAnswerBefore,
  internationalFrameworks,
  layla,
  lookupSource,
  maya,
  organisation,
  personLabel,
  phishingRisk,
  reportingPeriod,
  supplierControl,
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

function appetiteLabel(status: string | undefined) {
  if (status === 'within') return 'Within Appetite'
  if (status === 'above') return 'Above Appetite'
  return status ?? 'Appetite reviewed'
}

export function buildHubView(position: PositionState) {
  const after = position === 'after'
  const pos = after ? data.position.after : data.position.before
  const risk = phishingRisk
  const residual = after ? risk?.residualAfter : risk?.residualBefore
  const appetite = appetiteLabel(after ? risk?.appetiteStatusAfter : risk?.appetiteStatusBefore)
  const residualLine = residual?.rating ?? 'Moderate'
  const nextAction =
    (after ? risk?.treatment.latestUpdateAfter : risk?.treatment.latestUpdateBefore) ??
    data.actions[0]?.title ??
    pos.accountableAction
  const dueDate = risk?.treatment.targetDate ?? risk?.nextReview ?? '15 Oct 2026'
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
  const focusEvidence = catalogue.filter((item) => demo.focusEvidenceIds.includes(item.id))
  const expired = catalogue.filter((item) => item.freshness === 'expired' && !item.duplicateOf).length
  const expiring = catalogue.filter((item) => item.freshness === 'expiring').length
  const elevatedRisks = data.risks.filter((item) => (after ? item.levelAfter : item.levelBefore) === 'elevated').length
  const aboveAppetite = data.risks.filter(
    (item) => (after ? item.appetiteStatusAfter : item.appetiteStatusBefore) === 'above',
  ).length

  const obligationRows = internationalFrameworks.map((framework) => {
    const items = data.obligations.filter(
      (item) => item.frameworkId === framework.id && item.includeInHub !== false,
    )
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
        : partial
          ? 'Partial support remains'
          : 'Supported',
      materialGap: after
        ? demo.controlBlurb
        : (partial?.title ?? pos.materialGap),
      askPrompt: after
        ? `How did ${framework.name} coverage change?`
        : `Why is ${framework.name} only partly covered?`,
      tone: directionTone(after ? 'improved' : partial ? 'requires-attention' : 'held'),
      obligationId: partial?.id ?? items[0]?.id,
    }
  })

  const greeting = {
    kicker: 'Executive Hub',
    lede: after
      ? `${demo.focusRiskCode} ${risk?.title ?? demo.story} remains ${residualLine} and ${appetite}. Linked phishing protections stay evidenced.`
      : `${demo.focusRiskCode} ${risk?.title ?? demo.story} — residual ${residualLine}, ${appetite}. Next: ${nextAction}`,
  }

  const evidenceLabel = focusEvidence.every((item) => item.freshness === 'current')
    ? 'Current'
    : expiring
      ? 'Watch'
      : 'Attention'

  const indicators = [
    {
      id: 'readiness' as const,
      label: 'Compliance readiness',
      value: String(pos.readinessValue),
      status: pos.readinessLabel,
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? `Improved from ${data.position.before.readinessValue}` : 'Requires attention',
      why: after
        ? `Position holds with ${demo.focusRiskCode} residual ${residualLine} and phishing controls evidenced.`
        : `Needs attention while ${aboveAppetite} cyber risks sit above appetite; ${demo.focusRiskCode} residual is ${residualLine} and ${appetite}.`,
      askPrompt: after ? 'Why did compliance readiness change?' : 'Why does compliance readiness need attention?',
      tone: directionTone(after ? 'improved' : 'requires-attention'),
    },
    {
      id: 'coverage' as const,
      label: 'Framework coverage',
      value: `${coverageAverage}%`,
      status: `${frameworks.length} in scope`,
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? 'Improved across four frameworks' : `${leading?.name} leads`,
      why: after
        ? `ISO 27001 ${coverageOf('fw-iso27001', 'after')}% · NIS2 ${coverageOf('fw-nis2', 'after')}% · GDPR ${coverageOf('fw-gdpr', 'after')}% · NCA ECC ${coverageOf('fw-nca-ecc', 'after')}%.`
        : `${leading?.name} leads at ${leading?.coverage}%. ${demo.controlBlurb}`,
      askPrompt: 'How do the four frameworks compare?',
      tone: directionTone(after ? 'improved' : 'requires-attention'),
    },
    {
      id: 'gaps' as const,
      label: 'Material assurance gaps',
      value: String(aboveAppetite),
      status: after ? 'Phishing within appetite' : 'Above-appetite cyber risks',
      direction: (after ? 'improved' : 'requires-attention') as IndicatorDirection,
      directionLabel: after ? 'Improved' : 'Requires attention',
      why: after
        ? pos.materialGap
        : `${pos.materialGap} Start with ${demo.focusRiskCode}.`,
      askPrompt: after ? 'Has our position improved?' : 'What should I focus on first?',
      tone: directionTone(after ? 'improved' : 'requires-attention'),
    },
    {
      id: 'evidence' as const,
      label: 'Evidence health',
      value: evidenceLabel,
      status: `${focusEvidence.length} phishing packs · ${expiring} expiring catalogue-wide`,
      direction: (after ? 'improved' : 'held') as IndicatorDirection,
      directionLabel: after ? 'Accepted · watch remains' : 'Accepted for phishing controls',
      why: after
        ? 'EVD-005 and EVD-006 remain accepted. Broader catalogue watch items do not reopen the phishing position.'
        : 'EVD-005 confirms privileged-user MFA enrollment; EVD-006 shows test campaigns were blocked.',
      askPrompt: 'How are we protecting against phishing?',
      tone: focusEvidence.length ? 'assured' : expired || expiring ? 'partial' : 'assured',
    },
  ]

  const factIdsBefore = hubAnswerBefore.sourcedFacts.map((fact) => ({
    text: fact.text,
    citationIds: fact.citationIds,
  }))

  const factIdsAfter = [
    {
      text: `${demo.focusRiskCode} residual rating remains ${residualLine} and ${appetite}.`,
      citationIds: ['risk-002'],
    },
    {
      text: 'CTL-005 Phishing-resistant MFA and CTL-006 Email threat protection remain Effective.',
      citationIds: ['ctl-005', 'ctl-006'],
    },
    {
      text: 'EVD-005 and EVD-006 stay accepted for the linked phishing controls.',
      citationIds: ['evd-005', 'evd-006'],
    },
    {
      text: `Next action remains with ${maya?.role ?? 'Learning Manager'}: ${nextAction}`,
      citationIds: ['risk-002', data.actions[0]?.id ?? 'act-phishing-coach'],
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
      ? `${demo.focusRiskCode} stays Within Appetite with evidenced phishing protections.`
      : `Start with ${demo.focusRiskCode} — ${risk?.title ?? demo.story}.`,
    facts,
    interpretation: after
      ? demo.controlBlurb
      : hubAnswerBefore.interpretation,
    confidence: after ? 'high' : hubAnswerBefore.confidence,
    freshness: after
      ? 'Evidence accepted · coaching action still due'
      : hubAnswerBefore.freshness,
    recommendedAction: after
      ? `Open ${demo.focusRiskCode} and cite EVD-005 and EVD-006 in the Phishing Risk Summary.`
      : hubAnswerBefore.recommendedAction,
    approval: after
      ? `No further approval required for this snapshot · ${layla?.name} remains accountable.`
      : hubAnswerBefore.approvalRequired
        ? 'Human approval required before coverage or risk changes.'
        : `No approval gate on the coaching action · owner ${maya?.name ?? 'Maya Torres'}.`,
    sources: sourceIds.map((id) => sourceRef(id, position)),
    askPrompt: after ? 'Has our position improved?' : 'What should I focus on first?',
    primaryCta: 'Open phishing risk',
  }

  const primary = data.actions[0]
  const controlTitle = supplierControl?.title ?? 'Phishing-resistant MFA'
  type HubActionTarget = 'record' | 'board' | 'upload'
  const actions: {
    id: string
    title: string
    recordTitle: string
    owner: string
    ownerRole: string
    due: string
    impact: string
    approvalStatus: string
    primary: boolean
    askPrompt: string
    cta: string
    target: HubActionTarget
    recordId?: string
  }[] = after
    ? [
        {
          id: primary.id,
          title: primary.title,
          recordTitle: `${demo.focusRiskCode} · ${risk?.title ?? demo.story}`,
          owner: maya?.name ?? 'Maya Torres',
          ownerRole: maya?.role ?? 'Learning Manager',
          due: `Due ${dueDate}`,
          impact: primary.impact,
          approvalStatus: 'Open · no further approval required',
          primary: true,
          askPrompt: 'What should I prioritise?',
          cta: 'Open phishing risk',
          target: 'record',
          recordId: 'risk-002',
        },
        {
          id: 'act-review-mfa',
          title: `Review ${controlTitle}`,
          recordTitle: controlTitle,
          owner: maya?.name ?? 'Maya Torres',
          ownerRole: maya?.role ?? 'Learning Manager',
          due: 'Linked control',
          impact: demo.controlBlurb,
          approvalStatus: 'No approval required to inspect',
          primary: false,
          askPrompt: 'How are we protecting against phishing?',
          cta: 'Open control record',
          target: 'record',
          recordId: 'ctl-005',
        },
        {
          id: 'act-review-email-filter',
          title: 'Review email filtering test evidence',
          recordTitle: 'Email filtering test',
          owner: maya?.name ?? 'Maya Torres',
          ownerRole: maya?.role ?? 'Learning Manager',
          due: 'Accepted evidence',
          impact: 'Supports CTL-006 Email threat protection for RSK-002.',
          approvalStatus: 'No approval required to inspect',
          primary: false,
          askPrompt: 'How are we protecting against phishing?',
          cta: 'Open evidence record',
          target: 'record',
          recordId: 'evd-006',
        },
      ]
    : [
        {
          id: primary.id,
          title: primary.title,
          recordTitle: `${demo.focusRiskCode} · ${risk?.title ?? demo.story}`,
          owner: maya?.name ?? 'Maya Torres',
          ownerRole: maya?.role ?? 'Learning Manager',
          due: `Due ${dueDate}`,
          impact: primary.impact,
          approvalStatus: hubAnswerBefore.approvalRequired
            ? `Approval required · ${layla?.name}`
            : `Owner ${maya?.name} · due ${dueDate}`,
          primary: true,
          askPrompt: 'What should I focus on first?',
          cta: 'Open phishing risk',
          target: 'record',
          recordId: 'risk-002',
        },
        {
          id: 'act-review-mfa',
          title: `Confirm ${controlTitle} coverage`,
          recordTitle: controlTitle,
          owner: maya?.name ?? 'Maya Torres',
          ownerRole: maya?.role ?? 'Learning Manager',
          due: 'Linked to EVD-005',
          impact: 'Phishing-resistant MFA reduces credential-theft residual for RSK-002.',
          approvalStatus: 'No approval required to inspect',
          primary: false,
          askPrompt: 'How are we protecting against phishing?',
          cta: 'Open control record',
          target: 'record',
          recordId: 'ctl-005',
        },
        {
          id: 'act-review-mfa-evidence',
          title: 'Open MFA coverage report',
          recordTitle: 'MFA coverage report',
          owner: maya?.name ?? 'Maya Torres',
          ownerRole: maya?.role ?? 'Learning Manager',
          due: 'Accepted evidence',
          impact: 'EVD-005 shows privileged users enrolled for CTL-005.',
          approvalStatus: 'No approval required to inspect',
          primary: false,
          askPrompt: 'How are we protecting against phishing?',
          cta: 'Open evidence record',
          target: 'record',
          recordId: 'evd-005',
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
      detail: after ? 'International obligations retained' : 'Partial rows retained alongside phishing focus',
      status: after ? 'assured' : 'partial',
      askPrompt: after ? 'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?' : 'Which obligations are not fully supported?',
    },
    {
      id: 'controls',
      layer: 'Controls',
      title: 'Controls',
      detail: after ? 'CTL-005 and CTL-006 effective' : 'MFA and email threat protection effective',
      status: 'assured',
      askPrompt: 'How are we protecting against phishing?',
    },
    {
      id: 'evidence',
      layer: 'Evidence',
      title: 'Evidence',
      detail: after ? 'EVD-005 · EVD-006 accepted' : 'MFA coverage and email filtering accepted',
      status: 'assured',
      askPrompt: 'How are we protecting against phishing?',
    },
    {
      id: 'risks',
      layer: 'Risks',
      title: 'Risks',
      detail: after
        ? `${demo.focusRiskCode} ${residualLine} · ${appetite}`
        : `${demo.focusRiskCode} ${residualLine} · ${elevatedRisks} elevated elsewhere`,
      status: after ? 'assured' : 'partial',
      askPrompt: 'Open the phishing risk',
    },
    {
      id: 'owners',
      layer: 'Owners',
      title: 'Owners',
      detail: after ? `${maya?.name} owns coaching` : `${maya?.name} accountable`,
      status: 'partial',
      askPrompt: 'What should I focus on first?',
    },
  ]

  const changes = after
    ? [
        {
          id: 'ch-position',
          time: demo.snapshotDate,
          title: `${demo.focusRiskCode} position unchanged`,
          detail: `Residual ${residualLine}, ${appetite}.`,
          sourceId: 'risk-002',
          askPrompt: 'Has our position improved?',
        },
        {
          id: 'ch-controls',
          time: demo.snapshotDate,
          title: 'Phishing controls remain effective',
          detail: demo.controlBlurb,
          sourceId: 'ctl-005',
          askPrompt: 'How are we protecting against phishing?',
        },
        {
          id: 'ch-evidence',
          time: demo.snapshotDate,
          title: 'Accepted phishing evidence retained',
          detail: 'EVD-005 MFA coverage · EVD-006 email filtering test.',
          sourceId: 'evd-005',
          askPrompt: 'How are we protecting against phishing?',
        },
      ]
    : [
        {
          id: 'ch-focus',
          time: demo.snapshotDate,
          title: `${demo.focusRiskCode} selected for the walkthrough`,
          detail: `Inherent High · residual ${residualLine} · ${appetite}.`,
          sourceId: 'risk-002',
          askPrompt: 'What should I focus on first?',
        },
        {
          id: 'ch-coaching',
          time: dueDate,
          title: 'Coaching action opened',
          detail: nextAction,
          sourceId: primary.id,
          askPrompt: 'What should I focus on first?',
        },
        {
          id: 'ch-evidence',
          time: '01 Sep 2026',
          title: 'Phishing evidence accepted',
          detail: 'EVD-005 and EVD-006 support CTL-005 and CTL-006.',
          sourceId: 'evd-005',
          askPrompt: 'How are we protecting against phishing?',
        },
      ]

  const notifications: {
    id: string
    title: string
    body: string
    target: NotificationTarget
    recordId?: string
  }[] = after
    ? [
        {
          id: 'n-phishing',
          title: `${demo.focusRiskCode} remains Within Appetite`,
          body: 'Open phishing risk from the briefing CTA',
          target: 'hub',
        },
        {
          id: 'n-evidence',
          title: 'Phishing evidence still accepted',
          body: 'EVD-005 · EVD-006',
          target: 'evidence',
          recordId: 'evd-005',
        },
        {
          id: 'n-review',
          title: `Governance review in ${organisation.review.daysRemaining} days`,
          body: `${organisation.name} · ${reportingPeriod}`,
          target: 'hub',
        },
      ]
    : [
        {
          id: 'n-review',
          title: `Governance review in ${organisation.review.daysRemaining} days`,
          body: `${organisation.name} · ${reportingPeriod}`,
          target: 'hub',
        },
        {
          id: 'n-phishing',
          title: `Focus ${demo.focusRiskCode} phishing risk`,
          body: `Residual ${residualLine} · ${appetite}`,
          target: 'hub',
        },
        {
          id: 'n-coach',
          title: 'Coaching action due',
          body: `${maya?.name} · ${dueDate}`,
          target: 'action',
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
      ? 'RSK-002 still connects MFA and email threat protection to accepted evidence and the Learning Manager coaching action.'
      : 'RSK-002 connects phishing-resistant MFA and email threat protection to accepted evidence, with Maya Torres owning the next coaching action.',
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
