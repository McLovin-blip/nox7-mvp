import {
  coverageOf,
  data,
  evidenceFor,
  internationalFrameworks,
  organisation,
  personLabel,
  reportingPeriod,
} from './data.ts'
import type { PositionState } from './types.ts'
import type { NoxNavigateTarget } from '../ai/suggestions.ts'

export type ConnectNavigate = NoxNavigateTarget

export type ConnectView = {
  organisationName: string
  reviewLine: string
  overall: number
  overallLabel: string
  controlsScore: number
  evidenceScore: number
  regulatoryScore: number
  trend: number
  trendLabel: string
  whyAssurance: string
  riskExposure: {
    total: number
    segments: Array<{ key: string; label: string; value: number; color: string }>
  }
  frameworks: Array<{ id: string; name: string; coverage: number }>
  chain: {
    risks: { total: number; critical: number; medium: number }
    controls: { total: number; ineffective: number; needEvidence: number }
    regulatory: { total: number; withGaps: number; highExposure: number }
    evidence: { total: number; missing: number; attention: number }
    actions: { total: number; overdue: number; completed: number }
  }
  topRisks: Array<{
    id: string
    title: string
    domain: string
    level: string
    severity: string
    assurance: number
  }>
  regulatoryInsight: string
  priorities: Array<{
    id: string
    index: string
    title: string
    detail: string
    impact: string
    status: string
    navigate: ConnectNavigate
  }>
  insightPrompts: string[]
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function severityRank(level: string): number {
  if (level === 'elevated') return 0
  if (level === 'watch') return 1
  return 2
}

function riskAssurance(
  risk: (typeof data.risks)[number],
  position: PositionState,
): number {
  const linked = risk.controlIds
    .map((id) => data.controls.find((item) => item.id === id))
    .filter((item): item is (typeof data.controls)[number] => Boolean(item))
  if (linked.length === 0) {
    return position === 'after' ? data.position.after.readinessValue : data.position.before.readinessValue
  }
  const score = linked.reduce((sum, control) => {
    const assurance = position === 'after' ? control.assuranceAfter : control.assuranceBefore
    return sum + (assurance === 'assured' ? 100 : assurance === 'partial' ? 62 : 40)
  }, 0)
  return Math.round(score / linked.length)
}

export function buildConnectView(position: PositionState): ConnectView {
  const after = position === 'after'
  const pos = after ? data.position.after : data.position.before
  const catalogue = evidenceFor(position)
  const risks = data.risks
  const controls = data.controls
  const obligations = data.obligations.filter((item) => item.frameworkId !== 'fw-internal')
  const actions = data.actions

  const levelOf = (risk: (typeof risks)[number]) => (after ? risk.levelAfter : risk.levelBefore)
  const assuranceOf = (control: (typeof controls)[number]) =>
    after ? control.assuranceAfter : control.assuranceBefore
  const supportOf = (obligation: (typeof data.obligations)[number]) =>
    after ? obligation.supportAfter : obligation.supportBefore
  const actionStatus = (action: (typeof actions)[number]) =>
    after ? action.statusAfter : action.statusBefore

  const elevated = risks.filter((risk) => levelOf(risk) === 'elevated').length
  const watch = risks.filter((risk) => levelOf(risk) === 'watch').length
  const reduced = risks.filter((risk) => levelOf(risk) === 'reduced').length

  const controlAssured = controls.filter((control) => assuranceOf(control) === 'assured').length
  const controlPartial = controls.filter((control) => assuranceOf(control) === 'partial').length
  const needEvidence = controls.filter((control) => assuranceOf(control) !== 'assured').length
  const controlsScore = Math.round((controlAssured / Math.max(controls.length, 1)) * 100)

  const currentEvidence = catalogue.filter((item) => item.freshness === 'current' && !item.duplicateOf).length
  const expired = catalogue.filter((item) => item.freshness === 'expired' && !item.duplicateOf).length
  const expiring = catalogue.filter((item) => item.freshness === 'expiring').length
  const duplicate = catalogue.filter((item) => item.duplicateOf).length
  const missing = after ? 0 : 1
  const attention = expired + expiring + duplicate + missing
  const evidenceScore = Math.round((currentEvidence / Math.max(catalogue.length, 1)) * 100)

  const frameworks = internationalFrameworks.map((framework) => ({
    id: framework.id,
    name: framework.name,
    coverage: coverageOf(framework.id, position),
  }))
  const regulatoryScore =
    frameworks.length === 0
      ? 0
      : Math.round(frameworks.reduce((sum, item) => sum + item.coverage, 0) / frameworks.length)

  const withGaps = obligations.filter((item) => supportOf(item) !== 'supported').length
  const highExposure = obligations.filter((item) => supportOf(item) === 'partial').length

  const openActions = actions.filter((item) => actionStatus(item) === 'open').length
  const completedActions = actions.filter((item) => actionStatus(item) === 'completed').length

  const overall = pos.readinessValue
  const trend = after ? 8 : 0

  const whyAssurance = after
    ? 'Assurance improved after current critical-supplier assessments were approved. That one evidence pack strengthened the supplier-assurance control, supported related regulatory obligations, and reduced the two elevated organisational risks.'
    : 'Assurance is primarily held back by controls with insufficient evidence. The supplier-assurance control is only partially assured, which leaves related NCA, ISO 27001, NIS2 and GDPR obligations partly covered and keeps the highest organisational risks elevated.'

  const topRisks = [...risks]
    .sort((left, right) => {
      const bySeverity = severityRank(levelOf(left)) - severityRank(levelOf(right))
      if (bySeverity !== 0) return bySeverity
      return riskAssurance(left, position) - riskAssurance(right, position)
    })
    .slice(0, 5)
    .map((risk) => {
      const level = levelOf(risk)
      return {
        id: risk.id,
        title: risk.title,
        domain: risk.contributingGap,
        level,
        severity: titleCase(level),
        assurance: riskAssurance(risk, position),
      }
    })

  const priorities: ConnectView['priorities'] = []

  if (!after && needEvidence > 0) {
    priorities.push({
      id: 'priority-supplier-evidence',
      index: '01',
      title: 'Supplier evidence gap',
      detail: `${needEvidence} control${needEvidence === 1 ? '' : 's'} lack sufficient evidence — including the critical-supplier assessments owned with ${personLabel(data.actions[0].ownerId)}.`,
      impact: 'High impact',
      status: 'Action required',
      navigate: { type: 'gap', step: 'overview' },
    })
  }

  const privilegeOrThirdParty = risks.find((risk) => /third-party|privilege|access/i.test(risk.title))
  if (privilegeOrThirdParty) {
    priorities.push({
      id: 'priority-third-party',
      index: String(priorities.length + 1).padStart(2, '0'),
      title: privilegeOrThirdParty.title,
      detail: after
        ? 'Third-party exposure is reduced. Keep linked controls and evidence current through the review.'
        : 'Control effectiveness and evidence coverage on third-party assurance remain below executive tolerance.',
      impact: after ? 'In progress' : 'High impact',
      status: 'Review',
      navigate: { type: 'module', module: 'risks', recordId: privilegeOrThirdParty.id },
    })
  }

  if (withGaps > 0) {
    const weakest = [...frameworks].sort((a, b) => a.coverage - b.coverage)[0]
    priorities.push({
      id: 'priority-regulatory',
      index: String(priorities.length + 1).padStart(2, '0'),
      title: 'Regulatory obligation',
      detail: `${withGaps} international obligation${withGaps === 1 ? '' : 's'} currently have insufficient control coverage${
        weakest ? `. ${weakest.name} is the weakest framework at ${weakest.coverage}%.` : '.'
      }`,
      impact: 'Time sensitive',
      status: 'Review',
      navigate: { type: 'module', module: 'regulatory' },
    })
  }

  if (after) {
    priorities.push({
      id: 'priority-board',
      index: String(priorities.length + 1).padStart(2, '0'),
      title: 'Prepare board summary',
      detail: 'Assurance improved after evidence approval. Capture the connected story for leadership.',
      impact: 'Board ready',
      status: 'Action',
      navigate: { type: 'board' },
    })
  } else if (missing > 0 || openActions > 0) {
    priorities.push({
      id: 'priority-upload',
      index: String(priorities.length + 1).padStart(2, '0'),
      title: 'Upload missing evidence',
      detail: 'Current critical-supplier assessments are still missing from the evidence catalogue.',
      impact: 'Action required',
      status: 'Upload',
      navigate: { type: 'upload' },
    })
  }

  return {
    organisationName: organisation.name,
    reviewLine: `${reportingPeriod} · Governance review in ${organisation.review.daysRemaining} days`,
    overall,
    overallLabel: pos.readinessLabel,
    controlsScore,
    evidenceScore,
    regulatoryScore,
    trend,
    trendLabel: after ? '↑ 8% since last assessment' : 'Held by evidence gaps',
    whyAssurance,
    riskExposure: {
      total: risks.length,
      segments: [
        { key: 'elevated', label: 'Elevated', value: elevated, color: '#E25C5C' },
        { key: 'watch', label: 'Watch', value: watch, color: '#E0A84A' },
        { key: 'reduced', label: 'Reduced', value: reduced, color: '#4CAF82' },
      ].filter((segment) => segment.value > 0 || risks.length === 0),
    },
    frameworks,
    chain: {
      risks: { total: risks.length, critical: elevated, medium: watch },
      controls: { total: controls.length, ineffective: controlPartial, needEvidence },
      regulatory: { total: obligations.length, withGaps, highExposure },
      evidence: { total: catalogue.length, missing, attention },
      actions: { total: actions.length, overdue: openActions, completed: completedActions },
    },
    topRisks,
    regulatoryInsight: `${withGaps} regulatory obligation${withGaps === 1 ? '' : 's'} currently have insufficient control coverage.`,
    priorities: priorities.slice(0, 5),
    insightPrompts: [
      'What should I focus on next?',
      `Why is our assurance ${overall}%?`,
      'Show me our biggest organisational risks',
    ],
  }
}

export function explainAssurance(position: PositionState): string {
  return buildConnectView(position).whyAssurance
}
