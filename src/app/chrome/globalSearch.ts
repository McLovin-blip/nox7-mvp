import { data, evidenceFor } from '../mock/data.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'

export type GlobalSearchType = 'risk' | 'control' | 'evidence' | 'requirement' | 'framework' | 'report'

export type GlobalSearchResult = {
  id: string
  type: GlobalSearchType
  typeLabel: string
  name: string
  code?: string
  description: string
  module: ModuleId
  score: number
}

const TYPE_LABEL: Record<GlobalSearchType, string> = {
  risk: 'Risk',
  control: 'Control',
  evidence: 'Evidence',
  requirement: 'Requirement',
  framework: 'Framework',
  report: 'Report',
}

function norm(value: string) {
  return value.trim().toLowerCase()
}

function scoreMatch(query: string, id: string, code: string | undefined, name: string, description: string): number | null {
  const q = norm(query)
  if (!q) return null

  const idN = norm(id)
  const codeN = code ? norm(code) : ''
  const nameN = norm(name)
  const descN = norm(description)

  if (idN === q || codeN === q) return 300
  if (idN.startsWith(q) || codeN.startsWith(q)) return 260
  if (idN.includes(q) || codeN.includes(q)) return 220
  if (nameN === q) return 180
  if (nameN.startsWith(q)) return 150
  if (nameN.includes(q)) return 120
  if (descN.includes(q)) return 80
  return null
}

function push(
  out: GlobalSearchResult[],
  query: string,
  item: {
    id: string
    type: GlobalSearchType
    name: string
    code?: string
    description: string
    module: ModuleId
  },
) {
  const score = scoreMatch(query, item.id, item.code, item.name, item.description)
  if (score == null) return
  out.push({
    ...item,
    typeLabel: TYPE_LABEL[item.type],
    score,
  })
}

/** Client-side global search across the shared Meridian mock dataset. */
export function searchEstate(query: string, position: PositionState): GlobalSearchResult[] {
  const q = query.trim()
  if (!q) return []

  const out: GlobalSearchResult[] = []

  for (const risk of data.risks) {
    const residual = position === 'after' ? risk.residualAfter : risk.residualBefore
    push(out, q, {
      id: risk.id,
      type: 'risk',
      name: risk.title,
      code: risk.code,
      description: [risk.category, residual.rating, risk.cause, risk.businessImpact, risk.whatCouldHappen]
        .filter(Boolean)
        .join(' · '),
      module: 'risks',
    })
  }

  for (const control of data.controls) {
    push(out, q, {
      id: control.id,
      type: 'control',
      name: control.title,
      code: control.code,
      description: [control.categoryId, control.purpose, ...(control.mappingLabels ?? [])].filter(Boolean).join(' · '),
      module: 'controls',
    })
  }

  for (const evidence of evidenceFor(position)) {
    push(out, q, {
      id: evidence.id,
      type: 'evidence',
      name: evidence.title,
      code: evidence.code,
      description: [evidence.fileType, evidence.resultOrGap].filter(Boolean).join(' · '),
      module: 'evidence',
    })
  }

  for (const obligation of data.obligations) {
    const framework = data.frameworks.find((item) => item.id === obligation.frameworkId)?.name
    push(out, q, {
      id: obligation.id,
      type: 'requirement',
      name: obligation.title,
      code: obligation.code,
      description: [framework, obligation.theme].filter(Boolean).join(' · '),
      module: 'regulatory',
    })
  }

  for (const framework of data.frameworks) {
    push(out, q, {
      id: framework.id,
      type: 'framework',
      name: framework.name,
      code: framework.id.replace(/^fw-/, '').toUpperCase(),
      description: `Coverage ${position === 'after' ? framework.coverageAfter : framework.coverageBefore}%`,
      module: 'regulatory',
    })
  }

  for (const report of data.reports) {
    push(out, q, {
      id: report.id,
      type: 'report',
      name: report.title,
      code: report.id,
      description: [report.period, report.description].filter(Boolean).join(' · '),
      module: 'reports',
    })
  }

  return out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 40)
}
