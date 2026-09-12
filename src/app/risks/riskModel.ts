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
  treatment: 'all' | TreatmentStatus | 'active'
  coverage: 'all' | CoverageLevel
  owner: 'all' | string
  framework: 'all' | string
  trend: 'all' | RiskTrend
  /** When true, restrict to critical and high severity (control-coverage pool). */
  priorityOnly: boolean
}

export type FilterChip = {
  key: keyof RiskFilters | 'priorityOnly'
  label: string
  valueLabel: string
}

export type FrameworkImpact = {
  name: string
  frameworkId: string
  linkedRisks: RiskRecord[]
  relatedControlIds: string[]
  obligationIds: string[]
  obligationsWithGaps: number
  missingEvidenceCount: number
  chains: ComplianceChain[]
}

export type ComplianceChain = {
  riskId: string
  riskTitle: string
  controlId: string
  controlTitle: string
  obligationId: string
  obligationTitle: string
  evidenceId: string
  evidenceTitle: string
  evidenceStatus: string
}

export type CoverageRow = {
  risk: RiskRecord
  linkedControls: number
  coverage: CoverageLevel
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
  const treatmentOverdue = risks.filter((item) => item.treatment.status === 'overdue')
  const treatmentAtRisk = risks.filter((item) => item.treatment.status === 'at-risk')
  const treatmentInProgress = risks.filter((item) => item.treatment.status === 'in-progress')
  const treatmentCompleted = risks.filter((item) => item.treatment.status === 'completed')
  const treatmentNotStarted = risks.filter((item) => item.treatment.status === 'not-started')
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
  const frameworkRiskIds = new Map<string, { frameworkId: string; riskIds: Set<string> }>()
  for (const risk of complianceRisks) {
    for (const obligationId of risk.obligationIds) {
      const obligation = data.obligations.find((item) => item.id === obligationId)
      if (!obligation) continue
      const name = frameworkName(obligation.frameworkId)
      const existing = frameworkRiskIds.get(name)
      if (existing) existing.riskIds.add(risk.id)
      else frameworkRiskIds.set(name, { frameworkId: obligation.frameworkId, riskIds: new Set([risk.id]) })
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
    treatmentAtRisk: treatmentAtRisk.length,
    treatmentInProgress: treatmentInProgress.length,
    treatmentCompleted: treatmentCompleted.length,
    treatmentNotStarted: treatmentNotStarted.length,
    byUnit,
    byCategory,
    coveragePct,
    coveragePoolSize: coveragePool.length,
    coveragePool,
    adequate,
    partial,
    insufficient,
    complianceCount: complianceRisks.length,
    frameworks: [...frameworkRiskIds.entries()]
      .map(([name, value]) => ({
        name,
        frameworkId: value.frameworkId,
        count: value.riskIds.size,
      }))
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

export function riskTouchesFramework(risk: RiskRecord, frameworkNameOrId: string) {
  return risk.obligationIds.some((obligationId) => {
    const obligation = data.obligations.find((item) => item.id === obligationId)
    if (!obligation) return false
    return (
      obligation.frameworkId === frameworkNameOrId ||
      frameworkName(obligation.frameworkId) === frameworkNameOrId
    )
  })
}

export function filterRisks(risks: RiskRecord[], filters: RiskFilters) {
  const query = filters.query.trim().toLowerCase()
  return risks.filter((item) => {
    if (filters.priorityOnly && item.severity !== 'critical' && item.severity !== 'high') return false
    if (filters.severity !== 'all' && item.severity !== filters.severity) return false
    if (filters.businessUnit !== 'all' && item.businessUnit !== filters.businessUnit) return false
    if (filters.category !== 'all' && item.category !== filters.category) return false
    if (filters.appetite !== 'all' && item.appetiteStatus !== filters.appetite) return false
    if (filters.treatment === 'active') {
      if (item.treatment.status === 'not-started') return false
    } else if (filters.treatment !== 'all' && item.treatment.status !== filters.treatment) {
      return false
    }
    if (filters.coverage !== 'all' && item.controlCoverage !== filters.coverage) return false
    if (filters.owner !== 'all' && item.owner !== filters.owner) return false
    if (filters.framework !== 'all' && !riskTouchesFramework(item, filters.framework)) return false
    if (filters.trend !== 'all' && item.trend !== filters.trend) return false
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
    framework: 'all',
    trend: 'all',
    priorityOnly: false,
  }
}

export function hasActiveFilters(filters: RiskFilters) {
  const defaults = defaultFilters()
  return (Object.keys(defaults) as (keyof RiskFilters)[]).some((key) => filters[key] !== defaults[key])
}

export function activeFilterChips(filters: RiskFilters): FilterChip[] {
  const chips: FilterChip[] = []
  if (filters.priorityOnly) {
    chips.push({ key: 'priorityOnly', label: 'Priority', valueLabel: 'Critical & High' })
  }
  if (filters.severity !== 'all') {
    chips.push({ key: 'severity', label: 'Severity', valueLabel: severityLabel(filters.severity) })
  }
  if (filters.businessUnit !== 'all') {
    chips.push({ key: 'businessUnit', label: 'Business Unit', valueLabel: filters.businessUnit })
  }
  if (filters.category !== 'all') {
    chips.push({ key: 'category', label: 'Category', valueLabel: filters.category })
  }
  if (filters.appetite !== 'all') {
    chips.push({ key: 'appetite', label: 'Appetite', valueLabel: appetiteLabel(filters.appetite) })
  }
  if (filters.treatment === 'active') {
    chips.push({ key: 'treatment', label: 'Treatment', valueLabel: 'Active' })
  } else if (filters.treatment !== 'all') {
    chips.push({ key: 'treatment', label: 'Treatment Status', valueLabel: treatmentLabel(filters.treatment) })
  }
  if (filters.coverage !== 'all') {
    chips.push({ key: 'coverage', label: 'Control Coverage', valueLabel: coverageLabel(filters.coverage) })
  }
  if (filters.framework !== 'all') {
    chips.push({ key: 'framework', label: 'Framework', valueLabel: filters.framework })
  }
  if (filters.trend !== 'all') {
    chips.push({ key: 'trend', label: 'Trend', valueLabel: trendLabel(filters.trend) })
  }
  if (filters.owner !== 'all') {
    chips.push({ key: 'owner', label: 'Owner', valueLabel: filters.owner })
  }
  if (filters.query.trim()) {
    chips.push({ key: 'query', label: 'Search', valueLabel: filters.query.trim() })
  }
  return chips
}

export function clearFilterChip(filters: RiskFilters, key: FilterChip['key']): RiskFilters {
  if (key === 'priorityOnly') return { ...filters, priorityOnly: false }
  if (key === 'query') return { ...filters, query: '' }
  if (key === 'severity') return { ...filters, severity: 'all' }
  if (key === 'businessUnit') return { ...filters, businessUnit: 'all' }
  if (key === 'category') return { ...filters, category: 'all' }
  if (key === 'appetite') return { ...filters, appetite: 'all' }
  if (key === 'treatment') return { ...filters, treatment: 'all' }
  if (key === 'coverage') return { ...filters, coverage: 'all' }
  if (key === 'framework') return { ...filters, framework: 'all' }
  if (key === 'trend') return { ...filters, trend: 'all' }
  if (key === 'owner') return { ...filters, owner: 'all' }
  return filters
}

export function describeRiskDrill(filters: RiskFilters): { label: string; questions: string[]; askPrompt: string } | null {
  if (!hasActiveFilters(filters)) return null
  if (filters.framework !== 'all') {
    return {
      label: `Risks affecting ${filters.framework}`,
      askPrompt: `Ask Nox about ${filters.framework} exposure`,
      questions: [
        `Which risks have the largest ${filters.framework} impact?`,
        'Which controls are causing the gaps?',
        'What evidence is missing?',
        'What should we fix first?',
      ],
    }
  }
  if (filters.businessUnit !== 'all') {
    return {
      label: `Risk exposure filtered to ${filters.businessUnit}`,
      askPrompt: `Ask Nox about ${filters.businessUnit} risks`,
      questions: [
        `Why does ${filters.businessUnit} have the highest exposure?`,
        `Which ${filters.businessUnit} risk is most urgent?`,
        'Which controls are weak?',
        'What compliance obligations are affected?',
      ],
    }
  }
  if (filters.category !== 'all') {
    return {
      label: `${filters.category} risks`,
      askPrompt: `Ask Nox about ${filters.category} risks`,
      questions: [
        `Why are ${filters.category} risks elevated?`,
        'Which of these risks should we address first?',
        'Which controls are weak?',
        'What compliance obligations are affected?',
      ],
    }
  }
  if (filters.severity !== 'all') {
    const label = `${severityLabel(filters.severity)} risks`
    return {
      label,
      askPrompt: `Ask Nox about ${label}`,
      questions: [
        `Why are these risks ${severityLabel(filters.severity)}?`,
        `Which ${severityLabel(filters.severity)} risk should I address first?`,
        `Which ${severityLabel(filters.severity)} risks are above appetite?`,
        `Which ${severityLabel(filters.severity)} risks have weak controls?`,
        'What actions are overdue?',
      ],
    }
  }
  if (filters.coverage !== 'all' || filters.priorityOnly) {
    return {
      label: filters.coverage !== 'all' ? `${coverageLabel(filters.coverage)} control coverage` : 'Control coverage on priority risks',
      askPrompt: 'Ask Nox why coverage is weak',
      questions: [
        'Why is control coverage weak on priority risks?',
        'Which controls are causing the gaps?',
        'Which risk should we remediate first?',
        'What evidence is missing?',
      ],
    }
  }
  if (filters.appetite !== 'all') {
    return {
      label: appetiteLabel(filters.appetite),
      askPrompt: `Ask Nox about risks ${appetiteLabel(filters.appetite).toLowerCase()}`,
      questions: [
        'Which above-appetite risk is most urgent?',
        'Why are these risks outside appetite?',
        'Which treatments are overdue?',
        'What should leadership prioritise?',
      ],
    }
  }
  if (filters.treatment !== 'all') {
    const label =
      filters.treatment === 'active' ? 'Active treatments' : `${treatmentLabel(filters.treatment)} treatments`
    return {
      label,
      askPrompt: `Ask Nox about ${label.toLowerCase()}`,
      questions: [
        'Which treatment is most overdue?',
        'Who owns the delayed actions?',
        'Which risks are blocked by treatment progress?',
        'What should we complete first?',
      ],
    }
  }
  if (filters.trend !== 'all') {
    return {
      label: `${trendLabel(filters.trend)} risks`,
      askPrompt: `Ask Nox about ${trendLabel(filters.trend).toLowerCase()} risks`,
      questions: [
        'Why are these risks worsening?',
        'Which changing risk needs attention first?',
        'What controls are failing?',
        'What changed recently?',
      ],
    }
  }
  const chips = activeFilterChips(filters)
  if (!chips.length) return null
  return {
    label: chips.map((chip) => `${chip.label}: ${chip.valueLabel}`).join(' · '),
    askPrompt: 'Ask Nox about this filtered risk set',
    questions: [
      'Which of these risks is most urgent?',
      'Which controls are weak?',
      'What compliance obligations are affected?',
      'What should we do next?',
    ],
  }
}

export function coverageRowsFor(risks: RiskRecord[]): CoverageRow[] {
  const priority = risks.filter((item) => item.severity === 'critical' || item.severity === 'high')
  const pool = priority.length ? priority : risks
  return pool.map((risk) => ({
    risk,
    linkedControls: risk.controlIds.length,
    coverage: risk.controlCoverage,
  }))
}

export function buildFrameworkImpact(
  risks: RiskRecord[],
  frameworkNameOrId: string,
  position: PositionState,
): FrameworkImpact | null {
  const linkedRisks = risks.filter((item) => riskTouchesFramework(item, frameworkNameOrId))
  if (!linkedRisks.length) return null

  const frameworkId =
    data.frameworks.find((item) => item.name === frameworkNameOrId || item.id === frameworkNameOrId)?.id ??
    linkedRisks.flatMap((risk) => risk.obligationIds)
      .map((id) => data.obligations.find((item) => item.id === id)?.frameworkId)
      .find(Boolean) ??
    ''

  const name = frameworkId ? frameworkName(frameworkId) : frameworkNameOrId
  const relatedControlIds = new Set<string>()
  const obligationIds = new Set<string>()
  let obligationsWithGaps = 0
  let missingEvidenceCount = 0
  const chains: ComplianceChain[] = []
  const catalogue = evidenceFor(position)

  for (const risk of linkedRisks) {
    for (const controlId of risk.controlIds) relatedControlIds.add(controlId)
    for (const obligationId of risk.obligationIds) {
      const obligation = data.obligations.find((item) => item.id === obligationId)
      if (!obligation) continue
      if (obligation.frameworkId !== frameworkId && frameworkName(obligation.frameworkId) !== name) continue
      obligationIds.add(obligation.id)
      const support = position === 'after' ? obligation.supportAfter : obligation.supportBefore
      if (support !== 'supported') obligationsWithGaps += 1

      const controlId = obligation.controlIds[0] ?? risk.controlIds[0]
      const control = controlId ? data.controls.find((item) => item.id === controlId) : undefined
      const evidenceIds = control
        ? position === 'after'
          ? control.evidenceIdsAfter
          : control.evidenceIdsBefore
        : risk.evidenceIds
      const evidenceId = evidenceIds[0] ?? risk.evidenceIds[0] ?? 'missing-evidence'
      const evidence = catalogue.find((item) => item.id === evidenceId) ?? data.evidence.find((item) => item.id === evidenceId)
      const hidden = evidence && 'availableFromState' in evidence && evidence.availableFromState === 'after' && position !== 'after'
      const evidenceStatus = !evidence || hidden ? 'Missing' : evidence.freshness === 'expired' ? 'Expired' : evidence.freshness === 'expiring' ? 'Expiring' : 'Current'
      if (evidenceStatus === 'Missing' || evidenceStatus === 'Expired') missingEvidenceCount += 1

      if (chains.length < 6) {
        chains.push({
          riskId: risk.id,
          riskTitle: risk.title,
          controlId: control?.id ?? controlId ?? '',
          controlTitle: control?.title ?? 'Unlinked control',
          obligationId: obligation.id,
          obligationTitle: obligation.title,
          evidenceId: evidence?.id ?? evidenceId,
          evidenceTitle: evidence?.title ?? 'Evidence not linked',
          evidenceStatus,
        })
      }
    }
  }

  return {
    name,
    frameworkId,
    linkedRisks,
    relatedControlIds: [...relatedControlIds],
    obligationIds: [...obligationIds],
    obligationsWithGaps,
    missingEvidenceCount,
    chains,
  }
}

export function emptyStateForFilters(filters: RiskFilters, allRisks: RiskRecord[]) {
  if (filters.coverage === 'adequate' && filters.priorityOnly) {
    const weak = allRisks.filter(
      (item) =>
        (item.severity === 'critical' || item.severity === 'high') && item.controlCoverage !== 'adequate',
    ).length
    return {
      title: 'No risks currently have adequate control coverage.',
      detail: `${weak} critical/high risk${weak === 1 ? '' : 's'} currently have either partial or insufficient coverage.`,
      actionLabel: 'Review weak control coverage',
      actionFilters: { ...defaultFilters(), priorityOnly: true } satisfies RiskFilters,
    }
  }
  if (filters.coverage !== 'all') {
    return {
      title: `No risks currently have ${coverageLabel(filters.coverage).toLowerCase()} control coverage.`,
      detail: 'Try another coverage state or clear the active filters.',
      actionLabel: 'Clear coverage filter',
      actionFilters: { ...filters, coverage: 'all' } satisfies RiskFilters,
    }
  }
  return {
    title: 'No risks match the current filters.',
    detail: 'Clear one or more filters to widen the register view.',
    actionLabel: 'Clear all filters',
    actionFilters: defaultFilters(),
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
