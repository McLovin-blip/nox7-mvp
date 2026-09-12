import type { ModuleId, PositionState, RecordRow, Tone } from './types.ts'
import { buildConnectView } from './connectModel.ts'
import { buildHubView } from './hubModel.ts'
import {
  coverageOf,
  currentUser,
  data,
  evidenceFor,
  frameworkName,
  internationalFrameworks,
  layla,
  nadia,
  omar,
  organisation,
  personLabel,
  prompts,
  reportingPeriod,
  supplierControl,
  titleOf,
} from './data.ts'

function toneFrom(status: string): Tone {
  const value = status.toLowerCase()
  if (value.includes('missing') || value.includes('elevated') || value.includes('attention') || value.includes('expired')) {
    return 'attention'
  }
  if (value.includes('partial') || value.includes('watch') || value.includes('expir')) {
    return 'partial'
  }
  return 'assured'
}

export function buildAppView(position: PositionState) {
  const after = position === 'after'
  const pos = after ? data.position.after : data.position.before
  const catalogue = evidenceFor(position)
  const expired = catalogue.filter((item) => item.freshness === 'expired' && !item.duplicateOf && !(after && item.id === 'ev-supplier-assessments-2023')).length
  const superseded = after ? 1 : 0
  const duplicate = catalogue.filter((item) => item.duplicateOf).length
  const expiring = catalogue.filter((item) => item.freshness === 'expiring').length
  const missing = after ? 0 : 1
  const frameworks = internationalFrameworks.map((item) => ({
    id: item.id,
    name: item.name,
    coverage: coverageOf(item.id, position),
  }))
  const coverageAverage = Math.round(frameworks.reduce((sum, item) => sum + item.coverage, 0) / frameworks.length)
  const leading = [...frameworks].sort((a, b) => b.coverage - a.coverage)[0]
  const obligations = data.obligations.map((item) => {
    const support = after ? item.supportAfter : item.supportBefore
    return {
      id: item.id,
      kind: 'Obligation' as const,
      title: item.title,
      status: support === 'supported' ? 'Supported' : 'Partial',
      tone: toneFrom(support),
      owner: personLabel(item.ownerId),
      summary: `${frameworkName(item.frameworkId)} · ${support === 'supported' ? 'Supported by current evidence' : 'Policy in place; current assessments missing'}`,
      meta: frameworkName(item.frameworkId),
      neighbours: [
        ...item.policyIds.map((id) => ({ label: 'Policy', title: titleOf(data.evidence, id) })),
        ...item.controlIds.map((id) => ({ label: 'Control', title: titleOf(data.controls, id) })),
        ...item.riskIds.map((id) => ({ label: 'Risk', title: titleOf(data.risks, id) })),
      ],
      frameworkId: item.frameworkId,
      framework: frameworkName(item.frameworkId),
    }
  })
  const partialInternational = obligations.filter(
    (item) => item.tone === 'partial' && item.frameworkId !== 'fw-internal',
  )

  const controls = data.controls.map((item) => {
    const assurance = after ? item.assuranceAfter : item.assuranceBefore
    return {
      id: item.id,
      kind: 'Control' as const,
      title: item.title,
      status: assurance === 'assured' ? 'Assured' : 'Partially assured',
      tone: toneFrom(assurance),
      owner: personLabel(item.ownerId),
      summary:
        item.id === 'ctl-supplier-assurance'
          ? after
            ? 'Policy and current assessments are both in place.'
            : (item.partialReason ?? 'Policy is current. Current assessments are missing.')
          : 'Assured by current evidence.',
      meta: item.frameworkIds.map((id) => frameworkName(id)).join(' · '),
      neighbours: [
        ...item.obligationIds.map((id) => ({ label: 'Obligation', title: titleOf(data.obligations, id) })),
        ...item.riskIds.map((id) => ({ label: 'Risk', title: titleOf(data.risks, id) })),
      ],
      frameworkNames: item.frameworkIds.map((id) => frameworkName(id)),
    }
  })

  const evidence = catalogue.map((item) => {
    const supersededPack = after && item.id === 'ev-supplier-assessments-2023'
    const status = supersededPack
      ? 'Superseded'
      : item.duplicateOf
        ? 'Duplicate'
        : item.freshness === 'expired'
          ? 'Expired'
          : item.freshness === 'expiring'
            ? 'Expiring'
            : 'Current'
    return {
      id: item.id,
      kind: 'Evidence' as const,
      title: item.title,
      status,
      tone: toneFrom(status),
      owner: personLabel(item.ownerId),
      summary: `${item.fileType} · Version ${item.version}`,
      meta: item.date,
      neighbours: [
        ...item.usedByControlIds.map((id) => ({ label: 'Control', title: titleOf(data.controls, id) })),
        ...item.usedByObligationIds.map((id) => ({ label: 'Obligation', title: titleOf(data.obligations, id) })),
        ...item.usedByRiskIds.map((id) => ({ label: 'Risk', title: titleOf(data.risks, id) })),
      ],
      fileType: item.fileType,
      version: item.version,
      date: item.date,
    }
  })

  const risks = data.risks.map((item) => {
    const level = after ? item.levelAfter : item.levelBefore
    const status = level === 'elevated' ? 'Elevated' : level === 'reduced' ? 'Reduced' : 'Watch'
    return {
      id: item.id,
      kind: 'Risk' as const,
      title: item.title,
      status,
      tone: toneFrom(level === 'reduced' ? 'assured' : level),
      owner: personLabel(item.ownerId),
      summary: after && item.id !== 'risk-continuity'
        ? 'Reduced after current assessments were approved.'
        : item.contributingGap,
      meta: status,
      neighbours: [
        ...item.controlIds.map((id) => ({ label: 'Control', title: titleOf(data.controls, id) })),
        ...item.obligationIds.map((id) => ({ label: 'Obligation', title: titleOf(data.obligations, id) })),
      ],
    }
  })

  const elevatedCount = risks.filter((item) => item.status === 'Elevated').length

  const nav: { id: ModuleId; label: string; badge?: number }[] = [
    { id: 'hub', label: 'Executive Hub' },
    { id: 'connect', label: 'Nox Connect' },
    { id: 'risks', label: 'Risks', badge: elevatedCount || undefined },
    { id: 'controls', label: 'Controls' },
    { id: 'regulatory', label: 'Regulatory' },
    { id: 'evidence', label: 'Evidence', badge: missing + expired + duplicate + expiring + superseded },
    { id: 'reports', label: 'Reports' },
    { id: 'activity', label: 'Activity' },
  ]

  const strip = {
    readinessLabel: pos.readinessLabel,
    readinessValue: pos.readinessValue,
    frameworkCount: frameworks.length,
    coverageAverage,
    leadingFramework: leading,
    materialGaps: after ? 0 : 1,
    materialGap: pos.materialGap,
    evidenceHealth: { missing, expired, duplicate, expiring, superseded },
    evidenceLabel: missing ? 'Attention' : duplicate || expiring ? 'Watch' : 'Current',
    frameworks,
  }

  const hub = buildHubView(position)
  const greeting = hub.greeting
  const briefing = hub.briefing
  const actions = hub.actions
  const mapNodes = hub.layers.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    status: item.status,
  }))

  const mapCentre = after
    ? {
        kicker: 'Review position',
        title: 'Gap closed',
        detail: 'Policy + current assessments',
      }
    : {
        kicker: 'Highest-impact gap',
        title: 'Supplier assurance',
        detail: `${partialInternational.length} obligations · ${frameworks.length} frameworks`,
      }

  const gap = buildGap(
    position,
    obligations.filter((item) =>
      ['obl-iso-a532', 'obl-nis2-supply', 'obl-gdpr-processor', 'obl-nca-third-party'].includes(item.id),
    ),
  )

  const reports = data.reports.map((item) => ({
    id: item.id,
    title: item.title,
    primary: item.primary,
    period: item.period,
    status: item.primary ? (after ? 'Updated from current position' : 'Describes the material gap') : 'Listed for the same period',
  }))

  const board = after
    ? {
        kicker: 'Board Summary · Q3 2026',
        title: 'Supplier-assurance gap closed for this review',
        lede: 'Current critical-supplier assessments have been approved. Coverage improved across ISO 27001, NIS2, GDPR and NCA ECC. The supplier-assurance control is assured. Third-party and regulatory exposure are reduced.',
        statements: [
          {
            text: 'Compliance readiness moved from 64 (Needs attention) to 72 (Improved).',
            citationId: 'rep-board-summary',
          },
          {
            text: 'ISO 27001 86% · NIS2 82% · GDPR 80% · NCA ECC 79%.',
            citationId: 'ctl-supplier-assurance',
          },
          {
            text: '2026 critical-supplier assessments are current and cited as the closing evidence.',
            citationId: 'ev-supplier-assessments-2026',
          },
        ],
        watch: 'A 2024 supplier questionnaire pack remains flagged as a duplicate. The business continuity test report is expiring.',
      }
    : {
        kicker: 'Board Summary · Q3 2026',
        title: 'One material gap remains before the governance review',
        lede: 'Meridian has a current supplier-assurance policy, but current assessment evidence is missing for several critical suppliers. That leaves related obligations only partly covered and keeps two connected risks elevated.',
        statements: [
          {
            text: 'Compliance readiness is 64 — Needs attention.',
            citationId: 'rep-board-summary',
          },
          {
            text: 'The supplier assurance policy is current (version 3.0) and does not replace assessments.',
            citationId: 'ev-policy-supplier',
          },
          {
            text: 'Internal audit findings record that current critical-supplier assessments are missing.',
            citationId: 'ev-audit-findings',
          },
        ],
        watch: 'Highest-impact action: obtain and approve current assessments. Omar Haddad accountable. Layla Rahman approves.',
      }

  return {
    position,
    currentUser,
    organisation,
    reportingPeriod,
    nav,
    strip,
    hub,
    greeting,
    briefing,
    actions,
    mapNodes,
    mapCentre,
    gap,
    connect: buildConnectView(position),
    obligations,
    controls,
    evidence,
    risks,
    reports,
    board,
    prompts,
  }
}

function buildGap(
  position: PositionState,
  internationalPartialOrAll: { title: string; framework: string; status: string; owner: string }[],
) {
  const after = position === 'after'
  return {
    kicker: 'Connected gap',
    title: 'Supplier assurance',
    lede: after
      ? 'Policy and current assessments are both in place. The four international obligations are supported, the control is assured, and connected exposure is reduced.'
      : 'The policy is current, but current assessment evidence is missing for several critical suppliers. That leaves four international obligations only partly covered and keeps the control partial.',
    steps: [
      {
        id: 'policy' as const,
        index: '01',
        kicker: 'Policy',
        title: 'Supplier assurance policy',
        status: 'Current',
        tone: 'assured' as const,
        summary: after
          ? 'Still current, and now backed by assessments.'
          : 'Documented and current. It does not replace assessments.',
      },
      {
        id: 'obligations' as const,
        index: '02',
        kicker: 'Obligations',
        title: 'Four international frameworks',
        status: after ? 'Supported' : 'Partial',
        tone: after ? ('assured' as const) : ('partial' as const),
        summary: after
          ? 'ISO 27001, NIS2, GDPR and NCA ECC are supported.'
          : 'ISO 27001, NIS2, GDPR and NCA ECC share this gap.',
      },
      {
        id: 'control' as const,
        index: '03',
        kicker: 'Control',
        title: 'Supplier assurance',
        status: after ? 'Assured' : 'Partial',
        tone: after ? ('assured' as const) : ('partial' as const),
        summary: after
          ? 'Policy plus current assessments.'
          : 'Assured by policy only until current assessments exist.',
      },
      {
        id: 'evidence' as const,
        index: '04',
        kicker: 'Evidence',
        title: after ? '2026 critical-supplier assessments' : 'Current critical-supplier assessments',
        status: after ? 'Current' : 'Missing',
        tone: after ? ('assured' as const) : ('attention' as const),
        summary: after
          ? 'Approved for this review. The 2023 pack is superseded.'
          : 'The 2023 pack is expired and is not acceptable for the review.',
      },
      {
        id: 'risks' as const,
        index: '05',
        kicker: 'Risks',
        title: 'Third-party and regulatory exposure',
        status: after ? 'Reduced' : 'Elevated',
        tone: after ? ('assured' as const) : ('attention' as const),
        summary: after
          ? 'Both connected risks reduced with the same approval.'
          : 'The same missing evidence keeps both risks elevated.',
      },
    ],
    details: {
      overview: {
        kicker: 'How this gap is connected',
        title: after ? 'The missing pack is now in place' : 'One missing pack sits under four frameworks',
        status: after ? 'Closed for this review' : 'Highest-impact gap',
        tone: after ? ('assured' as const) : ('attention' as const),
        body: after
          ? 'A current supplier-assurance policy, current assessments, four supported obligations, an assured control, and reduced third-party and regulatory exposure now agree.'
          : 'A current supplier-assurance policy sits above four overlapping obligations. The supplier-assurance control stays partial because current assessments are missing. That elevates third-party assurance and regulatory exposure ahead of the review.',
        items: [] as { label: string; title: string; meta: string }[],
      },
      policy: {
        kicker: 'Policy',
        title: 'Supplier assurance policy',
        status: 'Current',
        tone: 'assured' as const,
        body: after
          ? 'The documented policy remains current and is now used together with the 2026 assessments.'
          : 'The documented policy exists and is current. It is reused across the connected obligations, but it does not replace current critical-supplier assessments.',
        items: [
          {
            label: 'Record',
            title: 'PDF · Version 3.0',
            meta: omar ? `${omar.name}, ${omar.role}` : '',
          },
        ],
      },
      obligations: {
        kicker: 'Obligations',
        title: 'Overlapping supplier-assurance requirements',
        status: after ? 'Supported' : 'Partial',
        tone: after ? ('assured' as const) : ('partial' as const),
        body: after
          ? 'Each obligation is now supported by the same policy, control and current assessments.'
          : 'Each of these obligations is supported by the same policy and the same control. None is fully supported until current assessments are in place.',
        items: internationalPartialOrAll.map((item) => ({
          label: item.framework,
          title: item.title,
          meta: `${item.owner} · ${item.status}`,
        })),
      },
      control: {
        kicker: 'Control',
        title: supplierControl?.title ?? 'Supplier assurance',
        status: after ? 'Assured' : 'Partially assured',
        tone: after ? ('assured' as const) : ('partial' as const),
        body: after
          ? 'Policy and current assessments are both in place. Nadia Chen remains control owner.'
          : (supplierControl?.partialReason ?? 'Policy is current. Current assessments for critical suppliers are missing.'),
        items: [
          {
            label: 'Control owner',
            title: nadia ? `${nadia.name}, ${nadia.role}` : 'Information Security Lead',
            meta: after ? 'Control assured for this review' : 'Accountable for the control, not the missing pack',
          },
          {
            label: 'Supports',
            title: internationalFrameworks.map((item) => item.name).join(' · '),
            meta: 'One control, four international frameworks',
          },
        ],
      },
      evidence: {
        kicker: 'Evidence',
        title: after ? '2026 critical-supplier assessments' : 'Current critical-supplier assessments',
        status: after ? 'Current' : 'Missing',
        tone: after ? ('assured' as const) : ('attention' as const),
        body: after
          ? 'The 2026 pack is current and approved. The 2023 pack is superseded. A 2024 questionnaire pack is still flagged as a duplicate.'
          : 'Current assessment evidence is missing for several critical suppliers. The expired 2023 pack is not acceptable for the review. A 2024 questionnaire pack is flagged as a duplicate.',
        items: after
          ? [
              { label: 'Approved', title: '2026 critical-supplier assessments', meta: 'Current' },
              { label: 'Present', title: 'Supplier assurance policy', meta: 'Current' },
              { label: 'Superseded', title: '2023 critical-supplier assessments', meta: 'Replaced for this review' },
              { label: 'Flagged', title: '2024 supplier questionnaire pack', meta: 'Duplicate' },
            ]
          : [
              { label: 'Present', title: 'Supplier assurance policy', meta: 'Current · does not close the gap' },
              { label: 'Records the gap', title: 'Internal audit findings', meta: 'Current' },
              { label: 'Not acceptable', title: '2023 critical-supplier assessments', meta: 'Expired' },
              { label: 'Flagged', title: '2024 supplier questionnaire pack', meta: 'Duplicate' },
            ],
      },
      risks: {
        kicker: 'Risks',
        title: after ? 'Connected exposure after approval' : 'Connected exposure ahead of the review',
        status: after ? 'Reduced' : 'Elevated',
        tone: after ? ('assured' as const) : ('attention' as const),
        body: after
          ? 'Third-party assurance and regulatory exposure reduced together when the assessments were approved. Continuity evidence remains a watch item.'
          : 'Both elevated risks trace to the same missing assessments. Closing the evidence gap is the efficient remediation before the review.',
        items: data.risks
          .filter((item) => item.id !== 'risk-continuity' || after)
          .map((item) => {
            const level = after ? item.levelAfter : item.levelBefore
            return {
              label: level === 'elevated' ? 'Elevated' : level === 'reduced' ? 'Reduced' : 'Watch',
              title: item.title,
              meta: personLabel(item.ownerId),
            }
          }),
      },
    },
    action: after
      ? {
          kicker: 'Position',
          title: 'Approved by Layla Rahman',
          owner: omar ? `${omar.name} obtained the pack` : '',
          approver: layla ? `${layla.name}, ${layla.role}` : '',
          due: 'Completed',
          cta: 'Open Board Summary',
        }
      : {
          kicker: 'Highest-impact action',
          title: data.actions[0].title,
          owner: omar ? `${omar.name}, ${omar.role}` : '',
          approver: layla ? `${layla.name}, ${layla.role}` : '',
          due: `Due in ${organisation.review.daysRemaining} days`,
          cta: 'Upload current assessments',
        },
  }
}

export type AppView = ReturnType<typeof buildAppView>
export type GapModel = AppView['gap']

export function findRecord(view: AppView, id: string): RecordRow | null {
  return (
    view.obligations.find((item) => item.id === id) ??
    view.controls.find((item) => item.id === id) ??
    view.evidence.find((item) => item.id === id) ??
    view.risks.find((item) => item.id === id) ??
    null
  )
}

export const seedActivity = [
  {
    id: 'act-audit',
    time: '21 Jun 2026',
    actor: 'Layla Rahman',
    title: 'Internal audit findings indexed',
    detail: 'Findings record that current critical-supplier assessments are missing.',
    tone: 'info' as const,
  },
  {
    id: 'act-policy',
    time: '20 Jan 2026',
    actor: 'Omar Haddad',
    title: 'Supplier assurance policy marked current',
    detail: 'Version 3.0. Policy does not replace assessments.',
    tone: 'ok' as const,
  },
  {
    id: 'act-open',
    time: '15 Aug 2026',
    actor: 'Omar Haddad',
    title: 'Remediation opened',
    detail: 'Obtain and approve current critical-supplier assessments.',
    tone: 'wait' as const,
  },
]
