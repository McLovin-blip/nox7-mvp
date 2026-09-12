import {
  data,
  evidenceFor,
  frameworkName,
  organisation,
  personById,
  personLabel,
  reportingPeriod,
  titleOf,
} from '../mock/data.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AppetiteStatus = 'above' | 'near' | 'within'
export type TreatmentStatus = 'completed' | 'in-progress' | 'overdue' | 'not-started' | 'at-risk'
export type CoverageLevel = 'adequate' | 'partial' | 'insufficient'
export type RiskTrend = 'improving' | 'worsening' | 'stable'

export type RiskScore = {
  likelihood: number
  impact: number
  score: number
  rating: string
}

export type RiskAction = {
  id: string
  title: string
  ownerId: string
  owner: string
  dueDate: string
  status: TreatmentStatus
}

export type RiskRecord = {
  id: string
  code: string
  title: string
  category: string
  businessUnit: string
  severity: RiskSeverity
  level: 'elevated' | 'reduced' | 'watch'
  ownerId: string
  owner: string
  ownerRole: string
  cause: string
  event: string
  businessImpact: string
  contributingGap: string
  inherent: RiskScore
  residual: RiskScore
  target: RiskScore
  appetiteStatus: AppetiteStatus
  trend: RiskTrend
  controlCoverage: CoverageLevel
  nextReview: string
  lastAssessment: string
  createdAt: string
  updatedAt: string
  controlIds: string[]
  obligationIds: string[]
  evidenceIds: string[]
  treatment: {
    strategy: string
    ownerId: string
    owner: string
    progress: number
    targetDate: string
    status: TreatmentStatus
    priority: string
    latestUpdate: string
    actions: RiskAction[]
  }
  history: { date: string; text: string }[]
}

export type LinkedControl = {
  id: string
  title: string
  effectiveness: string
  tone: 'assured' | 'partial' | 'attention'
  owner: string
  evidenceStatus: string
  testingStatus: string
}

export type LinkedObligation = {
  id: string
  title: string
  frameworkId: string
  framework: string
  support: string
  tone: 'assured' | 'partial' | 'attention'
}

export type LinkedEvidence = {
  id: string
  title: string
  freshness: string
  tone: 'assured' | 'partial' | 'attention'
  date: string
}

export type RiskFilters = {
  query: string
  severity: 'all' | RiskSeverity
  businessUnit: 'all' | string
  category: 'all' | string
  appetite: 'all' | AppetiteStatus
  treatment: 'all' | TreatmentStatus
  coverage: 'all' | CoverageLevel
  owner: 'all' | string
}

export type RiskSortKey =
  | 'residual'
  | 'severity'
  | 'treatment'
  | 'review'
  | 'businessUnit'
  | 'title'

export type RiskNavigateTarget =
  | { type: 'module'; module: ModuleId; recordId?: string | null }
  | { type: 'risk'; riskId: string | null }

function pick<T>(before: T, after: T, position: PositionState): T {
  return position === 'after' ? after : before
}

function asTreatment(value: string): TreatmentStatus {
  if (
    value === 'completed' ||
    value === 'in-progress' ||
    value === 'overdue' ||
    value === 'not-started' ||
    value === 'at-risk'
  ) {
    return value
  }
  return 'in-progress'
}

function asCoverage(value: string): CoverageLevel {
  if (value === 'adequate' || value === 'partial' || value === 'insufficient') return value
  return 'partial'
}

function asAppetite(value: string): AppetiteStatus {
  if (value === 'above' || value === 'near' || value === 'within') return value
  return 'within'
}

function asSeverity(value: string): RiskSeverity {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}

function asTrend(value: string): RiskTrend {
  if (value === 'improving' || value === 'worsening' || value === 'stable') return value
  return 'stable'
}

export function severityLabel(value: RiskSeverity) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function appetiteLabel(value: AppetiteStatus) {
  if (value === 'above') return 'Above Appetite'
  if (value === 'near') return 'Near Appetite'
  return 'Within Appetite'
}

export function treatmentLabel(value: TreatmentStatus) {
  if (value === 'completed') return 'Completed'
  if (value === 'in-progress') return 'In Progress'
  if (value === 'overdue') return 'Overdue'
  if (value === 'at-risk') return 'At Risk'
  return 'Not Started'
}

export function coverageLabel(value: CoverageLevel) {
  if (value === 'adequate') return 'Adequate'
  if (value === 'partial') return 'Partial'
  return 'Insufficient'
}

export function trendLabel(value: RiskTrend) {
  if (value === 'improving') return 'Improving'
  if (value === 'worsening') return 'Worsening'
  return 'Stable'
}

const severityRank: Record<RiskSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const treatmentRank: Record<TreatmentStatus, number> = {
  overdue: 5,
  'at-risk': 4,
  'in-progress': 3,
  'not-started': 2,
  completed: 1,
}

export function buildRiskRecords(position: PositionState): RiskRecord[] {
  return data.risks.map((item) => {
    const residual = pick(item.residualBefore, item.residualAfter, position)
    const treatment = item.treatment
    return {
      id: item.id,
      code: item.code,
      title: item.title,
      category: item.category,
      businessUnit: item.businessUnit,
      severity: asSeverity(item.severity),
      level: pick(item.levelBefore, item.levelAfter, position) as RiskRecord['level'],
      ownerId: item.ownerId,
      owner: personById(item.ownerId)?.name ?? item.ownerId,
      ownerRole: personById(item.ownerId)?.role ?? '',
      cause: item.cause,
      event: item.event,
      businessImpact: item.businessImpact,
      contributingGap: item.contributingGap,
      inherent: item.inherent,
      residual,
      target: item.target,
      appetiteStatus: asAppetite(pick(item.appetiteStatusBefore, item.appetiteStatusAfter, position)),
      trend: asTrend(pick(item.trendBefore, item.trendAfter, position)),
      controlCoverage: asCoverage(pick(item.controlCoverageBefore, item.controlCoverageAfter, position)),
      nextReview: item.nextReview,
      lastAssessment: item.lastAssessment,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      controlIds: item.controlIds,
      obligationIds: item.obligationIds,
      evidenceIds: pick(item.evidenceIdsBefore, item.evidenceIdsAfter, position),
      treatment: {
        strategy: treatment.strategy,
        ownerId: treatment.ownerId,
        owner: personById(treatment.ownerId)?.name ?? treatment.ownerId,
        progress: pick(treatment.progressBefore, treatment.progressAfter, position),
        targetDate: treatment.targetDate,
        status: asTreatment(pick(treatment.statusBefore, treatment.statusAfter, position)),
        priority: treatment.priority,
        latestUpdate: pick(treatment.latestUpdateBefore, treatment.latestUpdateAfter, position),
        actions: treatment.actions.map((action) => ({
          id: action.id,
          title: action.title,
          ownerId: action.ownerId,
          owner: personById(action.ownerId)?.name ?? action.ownerId,
          dueDate: action.dueDate,
          status: asTreatment(pick(action.statusBefore, action.statusAfter, position)),
        })),
      },
      history: item.history.map((entry) => ({
        date: entry.date,
        text: pick(entry.textBefore, entry.textAfter, position),
      })),
    }
  })
}

export function rankRisk(risk: RiskRecord) {
  let score = risk.residual.score
  score += severityRank[risk.severity] * 8
  if (risk.appetiteStatus === 'above') score += 18
  else if (risk.appetiteStatus === 'near') score += 8
  if (risk.controlCoverage === 'insufficient') score += 14
  else if (risk.controlCoverage === 'partial') score += 8
  score += treatmentRank[risk.treatment.status] * 4
  if (risk.treatment.actions.some((action) => action.status === 'overdue')) score += 10
  score += Math.min(12, risk.obligationIds.length * 3)
  if (risk.trend === 'worsening') score += 8
  return score
}

export function buildRiskSummary(risks: RiskRecord[]) {
  const total = risks.length
  const critical = risks.filter((item) => item.severity === 'critical')
  const high = risks.filter((item) => item.severity === 'high')
  const above = risks.filter((item) => item.appetiteStatus === 'above')
  const treatmentActive = risks.filter((item) => item.treatment.status !== 'not-started')
  const treatmentOverdue = risks.filter((item) => item.treatment.status === 'overdue' || item.treatment.status === 'at-risk')
  const treatmentProgress =
    total === 0 ? 0 : Math.round(risks.reduce((sum, item) => sum + item.treatment.progress, 0) / total)

  const byUnit = Object.entries(
    risks.reduce<Record<string, number>>((acc, item) => {
      acc[item.businessUnit] = (acc[item.businessUnit] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const byCategory = Object.entries(
    risks.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const priority = risks.filter((item) => item.severity === 'critical' || item.severity === 'high')
  const coveragePool = priority.length ? priority : risks
  const adequate = coveragePool.filter((item) => item.controlCoverage === 'adequate').length
  const partial = coveragePool.filter((item) => item.controlCoverage === 'partial').length
  const insufficient = coveragePool.filter((item) => item.controlCoverage === 'insufficient').length
  const coveragePct = coveragePool.length ? Math.round((adequate / coveragePool.length) * 100) : 0

  const complianceRisks = risks.filter((item) => item.obligationIds.length > 0)
  const frameworkCounts = new Map<string, number>()
  for (const risk of complianceRisks) {
    for (const obligationId of risk.obligationIds) {
      const obligation = data.obligations.find((item) => item.id === obligationId)
      if (!obligation) continue
      const name = frameworkName(obligation.frameworkId)
      frameworkCounts.set(name, (frameworkCounts.get(name) ?? 0) + 1)
    }
  }

  return {
    organisationName: organisation.name,
    reportingPeriod,
    reviewName: organisation.review.name,
    total,
    criticalCount: critical.length,
    highCount: high.length,
    aboveCount: above.length,
    aboveCritical: above.filter((item) => item.severity === 'critical').length,
    aboveHigh: above.filter((item) => item.severity === 'high').length,
    treatmentProgress,
    treatmentActive: treatmentActive.length,
    treatmentOverdue: treatmentOverdue.length,
    byUnit,
    byCategory,
    coveragePct,
    coveragePoolSize: coveragePool.length,
    adequate,
    partial,
    insufficient,
    complianceCount: complianceRisks.length,
    frameworks: [...frameworkCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    emerging: risks
      .filter((item) => item.trend === 'worsening' || item.treatment.status === 'overdue' || item.appetiteStatus === 'above')
      .sort((a, b) => rankRisk(b) - rankRisk(a))
      .slice(0, 5),
    topRisks: [...risks].sort((a, b) => rankRisk(b) - rankRisk(a)).slice(0, 10),
  }
}

export type RiskSummary = ReturnType<typeof buildRiskSummary>

export function linkedControlsFor(risk: RiskRecord, position: PositionState): LinkedControl[] {
  return risk.controlIds.map((id) => {
    const control = data.controls.find((item) => item.id === id)
    if (!control) {
      return {
        id,
        title: id,
        effectiveness: 'Unknown',
        tone: 'partial',
        owner: '',
        evidenceStatus: 'Unknown',
        testingStatus: 'Unknown',
      }
    }
    const assurance = position === 'after' ? control.assuranceAfter : control.assuranceBefore
    const evidenceIds = position === 'after' ? control.evidenceIdsAfter : control.evidenceIdsBefore
    const catalogue = evidenceFor(position)
    const missing = evidenceIds.some((evidenceId) => !catalogue.some((item) => item.id === evidenceId))
    const expired = evidenceIds.some((evidenceId) => catalogue.find((item) => item.id === evidenceId)?.freshness === 'expired')
    return {
      id,
      title: control.title,
      effectiveness: assurance === 'assured' ? 'Effective' : 'Partially effective',
      tone: assurance === 'assured' ? 'assured' : 'partial',
      owner: personLabel(control.ownerId),
      evidenceStatus: missing ? 'Evidence missing' : expired ? 'Evidence expired' : evidenceIds.length ? 'Evidence current' : 'No evidence linked',
      testingStatus: assurance === 'assured' ? 'Testing current' : 'Testing due',
    }
  })
}

export function linkedObligationsFor(risk: RiskRecord, position: PositionState): LinkedObligation[] {
  return risk.obligationIds.map((id) => {
    const obligation = data.obligations.find((item) => item.id === id)
    if (!obligation) {
      return {
        id,
        title: id,
        frameworkId: '',
        framework: '',
        support: 'Unknown',
        tone: 'partial',
      }
    }
    const support = position === 'after' ? obligation.supportAfter : obligation.supportBefore
    return {
      id,
      title: obligation.title,
      frameworkId: obligation.frameworkId,
      framework: frameworkName(obligation.frameworkId),
      support: support === 'supported' ? 'Supported' : 'Partial',
      tone: support === 'supported' ? 'assured' : 'partial',
    }
  })
}

export function linkedEvidenceFor(risk: RiskRecord, position: PositionState): LinkedEvidence[] {
  const catalogue = evidenceFor(position)
  const ids = new Set(risk.evidenceIds)
  for (const controlId of risk.controlIds) {
    const control = data.controls.find((item) => item.id === controlId)
    if (!control) continue
    for (const evidenceId of position === 'after' ? control.evidenceIdsAfter : control.evidenceIdsBefore) {
      ids.add(evidenceId)
    }
  }

  return [...ids].map((id) => {
    const evidence = catalogue.find((item) => item.id === id) ?? data.evidence.find((item) => item.id === id)
    if (!evidence) {
      return {
        id,
        title: titleOf(data.evidence, id),
        freshness: 'Missing',
        tone: 'attention',
        date: '',
      }
    }
    const hidden = 'availableFromState' in evidence && evidence.availableFromState === 'after' && position !== 'after'
    if (hidden) {
      return {
        id,
        title: evidence.title,
        freshness: 'Missing',
        tone: 'attention',
        date: evidence.date,
      }
    }
    const superseded = position === 'after' && evidence.id === 'ev-supplier-assessments-2023'
    const freshness = superseded
      ? 'Superseded'
      : evidence.freshness === 'expired'
        ? 'Expired'
        : evidence.freshness === 'expiring'
          ? 'Expiring'
          : 'Current'
    return {
      id,
      title: evidence.title,
      freshness,
      tone: freshness === 'Current' ? 'assured' : freshness === 'Expiring' || freshness === 'Superseded' ? 'partial' : 'attention',
      date: evidence.date,
    }
  })
}

export function filterRisks(risks: RiskRecord[], filters: RiskFilters) {
  const query = filters.query.trim().toLowerCase()
  return risks.filter((item) => {
    if (filters.severity !== 'all' && item.severity !== filters.severity) return false
    if (filters.businessUnit !== 'all' && item.businessUnit !== filters.businessUnit) return false
    if (filters.category !== 'all' && item.category !== filters.category) return false
    if (filters.appetite !== 'all' && item.appetiteStatus !== filters.appetite) return false
    if (filters.treatment !== 'all' && item.treatment.status !== filters.treatment) return false
    if (filters.coverage !== 'all' && item.controlCoverage !== filters.coverage) return false
    if (filters.owner !== 'all' && item.owner !== filters.owner) return false
    if (!query) return true
    return [item.title, item.code, item.businessUnit, item.category, item.owner].some((value) =>
      value.toLowerCase().includes(query),
    )
  })
}

export function sortRisks(risks: RiskRecord[], sortKey: RiskSortKey, direction: 'asc' | 'desc') {
  return [...risks].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'residual') cmp = a.residual.score - b.residual.score
    else if (sortKey === 'severity') cmp = severityRank[a.severity] - severityRank[b.severity]
    else if (sortKey === 'treatment') cmp = treatmentRank[a.treatment.status] - treatmentRank[b.treatment.status]
    else if (sortKey === 'review') cmp = a.nextReview.localeCompare(b.nextReview)
    else if (sortKey === 'businessUnit') cmp = a.businessUnit.localeCompare(b.businessUnit)
    else cmp = a.title.localeCompare(b.title)
    return direction === 'asc' ? cmp : -cmp
  })
}

export function defaultFilters(): RiskFilters {
  return {
    query: '',
    severity: 'all',
    businessUnit: 'all',
    category: 'all',
    appetite: 'all',
    treatment: 'all',
    coverage: 'all',
    owner: 'all',
  }
}

export function riskContextIntro(risk: RiskRecord) {
  const pressure: string[] = []
  if (risk.appetiteStatus === 'above') pressure.push('it is above appetite')
  if (risk.controlCoverage !== 'adequate') pressure.push(`control coverage is ${coverageLabel(risk.controlCoverage).toLowerCase()}`)
  if (risk.treatment.status === 'overdue' || risk.treatment.status === 'at-risk') {
    pressure.push('treatment is behind schedule')
  } else if (risk.treatment.actions.some((action) => action.status === 'overdue')) {
    pressure.push('one or more treatment actions are overdue')
  }
  if (!pressure.length) {
    return `You're reviewing ${risk.title}. Residual risk is ${risk.residual.score} (${risk.residual.rating}).`
  }
  return `You're reviewing ${risk.title}. This risk needs attention because ${pressure.join(' and ')}.`
}
