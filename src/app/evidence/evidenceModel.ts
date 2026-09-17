import { data, evidenceFor, organisation, personById, reportingPeriod, titleOf } from '../mock/data.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'

export type EvidenceStatus =
  | 'current'
  | 'expiring'
  | 'expired'
  | 'missing'
  | 'conflicting'
  | 'awaiting-approval'
  | 'duplicate'
  | 'superseded'
  | 'no-owner'
  | 'accepted'
  | 'under-review'

export type EvidenceRecord = {
  id: string
  code: string
  title: string
  fileType: string
  version: string
  date: string
  ownerId: string
  owner: string
  ownerRole: string
  status: EvidenceStatus
  statusLabel: string
  summary: string
  resultOrGap: string
  controlIds: string[]
  obligationIds: string[]
  riskIds: string[]
  synthetic?: boolean
}

export type EvidenceFilters = {
  query: string
  status: 'all' | EvidenceStatus
  ownerId: string
  controlId: string
  usedBy: 'all' | 'controls' | 'obligations' | 'risks' | 'unused'
  attentionOnly: boolean
}

export type EvidenceNavigate =
  | { type: 'module'; module: ModuleId; recordId?: string | null }
  | { type: 'evidence'; evidenceId: string | null }
  | { type: 'upload' }

export function statusLabel(value: EvidenceStatus | string) {
  if (value === 'awaiting-approval') return 'Awaiting approval'
  if (value === 'no-owner') return 'No owner'
  if (value === 'under-review') return 'Under Review'
  if (value === 'accepted') return 'Accepted'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function toneOf(value: EvidenceStatus) {
  if (value === 'current' || value === 'accepted') return 'ok' as const
  if (value === 'missing' || value === 'expired' || value === 'conflicting') return 'bad' as const
  return 'watch' as const
}

export function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function defaultEvidenceFilters(): EvidenceFilters {
  return { query: '', status: 'all', ownerId: 'all', controlId: 'all', usedBy: 'all', attentionOnly: false }
}

function deriveStatus(item: (typeof data.evidence)[number], _position: PositionState): EvidenceStatus {
  const label = 'statusLabel' in item ? String(item.statusLabel ?? '').toLowerCase() : ''
  if (label.includes('accepted')) return 'accepted'
  if (label.includes('under review')) return 'under-review'
  if (item.duplicateOf) return 'duplicate'
  if (item.processingState === 'awaiting-approval') return 'awaiting-approval'
  if (!item.ownerId) return 'no-owner'
  if ('conflictWith' in item && item.conflictWith) return 'conflicting'
  if (item.freshness === 'expiring') return 'expiring'
  if (item.freshness === 'expired') return 'expired'
  return 'current'
}

export function buildEvidenceRecords(position: PositionState): EvidenceRecord[] {
  return evidenceFor(position).map((item) => {
    const owner = personById(item.ownerId)
    const status = deriveStatus(item, position)
    const resultOrGap = item.resultOrGap ?? item.summary ?? `${item.fileType} · Version ${item.version}`
    return {
      id: item.id,
      code: item.code ?? item.id.toUpperCase(),
      title: item.title,
      fileType: item.fileType,
      version: item.version,
      date: item.date,
      ownerId: item.ownerId,
      owner: owner?.name ?? 'Unassigned',
      ownerRole: owner?.role ?? '',
      status,
      statusLabel: item.statusLabel ?? statusLabel(status),
      summary: resultOrGap,
      resultOrGap,
      controlIds: item.usedByControlIds ?? [],
      obligationIds: item.usedByObligationIds ?? [],
      riskIds: item.usedByRiskIds ?? [],
    }
  })
}

export function filterEvidence(rows: EvidenceRecord[], filters: EvidenceFilters) {
  const query = filters.query.trim().toLowerCase()
  return rows.filter((item) => {
    if (filters.attentionOnly && attentionRank(item) === 0) return false
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.ownerId !== 'all' && item.ownerId !== filters.ownerId) return false
    if (filters.controlId !== 'all' && !item.controlIds.includes(filters.controlId)) return false
    if (filters.usedBy === 'controls' && item.controlIds.length === 0) return false
    if (filters.usedBy === 'obligations' && item.obligationIds.length === 0) return false
    if (filters.usedBy === 'risks' && item.riskIds.length === 0) return false
    if (filters.usedBy === 'unused' && (item.controlIds.length || item.obligationIds.length || item.riskIds.length)) return false
    if (query) {
      const hay = [item.title, item.owner, item.fileType, item.id, item.code, item.statusLabel, item.resultOrGap]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })
}

export function hasEvidenceFilters(filters: EvidenceFilters) {
  const defaults = defaultEvidenceFilters()
  return (Object.keys(filters) as (keyof EvidenceFilters)[]).some((key) => filters[key] !== defaults[key])
}

export function evidenceChips(filters: EvidenceFilters) {
  const chips: { key: keyof EvidenceFilters; label: string; valueLabel: string }[] = []
  if (filters.query.trim()) chips.push({ key: 'query', label: 'Search', valueLabel: filters.query.trim() })
  if (filters.status !== 'all') chips.push({ key: 'status', label: 'Health', valueLabel: statusLabel(filters.status) })
  if (filters.ownerId !== 'all') chips.push({ key: 'ownerId', label: 'Owner', valueLabel: personById(filters.ownerId)?.name ?? filters.ownerId })
  if (filters.controlId !== 'all') chips.push({ key: 'controlId', label: 'Control', valueLabel: titleOf(data.controls, filters.controlId) })
  if (filters.usedBy !== 'all') chips.push({ key: 'usedBy', label: 'Used by', valueLabel: filters.usedBy })
  if (filters.attentionOnly) chips.push({ key: 'attentionOnly', label: 'Needs attention', valueLabel: 'Yes' })
  return chips
}

export function clearEvidenceChip(filters: EvidenceFilters, key: keyof EvidenceFilters): EvidenceFilters {
  return { ...filters, [key]: defaultEvidenceFilters()[key] }
}

export function evidenceIndicators(rows: EvidenceRecord[]) {
  const current = rows.filter((item) => item.status === 'current' || item.status === 'accepted').length
  return [
    { id: 'total' as const, label: 'Catalogue', value: String(rows.length), context: 'Records in this organisation view', filter: { status: 'all' as const } },
    { id: 'current' as const, label: 'Current', value: String(current), context: 'Can be used for this review', filter: { status: 'current' as const } },
    { id: 'missing' as const, label: 'Missing', value: String(rows.filter((item) => item.status === 'missing').length), context: 'Expected packs that are not in the catalogue', filter: { status: 'missing' as const } },
    { id: 'expiring' as const, label: 'Expiring', value: String(rows.filter((item) => item.status === 'expiring').length), context: 'Still usable, but approaching review limits', filter: { status: 'expiring' as const } },
    {
      id: 'attention' as const,
      label: 'Needs attention',
      value: String(rows.filter((item) => attentionRank(item) > 0).length),
      context: 'Missing, conflicting, duplicate, unowned or waiting',
      filter: { attentionOnly: true, status: 'all' as const },
    },
  ]
}

function attentionRank(item: EvidenceRecord) {
  if (item.status === 'missing') return 50
  if (item.status === 'conflicting') return 40
  if (item.status === 'expired') return 35
  if (item.status === 'no-owner') return 30
  if (item.status === 'awaiting-approval') return 25
  if (item.status === 'under-review') return 22
  if (item.status === 'expiring') return 20
  if (item.status === 'duplicate') return 10
  return 0
}

export function attentionEvidence(rows: EvidenceRecord[]) {
  return [...rows].filter((item) => attentionRank(item) > 0).sort((a, b) => attentionRank(b) - attentionRank(a)).slice(0, 4)
}

export function reuseRows(rows: EvidenceRecord[]) {
  return [...rows]
    .filter((item) => item.controlIds.length + item.obligationIds.length >= 2)
    .sort((a, b) => b.obligationIds.length + b.controlIds.length - (a.obligationIds.length + a.controlIds.length))
    .slice(0, 5)
}

export function buildEvidenceBriefing(rows: EvidenceRecord[], _position: PositionState) {
  const focusIds = new Set(data.demo.focusEvidenceIds)
  const focus = rows.filter((item) => focusIds.has(item.id))
  const lead = focus[0] ?? attentionEvidence(rows)[0]
  const phishingControls = data.demo.focusControlIds.map((id) => titleOf(data.controls, id)).join(' and ')
  return {
    title:
      focus.length > 0
        ? `${data.demo.story}: ${focus.map((item) => item.code).join(' / ')} are ${focus.map((item) => item.statusLabel).join(' / ')}.`
        : 'Evidence health for the current organisation view.',
    attention: lead ? `${lead.title}: ${lead.resultOrGap}` : 'Evidence in this view is current.',
    facts: (focus.length ? focus : rows.slice(0, 3)).map((item, index) => ({
      id: `f${index + 1}`,
      text: `${item.code} · ${item.statusLabel}: ${item.resultOrGap}`,
      citationId: item.id,
    })),
    interpretation: data.demo.controlBlurb,
    confidence: 'high',
    freshness: `${data.demo.snapshotDate} · phishing evidence accepted`,
    recommendedAction: data.risks.find((item) => item.id === data.demo.focusRiskId)?.nextAction ?? 'Review linked phishing evidence.',
    owner: personById(data.risks.find((item) => item.id === data.demo.focusRiskId)?.ownerId ?? '')?.name ?? 'Maya Torres',
    approval: 'Human approval is required before evidence changes the organisation position.',
    askPrompt: 'What evidence do we have?',
    sources: [
      { id: lead?.id ?? data.demo.focusEvidenceIds[0], kind: 'Evidence', title: lead?.title ?? 'Evidence' },
      { id: data.demo.focusControlIds[0], kind: 'Control', title: phishingControls },
    ],
  }
}

export function describeEvidenceDrill(filters: EvidenceFilters) {
  return {
    label: filters.status === 'all' ? `${organisation.name} evidence health` : `${statusLabel(filters.status)} evidence`,
    questions: [
      'Which evidence can we rely on?',
      'What evidence is missing, expiring or conflicting?',
      'Which evidence is blocking our assurance position?',
      'What should I do next?',
    ],
  }
}

export const peopleOptions = data.people.map((person) => ({ id: person.id, name: person.name, role: person.role }))
export const controlOptions = data.controls.map((item) => ({ id: item.id, title: item.title }))
export const periodLabel = reportingPeriod
export const organisationName = organisation.name
export { titleOf, data }
