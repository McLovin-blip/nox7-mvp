import {
  coverageOf,
  data,
  frameworkName,
  organisation,
  personById,
  reportingPeriod,
  titleOf,
} from '../mock/data.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'

export type ObligationStatus = 'supported' | 'partial' | 'unverifiable' | 'unsupported'
export type EvidenceHealth = 'current' | 'expiring' | 'missing' | 'conflicting' | 'awaiting-approval' | 'not-required'

export type ObligationRecord = {
  id: string
  title: string
  code: string
  theme: string
  frameworkId: string
  framework: string
  coverage: number
  ownerId: string
  owner: string
  ownerRole: string
  overall: ObligationStatus
  priorOverall: ObligationStatus
  evidenceHealth: EvidenceHealth
  lastAssessed: string
  nextReview: string
  nextAction: string
  dueDate: string
  why: string
  whatChanged: string
  controlIds: string[]
  evidenceIds: string[]
  riskIds: string[]
  policyIds: string[]
}

export type ObligationFilters = {
  query: string
  frameworkId: string
  status: 'all' | ObligationStatus
  theme: string
  ownerId: string
  evidenceHealth: 'all' | EvidenceHealth
  controlId: string
}

export type WorkspaceNavigate =
  | { type: 'module'; module: ModuleId; recordId?: string | null }
  | { type: 'obligation'; obligationId: string | null }
  | { type: 'upload' }

export const TODAY = '2026-09-12'

function pick<T>(before: T, after: T, position: PositionState): T {
  return position === 'after' ? after : before
}

function asStatus(value: string | undefined, fallback: ObligationStatus): ObligationStatus {
  if (value === 'supported' || value === 'partial' || value === 'unverifiable' || value === 'unsupported') return value
  if (value === 'assured') return 'supported'
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

export function statusLabel(value: ObligationStatus) {
  if (value === 'supported') return 'Supported'
  if (value === 'unverifiable') return 'Unverifiable'
  if (value === 'unsupported') return 'Unsupported'
  return 'Partially supported'
}

export function healthLabel(value: EvidenceHealth) {
  if (value === 'awaiting-approval') return 'Awaiting approval'
  if (value === 'not-required') return 'Not required'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function toneOf(value: string) {
  if (value === 'supported' || value === 'current' || value === 'effective') return 'ok' as const
  if (value === 'unsupported' || value === 'missing' || value === 'conflicting' || value === 'ineffective') return 'bad' as const
  return 'watch' as const
}

export function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function defaultObligationFilters(): ObligationFilters {
  return {
    query: '',
    frameworkId: 'all',
    status: 'all',
    theme: 'all',
    ownerId: 'all',
    evidenceHealth: 'all',
    controlId: 'all',
  }
}

export function buildObligationRecords(position: PositionState): ObligationRecord[] {
  return data.obligations.map((item) => {
    const owner = personById(item.ownerId)
    const overall = asStatus(pick(item.overallBefore, item.overallAfter, position), 'partial')
    return {
      id: item.id,
      title: item.title,
      code: item.code,
      theme: item.theme,
      frameworkId: item.frameworkId,
      framework: frameworkName(item.frameworkId),
      coverage: coverageOf(item.frameworkId, position),
      ownerId: item.ownerId,
      owner: owner?.name ?? 'Unassigned',
      ownerRole: owner?.role ?? '',
      overall,
      priorOverall: asStatus(position === 'after' ? item.overallBefore : item.overallBefore, overall),
      evidenceHealth: asHealth(pick(item.evidenceHealthBefore, item.evidenceHealthAfter, position), 'current'),
      lastAssessed: item.lastAssessed,
      nextReview: item.nextReview,
      nextAction: pick(item.nextActionBefore, item.nextActionAfter, position),
      dueDate: item.dueDate,
      why: pick(item.whyBefore, item.whyAfter, position),
      whatChanged: pick(item.whatChangedBefore, item.whatChangedAfter, position),
      controlIds: item.controlIds,
      evidenceIds: pick(item.evidenceIdsBefore, item.evidenceIdsAfter, position),
      riskIds: item.riskIds,
      policyIds: item.policyIds,
    }
  })
}

export function previousObligations(position: PositionState) {
  if (position === 'after') return buildObligationRecords('before')
  return buildObligationRecords('before').map((item) => ({ ...item, overall: item.priorOverall }))
}

export function filterObligations(rows: ObligationRecord[], filters: ObligationFilters) {
  const query = filters.query.trim().toLowerCase()
  return rows.filter((item) => {
    if (filters.frameworkId !== 'all' && item.frameworkId !== filters.frameworkId) return false
    if (filters.status !== 'all' && item.overall !== filters.status) return false
    if (filters.theme !== 'all' && item.theme !== filters.theme) return false
    if (filters.ownerId !== 'all' && item.ownerId !== filters.ownerId) return false
    if (filters.evidenceHealth !== 'all' && item.evidenceHealth !== filters.evidenceHealth) return false
    if (filters.controlId !== 'all' && !item.controlIds.includes(filters.controlId)) return false
    if (query) {
      const hay = [item.title, item.code, item.theme, item.owner, item.framework, item.id].join(' ').toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })
}

export function hasObligationFilters(filters: ObligationFilters) {
  const defaults = defaultObligationFilters()
  return (Object.keys(filters) as (keyof ObligationFilters)[]).some((key) => filters[key] !== defaults[key])
}

export function obligationChips(filters: ObligationFilters) {
  const chips: { key: keyof ObligationFilters; label: string; valueLabel: string }[] = []
  if (filters.query.trim()) chips.push({ key: 'query', label: 'Search', valueLabel: filters.query.trim() })
  if (filters.frameworkId !== 'all') chips.push({ key: 'frameworkId', label: 'Framework', valueLabel: frameworkName(filters.frameworkId) })
  if (filters.status !== 'all') chips.push({ key: 'status', label: 'Support', valueLabel: statusLabel(filters.status) })
  if (filters.theme !== 'all') chips.push({ key: 'theme', label: 'Theme', valueLabel: filters.theme })
  if (filters.ownerId !== 'all') chips.push({ key: 'ownerId', label: 'Owner', valueLabel: personById(filters.ownerId)?.name ?? filters.ownerId })
  if (filters.evidenceHealth !== 'all') chips.push({ key: 'evidenceHealth', label: 'Evidence', valueLabel: healthLabel(filters.evidenceHealth) })
  if (filters.controlId !== 'all') chips.push({ key: 'controlId', label: 'Control', valueLabel: titleOf(data.controls, filters.controlId) })
  return chips
}

export function clearObligationChip(filters: ObligationFilters, key: keyof ObligationFilters): ObligationFilters {
  return { ...filters, [key]: defaultObligationFilters()[key] }
}

function countStatus(rows: ObligationRecord[], status: ObligationStatus) {
  return rows.filter((item) => item.overall === status).length
}

function changeCopy(current: number, previous: number, unit: string) {
  const delta = current - previous
  if (delta === 0) return `Held versus previous period · ${previous} ${unit}`
  return `${delta > 0 ? 'Up' : 'Down'} ${delta > 0 ? '+' : ''}${delta} versus previous period (${previous} ${unit})`
}

export function obligationIndicators(rows: ObligationRecord[], previous: ObligationRecord[]) {
  return [
    {
      id: 'total' as const,
      label: 'Total obligations',
      value: String(rows.length),
      context: 'Requirements in scope for this review',
      change: changeCopy(rows.length, previous.length, 'obligations'),
      filter: { status: 'all' as const },
    },
    {
      id: 'supported' as const,
      label: 'Supported',
      value: String(countStatus(rows, 'supported')),
      context: 'Current evidence actually supports the requirement',
      change: changeCopy(countStatus(rows, 'supported'), countStatus(previous, 'supported'), 'supported'),
      filter: { status: 'supported' as const },
    },
    {
      id: 'partial' as const,
      label: 'Partially supported',
      value: String(countStatus(rows, 'partial')),
      context: 'Some coverage exists, but not enough to rely on',
      change: changeCopy(countStatus(rows, 'partial'), countStatus(previous, 'partial'), 'partial'),
      filter: { status: 'partial' as const },
    },
    {
      id: 'unverifiable' as const,
      label: 'Unverifiable',
      value: String(countStatus(rows, 'unverifiable')),
      context: 'Policy or design exists; current operating evidence does not',
      change: changeCopy(countStatus(rows, 'unverifiable'), countStatus(previous, 'unverifiable'), 'unverifiable'),
      filter: { status: 'unverifiable' as const },
    },
    {
      id: 'unsupported' as const,
      label: 'Unsupported',
      value: String(countStatus(rows, 'unsupported')),
      context: 'Current evidence proves the duty is not being met',
      change: changeCopy(countStatus(rows, 'unsupported'), countStatus(previous, 'unsupported'), 'unsupported'),
      filter: { status: 'unsupported' as const },
    },
  ]
}

export function frameworkSummaries(rows: ObligationRecord[], previous: ObligationRecord[]) {
  return data.frameworks.map((framework) => {
    const items = rows.filter((item) => item.frameworkId === framework.id)
    const prior = previous.filter((item) => item.frameworkId === framework.id)
    return {
      id: framework.id,
      name: framework.name,
      shortLabel: framework.id === 'fw-internal' ? 'Internal' : framework.name,
      coverage: items[0]?.coverage ?? coverageOf(framework.id, 'before'),
      count: items.length,
      supported: countStatus(items, 'supported'),
      partial: countStatus(items, 'partial'),
      unverifiable: countStatus(items, 'unverifiable'),
      unsupported: countStatus(items, 'unsupported'),
      controlCount: new Set(items.flatMap((item) => item.controlIds)).size,
      evidenceCoverage: items.length
        ? Math.round((items.filter((item) => item.evidenceHealth === 'current').length / items.length) * 100)
        : 0,
      direction: countStatus(items, 'supported') >= countStatus(prior, 'supported') ? 'stable' : 'weakening',
    }
  })
}

export function attentionObligations(rows: ObligationRecord[]) {
  const rank = (item: ObligationRecord) => {
    let score = 0
    if (item.overall === 'unsupported') score += 40
    else if (item.overall === 'unverifiable') score += 32
    else if (item.overall === 'partial') score += 18
    if (item.evidenceHealth === 'missing') score += 8
    if (item.evidenceHealth === 'conflicting') score += 6
    if (item.frameworkId !== 'fw-internal') score += 4
    return score
  }
  return [...rows].filter((item) => item.overall !== 'supported').sort((a, b) => rank(b) - rank(a)).slice(0, 3)
}

export function overlapRows(rows: ObligationRecord[]) {
  const byControl = new Map<string, ObligationRecord[]>()
  for (const row of rows) {
    for (const controlId of itemControl(row)) {
      const list = byControl.get(controlId) ?? []
      list.push(row)
      byControl.set(controlId, list)
    }
  }
  return [...byControl.entries()]
    .map(([controlId, obligations]) => ({
      controlId,
      controlTitle: titleOf(data.controls, controlId),
      frameworks: [...new Set(obligations.map((item) => item.framework))],
      obligationCount: obligations.length,
      impact:
        obligations.some((item) => item.overall !== 'supported')
          ? 'Improving this control would lift more than one framework at once.'
          : 'This control already supports multiple requirements.',
    }))
    .filter((item) => item.frameworks.length >= 2 || item.obligationCount >= 2)
    .sort((a, b) => b.obligationCount - a.obligationCount)
    .slice(0, 5)
}

function itemControl(row: ObligationRecord) {
  return row.controlIds
}

export function buildObligationBriefing(rows: ObligationRecord[], filters: ObligationFilters, position: PositionState) {
  const after = position === 'after'
  const lead = attentionObligations(rows)[0]
  const unverifiable = countStatus(rows, 'unverifiable')
  const unsupported = countStatus(rows, 'unsupported')
  const framework = filters.frameworkId !== 'all' ? frameworkName(filters.frameworkId) : null
  return {
    title: framework
      ? `${framework}: ${unverifiable ? `${unverifiable} unverifiable` : unsupported ? `${unsupported} unsupported` : 'currently supported'}`
      : after
        ? 'International supplier obligations are now supported. Residual gaps sit in access, continuity, audit follow-up and HSE.'
        : 'Several international obligations are only counting a current policy. Operating evidence is still missing.',
    attention: lead ? `${lead.title} needs attention first.` : 'No obligation currently requires attention in this view.',
    facts: [
      {
        id: 'f1',
        text: after
          ? 'ISO 27001, NIS2, GDPR and NCA ECC supplier obligations are supported by the 2026 assessments.'
          : 'Four international supplier obligations remain unverifiable because current assessments are missing.',
        citationId: 'obl-iso-a532',
      },
      {
        id: 'f2',
        text: 'Workplace safety inspection duties are unsupported: current records show overdue inspections.',
        citationId: 'obl-internal-hse',
      },
      {
        id: 'f3',
        text: 'Privileged access control is only partially supported because two current evidence packs conflict.',
        citationId: 'obl-iso-access',
      },
    ],
    interpretation: after
      ? 'Closing one evidence pack lifted four overlapping supplier obligations. It did not repair expiring continuity tests, conflicting access evidence, or HSE inspections.'
      : 'A current policy is not support. Until current assessments exist, those requirements are unverifiable. HSE is different: the pack proves the duty is not being met.',
    confidence: 'high',
    freshness: after ? '2026 supplier assessments current · continuity test still expiring' : 'Policy current · critical-supplier assessments missing',
    recommendedAction: lead?.nextAction ?? 'Maintain current evidence cycles.',
    owner: lead?.owner ?? 'Omar Haddad',
    due: lead ? formatDate(lead.dueDate) : reportingPeriod,
    approval: 'Human approval is required before coverage or support conclusions change.',
    askPrompt: framework ? `Which obligations have the greatest effect on ${framework}?` : 'Where are we only counting a policy?',
    sources: [
      lead ? { id: lead.id, kind: 'Obligation', title: lead.title } : null,
      { id: lead?.controlIds[0] ?? 'ctl-005', kind: 'Control', title: titleOf(data.controls, lead?.controlIds[0] ?? 'ctl-005') },
      { id: lead?.riskIds[0] ?? 'risk-002', kind: 'Risk', title: titleOf(data.risks, lead?.riskIds[0] ?? 'risk-002') },
    ].filter(Boolean) as { id: string; kind: string; title: string }[],
  }
}

export function describeObligationDrill(filters: ObligationFilters) {
  const framework = filters.frameworkId !== 'all' ? frameworkName(filters.frameworkId) : null
  return {
    label: framework ? `${framework} obligations` : `${organisation.name} regulatory position`,
    questions: [
      'Which obligations are actually supported?',
      framework ? `Which obligations have the greatest effect on ${framework}?` : 'Where are we only counting a policy?',
      'What evidence is missing, expiring or conflicting for these requirements?',
      'What should the owner do next?',
    ],
  }
}

export function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export const peopleOptions = data.people.map((person) => ({ id: person.id, name: person.name, role: person.role }))
export const frameworkOptions = data.frameworks.map((item) => ({ id: item.id, name: item.name, shortLabel: item.id === 'fw-internal' ? 'Internal' : item.name }))
export const periodLabel = reportingPeriod
export const organisationName = organisation.name
export const controlOptions = data.controls.map((item) => ({ id: item.id, title: item.title }))
