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

export type ControlType = 'preventive' | 'detective' | 'corrective' | 'directive'
export type ExecutionMethod = 'manual' | 'automated' | 'hybrid'
export type ControlFrequency = 'continuous' | 'daily' | 'monthly' | 'quarterly' | 'annual' | 'event-driven'
export type AssuranceStatus = 'effective' | 'partially-assured' | 'unverifiable' | 'ineffective' | 'not-assessed'
export type EffectivenessRating = 'effective' | 'partially-effective' | 'ineffective' | 'not-assessed'
export type EvidenceHealth = 'current' | 'expiring' | 'missing' | 'conflicting' | 'awaiting-approval' | 'not-required'
export type EvidenceSufficiency = 'sufficient' | 'partial' | 'insufficient' | 'not-required'
export type ChangeDirection = 'improving' | 'stable' | 'weakening'
export type RiskProtection = 'adequate' | 'partial' | 'insufficient' | 'unverified'

export type ControlCategory = {
  id: string
  name: string
  shortLabel: string
  accountableFunction: string
  accountableExecutiveId: string
  accountableExecutive: string
  sortOrder: number
}

export type ControlAction = {
  id: string
  title: string
  ownerId: string
  owner: string
  dueDate: string
  status: string
}

export type ControlRecord = {
  id: string
  title: string
  categoryId: string
  categoryName: string
  categoryShort: string
  businessUnit: string
  type: ControlType
  execution: ExecutionMethod
  frequency: ControlFrequency
  ownerId: string
  owner: string
  ownerRole: string
  accountableExecutiveId: string
  accountableExecutive: string
  design: EffectivenessRating
  operating: EffectivenessRating
  evidenceSufficiency: EvidenceSufficiency
  overall: AssuranceStatus
  evidenceHealth: EvidenceHealth
  priorOverall: AssuranceStatus
  lastAssessed: string
  nextAssessment: string
  nextAction: string
  dueDate: string
  why: string
  whatChanged: string
  mappingLabels: string[]
  frameworkIds: string[]
  obligationIds: string[]
  riskIds: string[]
  evidenceIds: string[]
  testingHistory: { date: string; result: string; assessor: string }[]
  openActions: ControlAction[]
  sessionAdded?: boolean
}

export type CategorySummary = ControlCategory & {
  controlCount: number
  effective: number
  partiallyAssured: number
  unverifiable: number
  ineffective: number
  notAssessed: number
  evidenceCoverage: number
  connectedRisks: number
  connectedObligations: number
  direction: ChangeDirection
}

export type ControlFilters = {
  query: string
  categoryId: string
  assurance: 'all' | AssuranceStatus
  frameworkId: string
  businessUnit: string
  riskId: string
  evidenceHealth: 'all' | EvidenceHealth | 'no-owner'
  ownerId: string
  type: 'all' | ControlType
  execution: 'all' | ExecutionMethod
  assessed: 'all' | 'last-90' | 'older-90' | 'overdue'
}

export type FilterChip = { key: keyof ControlFilters; label: string; valueLabel: string }

export type ControlIndicator = {
  id: 'total' | 'effective' | 'partial' | 'unverifiable' | 'coverage'
  label: string
  value: string
  context: string
  change: string
  direction: ChangeDirection
  filter: Partial<ControlFilters>
}

export type ControlBriefing = {
  title: string
  attention: string
  why: string
  facts: { id: string; text: string; citationId: string }[]
  interpretation: string
  confidence: string
  freshness: string
  recommendedAction: string
  owner: string
  due: string
  approval: string
  askPrompt: string
  sources: { id: string; kind: string; title: string }[]
}

export type EvidenceDependency = {
  id: string
  controlId: string
  controlTitle: string
  evidenceId: string | null
  evidenceTitle: string
  health: EvidenceHealth | 'no-owner'
  owner: string
  detail: string
}

export type ProtectedRisk = {
  id: string
  title: string
  severity: string
  businessUnit: string
  owner: string
  protection: RiskProtection
  controlIds: string[]
  controlTitles: string[]
  evidenceIds: string[]
  obligationIds: string[]
  frameworkIds: string[]
}

export type LeverageRow = {
  control: ControlRecord
  frameworkCount: number
  obligationCount: number
  reuse: string
  impact: string
}

export type ControlNavigateTarget =
  | { type: 'module'; module: ModuleId; recordId?: string | null }
  | { type: 'control'; controlId: string | null }
  | { type: 'upload' }

export const TODAY = '2026-09-12'

const FALLBACK_CATEGORIES: ControlCategory[] = [
  {
    id: 'cat-cybersecurity',
    name: 'Cybersecurity',
    shortLabel: 'Cybersecurity',
    accountableFunction: 'Information Security',
    accountableExecutiveId: 'person-nadia',
    accountableExecutive: personLabel('person-nadia'),
    sortOrder: 1,
  },
]

function pick<T>(before: T, after: T, position: PositionState): T {
  return position === 'after' ? after : before
}

function asAssurance(value: string | undefined, fallback: AssuranceStatus): AssuranceStatus {
  if (
    value === 'effective' ||
    value === 'partially-assured' ||
    value === 'unverifiable' ||
    value === 'ineffective' ||
    value === 'not-assessed'
  ) {
    return value
  }
  if (value === 'assured') return 'effective'
  if (value === 'partial') return 'partially-assured'
  return fallback
}

function asEffectiveness(value: string | undefined, fallback: EffectivenessRating): EffectivenessRating {
  if (value === 'effective' || value === 'partially-effective' || value === 'ineffective' || value === 'not-assessed') {
    return value
  }
  return fallback
}

function asHealth(value: string | undefined, fallback: EvidenceHealth): EvidenceHealth {
  if (
    value === 'current' ||
    value === 'expiring' ||
    value === 'missing' ||
    value === 'conflicting' ||
    value === 'awaiting-approval' ||
    value === 'not-required'
  ) {
    return value
  }
  return fallback
}

function asType(value: string | undefined): ControlType {
  if (value === 'preventive' || value === 'detective' || value === 'corrective' || value === 'directive') return value
  return 'detective'
}

function asExecution(value: string | undefined): ExecutionMethod {
  if (value === 'manual' || value === 'automated' || value === 'hybrid') return value
  return 'hybrid'
}

function asFrequency(value: string | undefined): ControlFrequency {
  if (
    value === 'continuous' ||
    value === 'daily' ||
    value === 'monthly' ||
    value === 'quarterly' ||
    value === 'annual' ||
    value === 'event-driven'
  ) {
    return value
  }
  return 'annual'
}

export function controlCategories(): ControlCategory[] {
  const raw = 'controlCategories' in data ? data.controlCategories : FALLBACK_CATEGORIES
  return [...raw]
    .map((item) => ({
      id: item.id,
      name: item.name,
      shortLabel: item.shortLabel,
      accountableFunction: item.accountableFunction,
      accountableExecutiveId: item.accountableExecutiveId,
      accountableExecutive: personLabel(item.accountableExecutiveId),
      sortOrder: item.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function categoryById(id: string) {
  return controlCategories().find((item) => item.id === id) ?? null
}

export function defaultFilters(): ControlFilters {
  return {
    query: '',
    categoryId: 'all',
    assurance: 'all',
    frameworkId: 'all',
    businessUnit: 'all',
    riskId: 'all',
    evidenceHealth: 'all',
    ownerId: 'all',
    type: 'all',
    execution: 'all',
    assessed: 'all',
  }
}

export function assuranceLabel(value: AssuranceStatus) {
  if (value === 'effective') return 'Effective'
  if (value === 'partially-assured') return 'Partially assured'
  if (value === 'unverifiable') return 'Unverifiable'
  if (value === 'ineffective') return 'Ineffective'
  return 'Not assessed'
}

export function effectivenessLabel(value: EffectivenessRating) {
  if (value === 'effective') return 'Effective'
  if (value === 'partially-effective') return 'Partially effective'
  if (value === 'ineffective') return 'Ineffective'
  return 'Not assessed'
}

export function healthLabel(value: EvidenceHealth | 'no-owner') {
  if (value === 'no-owner') return 'No evidence owner'
  if (value === 'awaiting-approval') return 'Awaiting approval'
  if (value === 'not-required') return 'Not required'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function protectionLabel(value: RiskProtection) {
  if (value === 'adequate') return 'Adequately controlled'
  if (value === 'partial') return 'Partially controlled'
  if (value === 'insufficient') return 'Insufficiently controlled'
  return 'Unverified'
}

export function typeLabel(value: ControlType) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function executionLabel(value: ExecutionMethod) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function frequencyLabel(value: ControlFrequency) {
  if (value === 'event-driven') return 'Event-driven'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function directionLabel(value: ChangeDirection) {
  if (value === 'improving') return 'Improving'
  if (value === 'weakening') return 'Weakening'
  return 'Stable'
}

export function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function assuranceTone(value: AssuranceStatus | EffectivenessRating | EvidenceHealth | RiskProtection | string) {
  if (
    value === 'effective' ||
    value === 'current' ||
    value === 'adequate' ||
    value === 'sufficient' ||
    value === 'not-required'
  ) {
    return 'ok' as const
  }
  if (value === 'ineffective' || value === 'insufficient' || value === 'missing' || value === 'conflicting') {
    return 'bad' as const
  }
  return 'watch' as const
}

function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`).getTime()
  const b = new Date(`${to}T00:00:00`).getTime()
  return Math.round((b - a) / 86400000)
}

export function buildControlRecords(position: PositionState, extras: ControlRecord[] = []): ControlRecord[] {
  const categories = controlCategories()
  const seeded = data.controls.map((item) => {
    const category = categories.find((entry) => entry.id === item.categoryId)
    const owner = personById(item.ownerId)
    const execId = item.accountableExecutiveId || item.ownerId
    const exec = personById(execId)
    const overall = asAssurance(pick(item.overallBefore, item.overallAfter, position), 'not-assessed')
    return {
      id: item.id,
      title: item.title,
      categoryId: item.categoryId,
      categoryName: category?.name ?? 'Uncategorised',
      categoryShort: category?.shortLabel ?? 'Other',
      businessUnit: item.businessUnit,
      type: asType(item.type),
      execution: asExecution(item.execution),
      frequency: asFrequency(item.frequency),
      ownerId: item.ownerId,
      owner: owner?.name ?? 'Unassigned',
      ownerRole: owner?.role ?? '',
      accountableExecutiveId: execId,
      accountableExecutive: exec ? `${exec.name}, ${exec.role}` : personLabel(execId),
      design: asEffectiveness(pick(item.designBefore, item.designAfter, position), 'not-assessed'),
      operating: asEffectiveness(pick(item.operatingBefore, item.operatingAfter, position), 'not-assessed'),
      evidenceSufficiency: (pick(item.evidenceSufficiencyBefore, item.evidenceSufficiencyAfter, position) ||
        'insufficient') as EvidenceSufficiency,
      overall,
      evidenceHealth: asHealth(pick(item.evidenceHealthBefore, item.evidenceHealthAfter, position), 'missing'),
      priorOverall: asAssurance(position === 'after' ? item.overallBefore : item.priorOverall, overall),
      lastAssessed: item.lastAssessed,
      nextAssessment: item.nextAssessment,
      nextAction: pick(item.nextActionBefore, item.nextActionAfter, position),
      dueDate: item.dueDate,
      why: pick(item.whyBefore, item.whyAfter, position),
      whatChanged: pick(item.whatChangedBefore, item.whatChangedAfter, position),
      mappingLabels: item.mappingLabels ?? item.frameworkIds.map((id) => frameworkName(id)),
      frameworkIds: item.frameworkIds,
      obligationIds: item.obligationIds,
      riskIds: item.riskIds,
      evidenceIds: pick(item.evidenceIdsBefore, item.evidenceIdsAfter, position),
      testingHistory: (item.testingHistory ?? []).map((entry) => ({
        date: entry.date,
        result: entry.result,
        assessor: personById(entry.assessorId)?.name ?? '',
      })),
      openActions: (item.openActions ?? []).map((action) => ({
        id: action.id,
        title: action.title,
        ownerId: action.ownerId,
        owner: personById(action.ownerId)?.name ?? '',
        dueDate: action.dueDate,
        status: pick(action.statusBefore, action.statusAfter, position),
      })),
    } satisfies ControlRecord
  })
  return [...seeded, ...extras]
}

export function createDraftControl(input: {
  title: string
  categoryId: string
  businessUnit: string
  ownerId: string
  type: ControlType
  execution: ExecutionMethod
  frequency: ControlFrequency
}): ControlRecord {
  const category = categoryById(input.categoryId) ?? controlCategories()[0]
  const owner = personById(input.ownerId)
  return {
    id: `ctl-draft-${Date.now()}`,
    title: input.title,
    categoryId: category.id,
    categoryName: category.name,
    categoryShort: category.shortLabel,
    businessUnit: input.businessUnit,
    type: input.type,
    execution: input.execution,
    frequency: input.frequency,
    ownerId: input.ownerId,
    owner: owner?.name ?? 'Unassigned',
    ownerRole: owner?.role ?? '',
    accountableExecutiveId: category.accountableExecutiveId,
    accountableExecutive: category.accountableExecutive,
    design: 'not-assessed',
    operating: 'not-assessed',
    evidenceSufficiency: 'insufficient',
    overall: 'not-assessed',
    evidenceHealth: 'missing',
    priorOverall: 'not-assessed',
    lastAssessed: TODAY,
    nextAssessment: '2026-12-12',
    nextAction: 'Complete design and operating assessment',
    dueDate: '2026-10-10',
    why: 'This control has been added for this session. It is not assessed until design, operation and evidence are reviewed.',
    whatChanged: 'Added in this working session. It is not yet part of the approved organisation position.',
    mappingLabels: ['Internal policies'],
    frameworkIds: ['fw-internal'],
    obligationIds: [],
    riskIds: [],
    evidenceIds: [],
    testingHistory: [{ date: TODAY, result: 'Not assessed', assessor: owner?.name ?? 'Session' }],
    openActions: [
      {
        id: `ca-draft-${Date.now()}`,
        title: 'Assess design, operation and evidence sufficiency',
        ownerId: input.ownerId,
        owner: owner?.name ?? 'Unassigned',
        dueDate: '2026-10-10',
        status: 'open',
      },
    ],
    sessionAdded: true,
  }
}

function countByOverall(rows: ControlRecord[], status: AssuranceStatus) {
  return rows.filter((item) => item.overall === status).length
}

function evidenceCoveragePct(rows: ControlRecord[]) {
  if (rows.length === 0) return 0
  const covered = rows.filter((item) => item.evidenceHealth === 'current' || item.evidenceHealth === 'not-required').length
  return Math.round((covered / rows.length) * 100)
}

function directionFrom(current: number, previous: number): ChangeDirection {
  if (current > previous) return 'improving'
  if (current < previous) return 'weakening'
  return 'stable'
}

function changeCopy(current: number, previous: number, unit: string) {
  const delta = current - previous
  if (delta === 0) return `Held versus previous period · ${previous} ${unit}`
  const sign = delta > 0 ? '+' : ''
  const verb = delta > 0 ? 'Up' : 'Down'
  return `${verb} ${sign}${delta} versus previous period (${previous} ${unit})`
}

export function buildCategorySummaries(controls: ControlRecord[], previous: ControlRecord[]): CategorySummary[] {
  return controlCategories().map((category) => {
    const rows = controls.filter((item) => item.categoryId === category.id)
    const priorRows = previous.filter((item) => item.categoryId === category.id)
    const effective = countByOverall(rows, 'effective')
    const priorEffective = countByOverall(priorRows, 'effective')
    const riskIds = new Set(rows.flatMap((item) => item.riskIds))
    const obligationIds = new Set(rows.flatMap((item) => item.obligationIds))
    const coverage = evidenceCoveragePct(rows)
    const priorCoverage = evidenceCoveragePct(priorRows)
    return {
      ...category,
      controlCount: rows.length,
      effective,
      partiallyAssured: countByOverall(rows, 'partially-assured'),
      unverifiable: countByOverall(rows, 'unverifiable'),
      ineffective: countByOverall(rows, 'ineffective'),
      notAssessed: countByOverall(rows, 'not-assessed'),
      evidenceCoverage: coverage,
      connectedRisks: riskIds.size,
      connectedObligations: obligationIds.size,
      direction: directionFrom(effective, priorEffective) === 'stable' ? directionFrom(coverage, priorCoverage) : directionFrom(effective, priorEffective),
    }
  })
}

export function buildIndicators(
  controls: ControlRecord[],
  previous: ControlRecord[],
): ControlIndicator[] {
  const total = controls.length
  const effective = countByOverall(controls, 'effective')
  const partial = countByOverall(controls, 'partially-assured')
  const unverifiable = countByOverall(controls, 'unverifiable')
  const coverage = evidenceCoveragePct(controls)
  const prevTotal = previous.length
  const prevEffective = countByOverall(previous, 'effective')
  const prevPartial = countByOverall(previous, 'partially-assured')
  const prevUnverifiable = countByOverall(previous, 'unverifiable')
  const prevCoverage = evidenceCoveragePct(previous)

  return [
    {
      id: 'total',
      label: 'Total controls',
      value: String(total),
      context: 'Enterprise control inventory in scope for this review',
      change: changeCopy(total, prevTotal, 'controls'),
      direction: directionFrom(total, prevTotal),
      filter: { assurance: 'all' },
    },
    {
      id: 'effective',
      label: 'Operating effectively',
      value: String(effective),
      context: 'Design, operation and current evidence all support reliance',
      change: changeCopy(effective, prevEffective, 'effective'),
      direction: directionFrom(effective, prevEffective),
      filter: { assurance: 'effective' },
    },
    {
      id: 'partial',
      label: 'Partially assured',
      value: String(partial),
      context: 'Some assurance exists, but not enough to rely on fully',
      change: changeCopy(partial, prevPartial, 'partial'),
      direction: directionFrom(partial, prevPartial),
      filter: { assurance: 'partially-assured' },
    },
    {
      id: 'unverifiable',
      label: 'Unverifiable',
      value: String(unverifiable),
      context: 'Missing evidence — not automatically treated as failed',
      change: changeCopy(unverifiable, prevUnverifiable, 'unverifiable'),
      direction: directionFrom(prevUnverifiable, unverifiable),
      filter: { assurance: 'unverifiable' },
    },
    {
      id: 'coverage',
      label: 'Evidence coverage',
      value: `${coverage}%`,
      context: 'Share of controls with current, sufficient evidence',
      change: changeCopy(coverage, prevCoverage, '%'),
      direction: directionFrom(coverage, prevCoverage),
      filter: { evidenceHealth: 'current' },
    },
  ]
}

export function previousRecords(position: PositionState, extras: ControlRecord[]): ControlRecord[] {
  if (position === 'after') return buildControlRecords('before', extras)
  return buildControlRecords('before', extras).map((item) => ({ ...item, overall: item.priorOverall }))
}

export function filterControls(rows: ControlRecord[], filters: ControlFilters) {
  const query = filters.query.trim().toLowerCase()
  return rows.filter((item) => {
    if (filters.categoryId !== 'all' && item.categoryId !== filters.categoryId) return false
    if (filters.assurance !== 'all' && item.overall !== filters.assurance) return false
    if (filters.frameworkId !== 'all' && !item.frameworkIds.includes(filters.frameworkId)) return false
    if (filters.businessUnit !== 'all' && item.businessUnit !== filters.businessUnit) return false
    if (filters.riskId !== 'all' && !item.riskIds.includes(filters.riskId)) return false
    if (filters.ownerId !== 'all' && item.ownerId !== filters.ownerId) return false
    if (filters.type !== 'all' && item.type !== filters.type) return false
    if (filters.execution !== 'all' && item.execution !== filters.execution) return false
    if (filters.evidenceHealth === 'no-owner') {
      const ownerless = linkedEvidence(item).some((entry) => !entry.ownerId)
      if (!ownerless) return false
    } else if (filters.evidenceHealth !== 'all' && item.evidenceHealth !== filters.evidenceHealth) {
      return false
    }
    if (filters.assessed === 'last-90' && daysBetween(item.lastAssessed, TODAY) > 90) return false
    if (filters.assessed === 'older-90' && daysBetween(item.lastAssessed, TODAY) <= 90) return false
    if (filters.assessed === 'overdue' && item.nextAssessment >= TODAY) return false
    if (query) {
      const haystack = [
        item.title,
        item.categoryName,
        item.owner,
        item.businessUnit,
        item.id,
        ...item.mappingLabels,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export function hasActiveFilters(filters: ControlFilters) {
  const defaults = defaultFilters()
  return (Object.keys(filters) as (keyof ControlFilters)[]).some((key) => filters[key] !== defaults[key])
}

export function activeFilterChips(filters: ControlFilters): FilterChip[] {
  const chips: FilterChip[] = []
  if (filters.query.trim()) chips.push({ key: 'query', label: 'Search', valueLabel: filters.query.trim() })
  if (filters.categoryId !== 'all') {
    chips.push({
      key: 'categoryId',
      label: 'Category',
      valueLabel: categoryById(filters.categoryId)?.name ?? filters.categoryId,
    })
  }
  if (filters.assurance !== 'all') {
    chips.push({ key: 'assurance', label: 'Assurance', valueLabel: assuranceLabel(filters.assurance) })
  }
  if (filters.frameworkId !== 'all') {
    chips.push({ key: 'frameworkId', label: 'Framework', valueLabel: frameworkName(filters.frameworkId) })
  }
  if (filters.businessUnit !== 'all') chips.push({ key: 'businessUnit', label: 'Business unit', valueLabel: filters.businessUnit })
  if (filters.riskId !== 'all') chips.push({ key: 'riskId', label: 'Risk', valueLabel: titleOf(data.risks, filters.riskId) })
  if (filters.evidenceHealth !== 'all') {
    chips.push({ key: 'evidenceHealth', label: 'Evidence', valueLabel: healthLabel(filters.evidenceHealth) })
  }
  if (filters.ownerId !== 'all') chips.push({ key: 'ownerId', label: 'Owner', valueLabel: personById(filters.ownerId)?.name ?? filters.ownerId })
  if (filters.type !== 'all') chips.push({ key: 'type', label: 'Type', valueLabel: typeLabel(filters.type) })
  if (filters.execution !== 'all') chips.push({ key: 'execution', label: 'Execution', valueLabel: executionLabel(filters.execution) })
  if (filters.assessed !== 'all') {
    const label =
      filters.assessed === 'last-90' ? 'Assessed in last 90 days' : filters.assessed === 'older-90' ? 'Assessed over 90 days ago' : 'Next assessment overdue'
    chips.push({ key: 'assessed', label: 'Assessment', valueLabel: label })
  }
  return chips
}

export function clearFilterChip(filters: ControlFilters, key: keyof ControlFilters): ControlFilters {
  return { ...filters, [key]: defaultFilters()[key] }
}

function attentionScore(item: ControlRecord) {
  let score = 0
  if (item.overall === 'ineffective') score += 42
  else if (item.overall === 'unverifiable') score += 32
  else if (item.overall === 'partially-assured') score += 18
  else if (item.overall === 'not-assessed') score += 12
  if (item.evidenceHealth === 'missing') score += 8
  if (item.evidenceHealth === 'conflicting') score += 7
  if (item.evidenceHealth === 'expiring') score += 5
  if (item.evidenceHealth === 'awaiting-approval') score += 4
  score += Math.min(item.frameworkIds.length, 5)
  if (item.dueDate && item.dueDate < TODAY) score += 6
  return score
}

export function attentionControls(rows: ControlRecord[]) {
  return [...rows]
    .filter((item) => item.overall !== 'effective')
    .sort((a, b) => attentionScore(b) - attentionScore(a))
    .slice(0, 3)
}

export function leverageRows(rows: ControlRecord[]): LeverageRow[] {
  return [...rows]
    .filter((item) => item.frameworkIds.length >= 2)
    .sort((a, b) => b.frameworkIds.length + b.obligationIds.length - (a.frameworkIds.length + a.obligationIds.length))
    .slice(0, 5)
    .map((control) => ({
      control,
      frameworkCount: control.frameworkIds.length,
      obligationCount: control.obligationIds.length,
      reuse: `Already mapped to ${control.obligationIds.length} obligation${control.obligationIds.length === 1 ? '' : 's'} across ${control.frameworkIds.length} frameworks.`,
      impact:
        control.overall === 'effective'
          ? 'Improving this control further has limited incremental assurance effect.'
          : `Improving this control would lift assurance across ${control.mappingLabels.slice(0, 4).join(', ')}.`,
    }))
}

function deriveProtection(controlIds: string[], controls: ControlRecord[]): RiskProtection {
  const linked = controls.filter((item) => controlIds.includes(item.id))
  if (linked.length === 0) return 'insufficient'
  if (linked.some((item) => item.overall === 'ineffective')) return 'insufficient'
  if (linked.some((item) => item.overall === 'unverifiable' || item.overall === 'not-assessed')) return 'unverified'
  if (linked.some((item) => item.overall === 'partially-assured')) return 'partial'
  return 'adequate'
}

export function priorityRisks(controls: ControlRecord[]): ProtectedRisk[] {
  return data.risks
    .filter((item) => item.severity === 'critical' || item.severity === 'high')
    .map((item) => {
      const linked = controls.filter((control) => item.controlIds.includes(control.id) || control.riskIds.includes(item.id))
      const controlIds = [...new Set([...item.controlIds, ...linked.map((control) => control.id)])]
      const evidenceIds = [...new Set(linked.flatMap((control) => control.evidenceIds))]
      const obligationIds = [...new Set([...item.obligationIds, ...linked.flatMap((control) => control.obligationIds)])]
      const frameworkIds = [
        ...new Set(
          obligationIds
            .map((id) => data.obligations.find((obligation) => obligation.id === id)?.frameworkId)
            .filter((id): id is string => Boolean(id)),
        ),
      ]
      return {
        id: item.id,
        title: item.title,
        severity: item.severity,
        businessUnit: item.businessUnit,
        owner: personById(item.ownerId)?.name ?? '',
        protection: deriveProtection(controlIds, controls),
        controlIds,
        controlTitles: controlIds.map((id) => titleOf(data.controls, id) || linked.find((row) => row.id === id)?.title || id),
        evidenceIds,
        obligationIds,
        frameworkIds,
      }
    })
}

export function linkedEvidence(control: ControlRecord) {
  return evidenceFor('after')
    .concat(evidenceFor('before'))
    .filter((item, index, all) => all.findIndex((entry) => entry.id === item.id) === index)
    .filter((item) => control.evidenceIds.includes(item.id) || item.usedByControlIds.includes(control.id))
}

export function evidenceDependencies(controls: ControlRecord[], position: PositionState): EvidenceDependency[] {
  const catalogue = evidenceFor(position)
  const rows: EvidenceDependency[] = []

  for (const control of controls) {
    if (control.evidenceHealth === 'missing') {
      rows.push({
        id: `${control.id}-missing`,
        controlId: control.id,
        controlTitle: control.title,
        evidenceId: control.id === 'ctl-supplier-assurance' ? null : control.evidenceIds[0] ?? null,
        evidenceTitle:
          control.id === 'ctl-supplier-assurance'
            ? 'Current critical-supplier assessments'
            : `Expected operating evidence for ${control.title}`,
        health: 'missing',
        owner: control.owner,
        detail: 'Current evidence is not sufficient to verify operation. This is unverifiable, not failed.',
      })
    }

    for (const item of catalogue.filter((entry) => control.evidenceIds.includes(entry.id) || entry.usedByControlIds.includes(control.id))) {
      if (item.freshness === 'expiring' || control.evidenceHealth === 'expiring') {
        rows.push({
          id: `${control.id}-${item.id}-expiring`,
          controlId: control.id,
          controlTitle: control.title,
          evidenceId: item.id,
          evidenceTitle: item.title,
          health: 'expiring',
          owner: personById(item.ownerId)?.name || 'Unassigned',
          detail: `Expires relative to this review · ${item.date}`,
        })
      }
      const conflictWith = 'conflictWith' in item ? String(item.conflictWith ?? '') : ''
      if (conflictWith || control.evidenceHealth === 'conflicting') {
        rows.push({
          id: `${control.id}-${item.id}-conflict`,
          controlId: control.id,
          controlTitle: control.title,
          evidenceId: item.id,
          evidenceTitle: item.title,
          health: 'conflicting',
          owner: personById(item.ownerId)?.name || 'Unassigned',
          detail: conflictWith ? `Conflicts with ${titleOf(data.evidence, conflictWith)}` : 'Conflicts with another current pack',
        })
      }
      if (item.processingState === 'awaiting-approval' || control.evidenceHealth === 'awaiting-approval') {
        rows.push({
          id: `${control.id}-${item.id}-approval`,
          controlId: control.id,
          controlTitle: control.title,
          evidenceId: item.id,
          evidenceTitle: item.title,
          health: 'awaiting-approval',
          owner: personById(item.ownerId)?.name || 'Unassigned',
          detail: 'Collected but not yet approved. Assurance cannot move until a human approves.',
        })
      }
      if (!item.ownerId) {
        rows.push({
          id: `${control.id}-${item.id}-owner`,
          controlId: control.id,
          controlTitle: control.title,
          evidenceId: item.id,
          evidenceTitle: item.title,
          health: 'no-owner',
          owner: 'Unassigned',
          detail: 'No evidence owner is recorded against this pack.',
        })
      }
    }
  }

  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.health}:${row.controlId}:${row.evidenceId}:${row.evidenceTitle}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export function emptyStateForFilters(filters: ControlFilters, allCount: number) {
  if (allCount === 0) {
    return {
      title: 'No controls in this organisation view',
      body: 'Add a control to start building the inventory for this review.',
      action: 'Add control',
    }
  }
  if (hasActiveFilters(filters)) {
    return {
      title: 'No controls match these filters',
      body: 'Clear a filter chip or reset the page to see the full inventory.',
      action: 'Clear filters',
    }
  }
  return {
    title: 'No controls to show',
    body: 'Try another category or search term.',
    action: 'Show all controls',
  }
}

export function buildBriefing(
  controls: ControlRecord[],
  filters: ControlFilters,
  position: PositionState,
): ControlBriefing {
  const after = position === 'after'
  const category = filters.categoryId !== 'all' ? categoryById(filters.categoryId) : null
  const scope = category ? controls.filter((item) => item.categoryId === category.id) : controls
  const lead =
    attentionControls(scope)[0] ??
    scope.find((item) => item.id === 'ctl-supplier-assurance') ??
    scope[0]

  const unverifiable = scope.filter((item) => item.overall === 'unverifiable')
  const ineffective = scope.filter((item) => item.overall === 'ineffective')
  const connectedRisks = [...new Set(scope.flatMap((item) => item.riskIds))]
  const connectedObligations = [...new Set(scope.flatMap((item) => item.obligationIds))]

  if (category) {
    const title = `${category.name}: ${unreliableLine(scope)}`
    return {
      title,
      attention: lead ? `${lead.title} is the priority in ${category.shortLabel}.` : `${category.name} has no open assurance issues.`,
      why: lead?.why ?? 'Category assurance is currently stable.',
      facts: briefingFacts(scope, after),
      interpretation: categoryInterpretation(category, scope, after),
      confidence: 'high',
      freshness: freshnessLine(scope, after),
      recommendedAction: lead?.nextAction ?? 'Maintain the current evidence cycle.',
      owner: lead?.owner ?? category.accountableExecutive.split(',')[0],
      due: lead ? formatDate(lead.dueDate) : reportingPeriod,
      approval: 'Human approval is required before assurance conclusions change.',
      askPrompt: `Which ${category.shortLabel.toLowerCase()} controls are currently unverifiable?`,
      sources: briefingSources(lead, connectedRisks, connectedObligations),
    }
  }

  return {
    title: after
      ? 'Supplier assurance is now effective. Residual weakening sits in HSE, access and audit follow-up.'
      : 'You cannot yet rely on supplier assurance. Safety inspections are separately ineffective.',
    attention: lead ? `${lead.title} needs attention first.` : 'No control currently requires attention.',
    why: lead?.why ?? 'The inventory is currently effective.',
    facts: briefingFacts(controls, after),
    interpretation: after
      ? 'Closing supplier evidence improved one high-leverage control. It did not repair conflicting access evidence, expiring continuity tests, or overdue safety inspections.'
      : 'Missing supplier assessments keep a multi-framework control unverifiable. That is not a design failure. HSE is different: current inspection records prove the control is not operating.',
    confidence: 'high',
    freshness: freshnessLine(controls, after),
    recommendedAction: after
      ? ineffective[0]?.nextAction ?? unverifiable[0]?.nextAction ?? 'Keep evidence mappings current ahead of the review.'
      : 'Obtain and approve current critical-supplier assessments, then close overdue safety inspections.',
    owner: after ? ineffective[0]?.owner ?? 'Yusuf Rahman' : 'Omar Haddad',
    due: after ? formatDate(ineffective[0]?.dueDate ?? '2026-09-20') : '26 Sep 2026',
    approval: 'Human approval is required before coverage, control assurance or risk ratings change.',
    askPrompt: lead ? `Why can ${lead.title} not be relied upon?` : 'Which controls can we rely on?',
    sources: briefingSources(lead, connectedRisks, connectedObligations),
  }
}

function unreliableLine(scope: ControlRecord[]) {
  const unverifiable = countByOverall(scope, 'unverifiable')
  const ineffective = countByOverall(scope, 'ineffective')
  const partial = countByOverall(scope, 'partially-assured')
  if (ineffective) return `${ineffective} control${ineffective === 1 ? '' : 's'} ineffective`
  if (unverifiable) return `${unverifiable} currently unverifiable`
  if (partial) return `${partial} only partially assured`
  return 'currently reliable'
}

function briefingFacts(scope: ControlRecord[], after: boolean): ControlBriefing['facts'] {
  const facts: ControlBriefing['facts'] = []
  const supplier = scope.find((item) => item.id === 'ctl-supplier-assurance')
  if (supplier) {
    facts.push({
      id: 'fact-supplier',
      text: after
        ? 'Supplier assurance is effective after the 2026 assessments were approved.'
        : 'Supplier assurance is unverifiable because current critical-supplier assessments are missing.',
      citationId: after ? 'ev-supplier-assessments-2026' : 'ctl-supplier-assurance',
    })
  }
  const hse = scope.find((item) => item.id === 'ctl-safety-inspection')
  if (hse) {
    facts.push({
      id: 'fact-hse',
      text: 'Safety inspection completion is ineffective: current records show overdue plant inspections.',
      citationId: 'ctl-safety-inspection',
    })
  }
  const privileged = scope.find((item) => item.id === 'ctl-privileged-access')
  if (privileged) {
    facts.push({
      id: 'fact-priv',
      text: 'Privileged-access review is only partially assured because two current evidence packs conflict.',
      citationId: 'ctl-privileged-access',
    })
  }
  if (facts.length < 3) {
    facts.push({
      id: 'fact-count',
      text: `${countByOverall(scope, 'effective')} of ${scope.length} controls in this view are effective.`,
      citationId: scope[0]?.id ?? 'ctl-isms-policy',
    })
  }
  return facts.slice(0, 3)
}

function categoryInterpretation(category: ControlCategory, scope: ControlRecord[], after: boolean) {
  if (category.id === 'cat-third-party') {
    return after
      ? 'Third-party assurance can now be relied on for this review. Keep the assessment cycle current.'
      : 'The supplier-assurance control exists and is designed. It cannot be relied on until current assessments exist.'
  }
  if (category.id === 'cat-hse') {
    return 'HSE is not an evidence-gap story. The inspection pack is current and shows the control is not operating as intended.'
  }
  if (category.id === 'cat-cybersecurity') {
    return 'Policy management is effective. Privileged-access review cannot be fully relied on until conflicting evidence is reconciled.'
  }
  return `${category.name} currently has ${countByOverall(scope, 'effective')} effective control${countByOverall(scope, 'effective') === 1 ? '' : 's'} of ${scope.length}.`
}

function freshnessLine(scope: ControlRecord[], after: boolean) {
  const expiring = scope.filter((item) => item.evidenceHealth === 'expiring').length
  const missing = scope.filter((item) => item.evidenceHealth === 'missing').length
  if (after) return `2026 supplier assessments current · ${expiring} expiring packs still in view`
  return `${missing} missing operating pack${missing === 1 ? '' : 's'} · ${expiring} expiring`
}

function briefingSources(
  lead: ControlRecord | undefined,
  riskIds: string[],
  obligationIds: string[],
): ControlBriefing['sources'] {
  const sources: ControlBriefing['sources'] = []
  if (lead) sources.push({ id: lead.id, kind: 'Control', title: lead.title })
  const evidenceId = lead?.evidenceIds[0]
  if (evidenceId) {
    const evidence = data.evidence.find((item) => item.id === evidenceId)
    if (evidence) sources.push({ id: evidence.id, kind: 'Evidence', title: evidence.title })
  }
  const riskId = lead?.riskIds[0] ?? riskIds[0]
  if (riskId) sources.push({ id: riskId, kind: 'Risk', title: titleOf(data.risks, riskId) })
  const obligationId = lead?.obligationIds[0] ?? obligationIds[0]
  if (obligationId) {
    const obligation = data.obligations.find((item) => item.id === obligationId)
    if (obligation) sources.push({ id: obligation.id, kind: 'Obligation', title: obligation.title })
  }
  return sources.slice(0, 4)
}

export function describeControlDrill(filters: ControlFilters) {
  const chips = activeFilterChips(filters)
  if (chips.length === 0) {
    return {
      label: `${organisation.name} control assurance`,
      questions: [
        'Which controls can we rely on?',
        'Which cybersecurity controls are currently unverifiable?',
        'What evidence is missing, expiring or conflicting?',
        'Which controls have the greatest effect on NIS2 assurance?',
      ],
    }
  }
  const label = chips.map((chip) => `${chip.label}: ${chip.valueLabel}`).join(' · ')
  const questions = [
    filters.categoryId !== 'all'
      ? `Which ${categoryById(filters.categoryId)?.shortLabel.toLowerCase() ?? 'these'} controls are currently unverifiable?`
      : 'Which controls can we rely on?',
    filters.assurance === 'unverifiable' ? 'Why are these controls unverifiable rather than failed?' : 'Why can this control not be relied upon?',
    'What evidence is missing, expiring or conflicting?',
    filters.frameworkId !== 'all'
      ? `Which controls have the greatest effect on ${frameworkName(filters.frameworkId)} assurance?`
      : 'What should the owner do next?',
  ]
  return { label, questions }
}

export function linkedObligations(control: ControlRecord) {
  return control.obligationIds.map((id) => {
    const obligation = data.obligations.find((item) => item.id === id)
    return {
      id,
      title: obligation?.title ?? id,
      framework: obligation ? frameworkName(obligation.frameworkId) : '',
      frameworkId: obligation?.frameworkId ?? '',
    }
  })
}

export function linkedRisks(control: ControlRecord) {
  return control.riskIds.map((id) => {
    const risk = data.risks.find((item) => item.id === id)
    return {
      id,
      title: risk?.title ?? id,
      severity: risk?.severity ?? '',
      unit: risk?.businessUnit ?? '',
    }
  })
}

export const organisationName = organisation.name
export const periodLabel = reportingPeriod
export const peopleOptions = data.people.map((person) => ({ id: person.id, name: person.name, role: person.role }))
export const frameworkOptions = data.frameworks.map((item) => ({ id: item.id, name: item.name }))
export const riskOptions = data.risks.map((item) => ({ id: item.id, title: item.title }))
