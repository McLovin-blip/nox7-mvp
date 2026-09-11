import organisationJson from '../../../docs/mock/meridian-organisation.json' with { type: 'json' }
import type { MapNodeId, ModuleId, SourceKind } from './types.ts'

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

export const hubAi = {
  context: `${answer.screen} · ${data.organisation.name}`,
  question: answer.question,
  executiveAnswer: answer.executiveAnswer,
  facts: answer.sourcedFacts.map((fact) => ({
    text: fact.text,
    citationId: fact.citationIds[0],
  })),
  interpretation: answer.interpretation,
  recommendedAction: answer.recommendedAction,
  connected: [
    ...answer.connected.obligationIds.map((id) => data.obligations.find((item) => item.id === id)?.title),
    ...answer.connected.controlIds.map((id) => data.controls.find((item) => item.id === id)?.title),
    ...answer.connected.riskIds.map((id) => data.risks.find((item) => item.id === id)?.title),
  ].filter((item): item is string => Boolean(item)),
  freshness: answer.freshness,
  confidence: answer.confidence,
  owner: omar?.name ?? '',
  approval: 'Human approval required before coverage or risk changes.',
  expectedImpact: answer.expectedImpact,
  prompts: data.ai.prompts.hub,
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
