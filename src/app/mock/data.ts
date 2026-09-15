import organisationJson from '../../../docs/mock/meridian-organisation.json' with { type: 'json' }
import type { PositionState, SourceKind } from './types.ts'

export const data = organisationJson
export const organisation = data.organisation
export const currentUser = data.currentUser
export const reportingPeriod = data.reports[0]?.period ?? 'Q3 2026'
export const prompts = data.ai.prompts
export const uploadFixtures = data.uploadFixtures
export const peopleById = Object.fromEntries(data.people.map((person) => [person.id, person]))
export const internationalFrameworks = data.frameworks.filter((item) => item.id !== 'fw-internal')

export function personById(id: string) {
  return peopleById[id]
}

export function personLabel(id: string) {
  const person = peopleById[id]
  return person ? `${person.name}, ${person.role}` : ''
}

export function personInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

export function titleOf(
  collection: { id: string; title: string }[],
  id: string,
) {
  return collection.find((item) => item.id === id)?.title ?? id
}

export function frameworkName(id: string) {
  return data.frameworks.find((item) => item.id === id)?.name ?? id
}

export function evidenceFor(position: PositionState) {
  return data.evidence.filter((item) => {
    if ('availableFromState' in item && item.availableFromState === 'after') {
      return position === 'after'
    }
    return true
  })
}

export function coverageOf(frameworkId: string, position: PositionState) {
  const framework = data.frameworks.find((item) => item.id === frameworkId)
  if (!framework) return 0
  return position === 'after' ? framework.coverageAfter : framework.coverageBefore
}

export function lookupSource(id: string, position: PositionState) {
  const person = (ownerId: string) => peopleById[ownerId]?.name ?? ''

  const evidence = data.evidence.find((item) => item.id === id)
  if (evidence) {
    const hidden = 'availableFromState' in evidence && evidence.availableFromState === 'after' && position !== 'after'
    if (!hidden) {
      const superseded = position === 'after' && evidence.id === 'evd-006'
      return {
        id,
        title: evidence.title,
        kind: 'Evidence' as SourceKind,
        freshness: superseded ? 'superseded' : evidence.freshness,
        meta: `${evidence.fileType} · ${evidence.version} · ${person(evidence.ownerId)}`,
        module: 'evidence' as const,
      }
    }
  }

  const control = data.controls.find((item) => item.id === id)
  if (control) {
    return {
      id,
      title: control.title,
      kind: 'Control' as SourceKind,
      freshness: position === 'after' ? control.assuranceAfter : control.assuranceBefore,
      meta: control.partialReason ?? 'Supports connected frameworks',
      module: 'controls' as const,
    }
  }

  const obligation = data.obligations.find((item) => item.id === id)
  if (obligation) {
    return {
      id,
      title: obligation.title,
      kind: 'Obligation' as SourceKind,
      freshness: position === 'after' ? obligation.supportAfter : obligation.supportBefore,
      meta: frameworkName(obligation.frameworkId),
      module: 'regulatory' as const,
    }
  }

  const risk = data.risks.find((item) => item.id === id)
  if (risk) {
    return {
      id,
      title: risk.title,
      kind: 'Risk' as SourceKind,
      freshness: position === 'after' ? risk.levelAfter : risk.levelBefore,
      meta: risk.contributingGap,
      module: 'risks' as const,
    }
  }

  const report = data.reports.find((item) => item.id === id)
  if (report) {
    return {
      id,
      title: report.title,
      kind: 'Report' as SourceKind,
      freshness: reportingPeriod,
      meta: report.primary ? 'Primary board report' : 'Supporting pack',
      module: 'reports' as const,
    }
  }

  return null
}

export const omar = peopleById['person-omar']
export const maya = peopleById['person-maya']
export const nadia = peopleById['person-nadia']
export const layla = peopleById['person-layla']
export const tomas = peopleById['person-tomas']
export const sara = peopleById['person-sara']

export const demo = data.demo
export const phishingRisk = data.risks.find((item) => item.id === demo.focusRiskId)
export const phishingControls = data.controls.filter((item) =>
  (demo.focusControlIds as readonly string[]).includes(item.id),
)
/** Demo focus control (CTL-005). Export name kept for existing imports. */
export const supplierControl = data.controls.find((item) => item.id === 'ctl-005')
export const phishingControl = supplierControl
export const hubAnswerBefore = data.ai.primaryHubAnswerBefore
