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

export type ConnectRelationshipNode = {
  id: string
  code: string
  title: string
  kind: 'Risk' | 'Control' | 'Evidence'
  summary: string
  status?: string
  navigate: ConnectNavigate
}

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
  relationshipStrip: {
    story: string
    controlBlurb: string
    risk: ConnectRelationshipNode
    controls: ConnectRelationshipNode[]
    evidence: ConnectRelationshipNode[]
  }
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

function demoFocusIds() {
  const demo = data.demo
  return {
    riskId: demo.focusRiskId,
    controlIds: new Set(demo.focusControlIds),
    evidenceIds: new Set(demo.focusEvidenceIds),
  }
}

export function buildConnectView(position: PositionState): ConnectView {
  const after = position === 'after'
  const pos = after ? data.position.after : data.position.before
  const catalogue = evidenceFor(position)
  const risks = data.risks
  const focus = demoFocusIds()
  const storyControlIds = focus.controlIds
  const controls = data.controls.filter((item) => storyControlIds.has(item.id))
  const focusRisk = risks.find((item) => item.id === focus.riskId) ?? risks.find((item) => item.demoFocus)
  const obligations = data.obligations.filter(
    (item) => item.frameworkId !== 'fw-internal' && item.includeInHub !== false,
  )
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

  const focusEvidence = catalogue.filter((item) => focus.evidenceIds.has(item.id))
  const currentEvidence = focusEvidence.filter((item) => item.freshness === 'current' && !item.duplicateOf).length
  const expired = catalogue.filter((item) => item.freshness === 'expired' && !item.duplicateOf).length
  const expiring = catalogue.filter((item) => item.freshness === 'expiring').length
  const duplicate = catalogue.filter((item) => item.duplicateOf).length
  const missing = 0
  const attention = expired + expiring + duplicate + missing
  const evidenceScore = Math.round((currentEvidence / Math.max(focusEvidence.length || 1, 1)) * 100)

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
    ? 'Assurance holds because phishing-resistant MFA and email threat protection remain effective, with accepted evidence for privileged-user enrollment and blocked test campaigns. Residual phishing exposure stays within appetite under monitoring.'
    : 'Assurance is shaped by the phishing storyline: RSK-002 remains within appetite with Moderate residual, while CTL-005 and CTL-006 are effective and EVD-005 / EVD-006 are accepted. The open coaching action keeps the residual under active monitoring.'

  const topRisks = [...risks]
    .sort((left, right) => {
      const leftFocus = left.id === focus.riskId || left.demoFocus ? 0 : 1
      const rightFocus = right.id === focus.riskId || right.demoFocus ? 0 : 1
      if (leftFocus !== rightFocus) return leftFocus - rightFocus
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

  const relationshipStrip: ConnectView['relationshipStrip'] = {
    story: data.demo.story,
    controlBlurb: data.demo.controlBlurb,
    risk: {
      id: focusRisk?.id ?? focus.riskId,
      code: focusRisk?.code ?? data.demo.focusRiskCode,
      title: focusRisk?.title ?? data.demo.story,
      kind: 'Risk',
      summary: focusRisk?.whatCouldHappen ?? focusRisk?.contributingGap ?? data.demo.story,
      status: focusRisk?.appetiteLabel ?? focusRisk?.residualLabel,
      navigate: { type: 'module', module: 'risks', recordId: focusRisk?.id ?? focus.riskId },
    },
    controls: data.demo.focusControlIds.map((id) => {
      const control = data.controls.find((item) => item.id === id)
      return {
        id,
        code: control?.code ?? id.toUpperCase(),
        title: control?.title ?? id,
        kind: 'Control' as const,
        summary: control?.purpose ?? data.demo.controlBlurb,
        status: control?.effectivenessLabel,
        navigate: { type: 'module' as const, module: 'controls' as const, recordId: id },
      }
    }),
    evidence: data.demo.focusEvidenceIds.map((id) => {
      const evidence = catalogue.find((item) => item.id === id) ?? data.evidence.find((item) => item.id === id)
      return {
        id,
        code: evidence?.code ?? id.toUpperCase(),
        title: evidence?.title ?? id,
        kind: 'Evidence' as const,
        summary: evidence?.resultOrGap ?? evidence?.summary ?? '',
        status: evidence?.statusLabel,
        navigate: { type: 'module' as const, module: 'evidence' as const, recordId: id },
      }
    }),
  }

  const priorities: ConnectView['priorities'] = []

  if (focusRisk) {
    priorities.push({
      id: 'priority-phishing-risk',
      index: '01',
      title: focusRisk.title,
      detail: `${focusRisk.code} · Residual ${focusRisk.residualLabel} · ${focusRisk.appetiteLabel}. Next: ${focusRisk.nextAction}`,
      impact: focusRisk.demoFocus ? 'Demo focus' : 'High impact',
      status: focusRisk.actionStatus,
      navigate: { type: 'module', module: 'risks', recordId: focusRisk.id },
    })
  }

  const coaching = actions.find((item) => item.id === 'act-phishing-coach') ?? actions[0]
  if (coaching) {
    priorities.push({
      id: 'priority-phishing-action',
      index: String(priorities.length + 1).padStart(2, '0'),
      title: coaching.title,
      detail: `${personLabel(coaching.ownerId)} owns the next coaching step for ${data.demo.focusRiskCode}.`,
      impact: 'Culture',
      status: actionStatus(coaching) === 'open' ? 'Open' : 'Completed',
      navigate: { type: 'module', module: 'risks', recordId: focus.riskId },
    })
  }

  priorities.push({
    id: 'priority-phishing-report',
    index: String(priorities.length + 1).padStart(2, '0'),
    title: 'Phishing Risk Summary',
    detail: 'Open the primary report for assessment, controls, evidence findings and the owned next action.',
    impact: 'Board ready',
    status: 'Review',
    navigate: { type: 'board' },
  })

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

  // Lightly surface one additional mapped risk that shares focus controls (not every record).
  const relatedMapping = data.mappings.find(
    (item) =>
      item.riskId !== focus.riskId &&
      (focus.controlIds.has(item.controlId) || focus.evidenceIds.has(item.evidenceId)),
  )
  if (relatedMapping) {
    const relatedRisk = risks.find((item) => item.id === relatedMapping.riskId)
    if (relatedRisk) {
      priorities.push({
        id: 'priority-related-mapping',
        index: String(priorities.length + 1).padStart(2, '0'),
        title: relatedRisk.title,
        detail: `Also linked through ${relatedMapping.controlCode} / ${relatedMapping.evidenceCode} in the mapping set.`,
        impact: 'Related',
        status: 'Mapped',
        navigate: { type: 'module', module: 'risks', recordId: relatedRisk.id },
      })
    }
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
    trendLabel: after ? '↑ 8% since last assessment' : 'Phishing residual within appetite',
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
      evidence: { total: focusEvidence.length || catalogue.length, missing, attention },
      actions: { total: actions.length, overdue: openActions, completed: completedActions },
    },
    topRisks,
    relationshipStrip,
    regulatoryInsight: `${withGaps} regulatory obligation${withGaps === 1 ? '' : 's'} currently have insufficient control coverage.`,
    priorities: priorities.slice(0, 5),
    insightPrompts: [
      'What is our biggest current risk?',
      'Open the phishing risk',
      'How are we protecting against phishing?',
      'What should I prioritise?',
    ],
  }
}

export function explainAssurance(position: PositionState): string {
  return buildConnectView(position).whyAssurance
}
