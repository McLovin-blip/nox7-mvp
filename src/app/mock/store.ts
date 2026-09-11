import organisationJson from '../../../docs/mock/meridian-organisation.json' with { type: 'json' }
import type { AiPanelModel, GapStepId, MapNodeId, ModuleId, SourceKind } from './types.ts'

const data = organisationJson
const before = data.position.before
const answer = data.ai.primaryHubAnswerBefore

const internationalFrameworks = data.frameworks.filter((item) => item.id !== 'fw-internal')

const evidenceRecords = data.evidence.filter((item) => !('availableFromState' in item && item.availableFromState === 'after'))
const missingCriticalPack = 1
const expired = evidenceRecords.filter((item) => item.freshness === 'expired' && !item.duplicateOf).length
const duplicate = evidenceRecords.filter((item) => item.duplicateOf).length
const expiring = evidenceRecords.filter((item) => item.freshness === 'expiring').length
const elevatedRisks = data.risks.filter((item) => item.levelBefore === 'elevated')
const partialObligations = data.obligations.filter((item) => item.supportBefore === 'partial')
const partialInternational = partialObligations.filter((item) => item.frameworkId !== 'fw-internal')

const peopleById = Object.fromEntries(data.people.map((person) => [person.id, person]))

export const organisation = data.organisation
export const currentUser = data.currentUser
export const reportingPeriod = data.reports[0]?.period ?? 'Q3 2026'

export const nav: { id: ModuleId; label: string; badge?: number }[] = [
  { id: 'hub', label: 'Hub' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'controls', label: 'Controls' },
  { id: 'evidence', label: 'Evidence', badge: missingCriticalPack + expired + duplicate + expiring },
  { id: 'risks', label: 'Risks', badge: elevatedRisks.length },
  { id: 'reports', label: 'Reports' },
  { id: 'activity', label: 'Activity' },
]

export const coverageAverage = Math.round(
  internationalFrameworks.reduce((sum, item) => sum + item.coverageBefore, 0) /
    internationalFrameworks.length,
)

export const positionStrip = {
  readinessLabel: before.readinessLabel,
  readinessValue: before.readinessValue,
  frameworkCount: internationalFrameworks.length,
  coverageAverage,
  leadingFramework: [...internationalFrameworks]
    .sort((a, b) => b.coverageBefore - a.coverageBefore)
    .map((item) => ({ name: item.name, coverage: item.coverageBefore }))[0],
  materialGaps: 1,
  materialGap: before.materialGap,
  evidenceHealth: {
    missing: missingCriticalPack,
    expired,
    duplicate,
    expiring,
  },
  frameworks: internationalFrameworks.map((item) => ({
    id: item.id,
    name: item.name,
    coverage: item.coverageBefore,
  })),
}

export const hubGreeting = {
  kicker: 'Executive Hub',
  lede: 'One material gap requires attention before the governance review.',
  reviewPlan: 'View review plan',
}

export const briefing = {
  title: 'Supplier assurance is the highest-impact gap before your review.',
  body: 'The policy is current, but current assessment evidence is missing for several critical suppliers. Closing this gap improves assurance across four international frameworks and reduces two connected risks.',
  confidence: answer.confidence,
  chips: [
    `${internationalFrameworks.length} frameworks affected`,
    `${partialInternational.length} obligations partially assured`,
    `${missingCriticalPack} evidence pack missing`,
  ],
  prompts: data.ai.prompts.hub.slice(0, 3),
}

const omar = peopleById[data.actions[0].ownerId]
const nadia = peopleById['person-nadia']

export const priorityActions = [
  {
    id: data.actions[0].id,
    title: data.actions[0].title,
    owner: `${omar?.name}, ${omar?.role}`,
    due: `Due in ${data.organisation.review.daysRemaining} days`,
    impact: 'High impact',
    primary: true,
  },
  {
    id: 'act-continuity-watch',
    title: 'Review expiring business continuity test report',
    owner: `${nadia?.name}, ${nadia?.role}`,
    due: 'Watch · not the primary action',
    impact: 'Medium',
    primary: false,
  },
  {
    id: 'act-duplicate-pack',
    title: 'Resolve duplicate 2024 supplier questionnaire pack',
    owner: `${omar?.name}, ${omar?.role}`,
    due: 'Flagged in the evidence set',
    impact: 'Medium',
    primary: false,
  },
]

export const mapNodes: {
  id: MapNodeId
  title: string
  detail: string
  status: 'assured' | 'partial' | 'attention'
}[] = [
  {
    id: 'frameworks',
    title: 'Frameworks',
    detail: `${internationalFrameworks.length} in scope`,
    status: 'partial',
  },
  {
    id: 'controls',
    title: 'Controls',
    detail: '1 partially assured',
    status: 'partial',
  },
  {
    id: 'evidence',
    title: 'Evidence',
    detail: `${missingCriticalPack} missing · ${expired} expired`,
    status: 'attention',
  },
  {
    id: 'risks',
    title: 'Risks',
    detail: `${elevatedRisks.length} elevated`,
    status: 'attention',
  },
  {
    id: 'owners',
    title: 'Owners',
    detail: `${omar?.name} accountable`,
    status: 'partial',
  },
]

export const mapCentre = {
  kicker: 'Highest-impact gap',
  title: 'Supplier assurance',
  detail: `${partialInternational.length} obligations · ${internationalFrameworks.length} frameworks`,
}

const sourceIndex: Record<string, { title: string; kind: SourceKind; freshness: string; meta: string }> =
  {}

for (const item of data.evidence) {
  const owner = peopleById[item.ownerId]
  sourceIndex[item.id] = {
    title: item.title,
    kind: 'Evidence',
    freshness: item.freshness,
    meta: `${item.fileType} · ${item.version} · ${owner?.name ?? ''}`,
  }
}
for (const item of data.controls) {
  sourceIndex[item.id] = {
    title: item.title,
    kind: 'Control',
    freshness: item.assuranceBefore,
    meta: item.partialReason ?? 'Supports connected frameworks',
  }
}
for (const item of data.obligations) {
  const framework = data.frameworks.find((entry) => entry.id === item.frameworkId)
  sourceIndex[item.id] = {
    title: item.title,
    kind: 'Obligation',
    freshness: item.supportBefore,
    meta: framework?.name ?? '',
  }
}
for (const item of data.risks) {
  sourceIndex[item.id] = {
    title: item.title,
    kind: 'Risk',
    freshness: item.levelBefore,
    meta: item.contributingGap,
  }
}

export function lookupSource(id: string) {
  return sourceIndex[id] ?? null
}

const connectedTitles = [
  ...answer.connected.obligationIds.map((id) => data.obligations.find((item) => item.id === id)?.title),
  ...answer.connected.controlIds.map((id) => data.controls.find((item) => item.id === id)?.title),
  ...answer.connected.riskIds.map((id) => data.risks.find((item) => item.id === id)?.title),
].filter((item): item is string => Boolean(item))

const sharedAi = {
  recommendedAction: answer.recommendedAction,
  freshness: answer.freshness,
  confidence: answer.confidence,
  owner: omar?.name ?? '',
  approval: 'Human approval required before coverage or risk changes.',
  expectedImpact: answer.expectedImpact,
}

export const hubAi: AiPanelModel & { prompts: string[] } = {
  context: `${answer.screen} · ${data.organisation.name}`,
  question: answer.question,
  executiveAnswer: answer.executiveAnswer,
  facts: answer.sourcedFacts.map((fact) => ({
    text: fact.text,
    citationId: fact.citationIds[0],
  })),
  interpretation: answer.interpretation,
  connected: connectedTitles,
  prompts: data.ai.prompts.hub,
  ...sharedAi,
}

const supplierControl = data.controls.find((item) => item.id === 'ctl-supplier-assurance')
const supplierPolicy = evidenceRecords.find((item) => item.id === 'ev-policy-supplier')
const auditFindings = evidenceRecords.find((item) => item.id === 'ev-audit-findings')
const expiredAssessments = evidenceRecords.find((item) => item.id === 'ev-supplier-assessments-2023')
const duplicatePack = evidenceRecords.find((item) => item.id === 'ev-supplier-q-duplicate')
const layla = peopleById['person-layla']

export const connectedGap = {
  kicker: 'Connected gap',
  title: 'Supplier assurance',
  lede: 'The policy is current, but current assessment evidence is missing for several critical suppliers. That leaves four international obligations only partly covered and keeps the control partial.',
  steps: [
    {
      id: 'policy' as const,
      index: '01',
      kicker: 'Policy',
      title: 'Supplier assurance policy',
      status: 'Current',
      tone: 'assured' as const,
      summary: 'Documented and current. It does not replace assessments.',
    },
    {
      id: 'obligations' as const,
      index: '02',
      kicker: 'Obligations',
      title: 'Four international frameworks',
      status: 'Partial',
      tone: 'partial' as const,
      summary: 'ISO 27001, NIS2, GDPR and NCA ECC share this gap.',
    },
    {
      id: 'control' as const,
      index: '03',
      kicker: 'Control',
      title: 'Supplier assurance',
      status: 'Partial',
      tone: 'partial' as const,
      summary: 'Assured by policy only until current assessments exist.',
    },
    {
      id: 'evidence' as const,
      index: '04',
      kicker: 'Evidence',
      title: 'Current critical-supplier assessments',
      status: 'Missing',
      tone: 'attention' as const,
      summary: 'The 2023 pack is expired and is not acceptable for the review.',
    },
    {
      id: 'risks' as const,
      index: '05',
      kicker: 'Risks',
      title: 'Third-party and regulatory exposure',
      status: 'Elevated',
      tone: 'attention' as const,
      summary: 'The same missing evidence keeps both risks elevated.',
    },
  ],
  details: {
    overview: {
      kicker: 'How this gap is connected',
      title: 'One missing pack sits under four frameworks',
      status: 'Highest-impact gap',
      tone: 'attention' as const,
      body: 'A current supplier-assurance policy sits above four overlapping obligations. The supplier-assurance control stays partial because current assessments are missing. That elevates third-party assurance and regulatory exposure ahead of the review.',
      items: [] as { label: string; title: string; meta: string }[],
    },
    policy: {
      kicker: 'Policy',
      title: supplierPolicy?.title ?? 'Supplier assurance policy',
      status: 'Current',
      tone: 'assured' as const,
      body: 'The documented policy exists and is current. It is reused across the connected obligations, but it does not replace current critical-supplier assessments.',
      items: [
        {
          label: 'Record',
          title: `${supplierPolicy?.fileType} · Version ${supplierPolicy?.version}`,
          meta: omar ? `${omar.name}, ${omar.role}` : '',
        },
      ],
    },
    obligations: {
      kicker: 'Obligations',
      title: 'Overlapping supplier-assurance requirements',
      status: 'Partial',
      tone: 'partial' as const,
      body: 'Each of these obligations is supported by the same policy and the same control. None is fully supported until current assessments are in place.',
      items: partialInternational.map((item) => {
        const framework = data.frameworks.find((entry) => entry.id === item.frameworkId)
        const owner = peopleById[item.ownerId]
        return {
          label: framework?.name ?? '',
          title: item.title,
          meta: owner ? `${owner.name} · Partial` : 'Partial',
        }
      }),
    },
    control: {
      kicker: 'Control',
      title: supplierControl?.title ?? 'Supplier assurance',
      status: 'Partially assured',
      tone: 'partial' as const,
      body: supplierControl?.partialReason ?? 'Policy is current. Current assessments for critical suppliers are missing.',
      items: [
        {
          label: 'Control owner',
          title: nadia ? `${nadia.name}, ${nadia.role}` : 'Information Security Lead',
          meta: 'Accountable for the control, not the missing pack',
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
      title: 'Current critical-supplier assessments',
      status: 'Missing',
      tone: 'attention' as const,
      body: 'Current assessment evidence is missing for several critical suppliers. The expired 2023 pack is not acceptable for the review. A 2024 questionnaire pack is flagged as a duplicate.',
      items: [
        {
          label: 'Present',
          title: supplierPolicy?.title ?? 'Supplier assurance policy',
          meta: 'Current · does not close the gap',
        },
        {
          label: 'Records the gap',
          title: auditFindings?.title ?? 'Internal audit findings',
          meta: 'Current',
        },
        {
          label: 'Not acceptable',
          title: expiredAssessments?.title ?? '2023 critical-supplier assessments',
          meta: 'Expired',
        },
        {
          label: 'Flagged',
          title: duplicatePack?.title ?? '2024 supplier questionnaire pack',
          meta: 'Duplicate',
        },
      ],
    },
    risks: {
      kicker: 'Risks',
      title: 'Connected exposure ahead of the review',
      status: 'Elevated',
      tone: 'attention' as const,
      body: 'Both elevated risks trace to the same missing assessments. Closing the evidence gap is the efficient remediation before the review.',
      items: elevatedRisks.map((item) => {
        const owner = peopleById[item.ownerId]
        return {
          label: 'Elevated',
          title: item.title,
          meta: owner ? `${owner.name} · ${item.contributingGap}` : item.contributingGap,
        }
      }),
    },
  },
  action: {
    kicker: 'Highest-impact action',
    title: data.actions[0].title,
    owner: omar ? `${omar.name}, ${omar.role}` : '',
    approver: layla ? `${layla.name}, ${layla.role}` : '',
    due: `Due in ${data.organisation.review.daysRemaining} days`,
  },
}

export const gapAi: Record<GapStepId, AiPanelModel> = {
  overview: {
    context: `Supplier assurance · ${data.organisation.name}`,
    question: 'Why is supplier assurance only partially assured?',
    executiveAnswer:
      'The control is partial because the policy is current and current assessments for several critical suppliers are missing. That one gap sits under four international frameworks and keeps two connected risks elevated.',
    facts: hubAi.facts,
    interpretation: answer.interpretation,
    connected: connectedTitles,
    ...sharedAi,
  },
  policy: {
    context: `Supplier assurance policy · ${data.organisation.name}`,
    question: 'Does a current policy close this gap?',
    executiveAnswer:
      'No. The supplier assurance policy is current, but it is not a substitute for current critical-supplier assessments.',
    facts: [
      {
        text: 'The supplier assurance policy is current (version 3.0).',
        citationId: 'ev-policy-supplier',
      },
      {
        text: 'Internal audit findings record that current critical-supplier assessments are missing.',
        citationId: 'ev-audit-findings',
      },
    ],
    interpretation:
      'Counting a current policy under each framework makes coverage look stronger than the evidence supports.',
    connected: ['Supplier assurance policy', ...partialInternational.map((item) => item.title), 'Supplier assurance'],
    ...sharedAi,
  },
  obligations: {
    context: `Overlapping obligations · ${data.organisation.name}`,
    question: 'Where do ISO 27001, NIS2, GDPR and NCA ECC overlap?',
    executiveAnswer:
      'All four have a supplier-related obligation that is only partly supported. They share the same policy and the same control.',
    facts: [
      {
        text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.',
        citationId: 'ctl-supplier-assurance',
      },
      {
        text: 'Supplier relationships — information security is only partially supported.',
        citationId: 'obl-iso-a532',
      },
    ],
    interpretation:
      'Because the overlap is the same missing evidence, closing one pack improves all four obligations together.',
    connected: partialInternational.map((item) => item.title),
    ...sharedAi,
  },
  control: {
    context: `Supplier assurance control · ${data.organisation.name}`,
    question: 'Why is this control only partially assured?',
    executiveAnswer:
      supplierControl?.partialReason ??
      'Policy is current. Current assessments for critical suppliers are missing.',
    facts: [
      {
        text: 'Supplier assurance is partially assured.',
        citationId: 'ctl-supplier-assurance',
      },
      {
        text: 'Internal audit findings record that current critical-supplier assessments are missing.',
        citationId: 'ev-audit-findings',
      },
    ],
    interpretation:
      'The control cannot move to assured until current assessments are uploaded and approved.',
    connected: ['Supplier assurance', ...internationalFrameworks.map((item) => item.name)],
    ...sharedAi,
  },
  evidence: {
    context: `Missing assessments · ${data.organisation.name}`,
    question: 'Which evidence is missing or outdated?',
    executiveAnswer:
      'Current critical-supplier assessments are missing. The 2023 pack is expired and is not acceptable for the review. A 2024 questionnaire pack is flagged as a duplicate.',
    facts: [
      {
        text: 'Internal audit findings record that current critical-supplier assessments are missing.',
        citationId: 'ev-audit-findings',
      },
      {
        text: '2023 critical-supplier assessments are expired.',
        citationId: 'ev-supplier-assessments-2023',
      },
      {
        text: 'The 2024 supplier questionnaire pack is a duplicate of an older pack.',
        citationId: 'ev-supplier-q-duplicate',
      },
    ],
    interpretation:
      'Fresh assessments are the missing piece. The current policy and the expired pack do not close the gap.',
    connected: [
      'Supplier assurance policy',
      'Internal audit findings',
      '2023 critical-supplier assessments',
      'Third-party assurance',
    ],
    ...sharedAi,
  },
  risks: {
    context: `Connected risks · ${data.organisation.name}`,
    question: 'Which compliance gaps contribute to this risk?',
    executiveAnswer:
      'Third-party assurance and regulatory exposure are elevated because current assessments are missing. The same gap appears across several frameworks.',
    facts: [
      {
        text: 'Third-party assurance is elevated because current assessments for critical suppliers are missing.',
        citationId: 'risk-third-party',
      },
      {
        text: 'Regulatory exposure ahead of the review is elevated by the same supplier-assurance gap.',
        citationId: 'risk-regulatory',
      },
    ],
    interpretation:
      'Approving current assessments reduces both risks together, rather than remediating them as separate issues.',
    connected: elevatedRisks.map((item) => item.title),
    ...sharedAi,
  },
}


export const moduleCopy: Record<Exclude<ModuleId, 'hub'>, { title: string; body: string }> = {
  regulatory: {
    title: 'Regulatory',
    body: 'Obligations across ISO 27001, NIS2, GDPR, NCA ECC and internal commitments. This module is populated in a later slice.',
  },
  controls: {
    title: 'Controls',
    body: 'Control library and multi-framework support. Supplier assurance is currently partial because assessments are missing.',
  },
  evidence: {
    title: 'Evidence',
    body: 'Catalogue, health and the multi-file upload path. Upload of current critical-supplier assessments comes next in the journey.',
  },
  risks: {
    title: 'Risks',
    body: 'Third-party assurance and regulatory exposure are elevated until current assessments are approved.',
  },
  reports: {
    title: 'Reports',
    body: 'Board Summary will be generated from this shared position. Other report types are listed for the same period.',
  },
  activity: {
    title: 'Activity',
    body: 'Uploads, proposals, approvals and rejections will land here once the evidence path is built.',
  },
}

export function personInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}
