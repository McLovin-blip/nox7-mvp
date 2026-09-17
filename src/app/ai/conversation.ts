import {
  data,
  hubAnswerBefore,
  lookupSource,
  organisation,
  personLabel,
  prompts,
} from '../mock/data.ts'
import type { AiPanelModel, GapStepId, HubFocus, ModuleId, PositionState } from '../mock/types.ts'
import { answerFor, gapAiFor, hubAiFor } from './answers.ts'
import { contextualQuestions } from './suggestions.ts'

export type ChatCitation = {
  id: string
  title: string
  kind: string
}

export type ConversationTopic =
  | 'supplier-gap'
  | 'evidence'
  | 'control'
  | 'risk'
  | 'board'
  | 'position'
  | 'next-action'
  | 'general'

export type ChatMessage = {
  id: string
  role: 'user' | 'nox'
  text: string
  citations?: ChatCitation[]
  suggestions?: string[]
  topic?: ConversationTopic
}

export type ConversationContext = {
  position: PositionState
  module: ModuleId | 'gap'
  selectedId?: string | null
  selectedTitle?: string
  hubFocus?: HubFocus | null
  gapStep?: GapStepId
  riskDrill?: { label: string; questions: string[] } | null
  controlDrill?: { label: string; questions: string[] } | null
}

export const EMPTY_SUGGESTIONS = [
  'What is our biggest current risk?',
  'Open the phishing risk',
  'How are we protecting against phishing?',
  'What should I prioritise?',
  'What evidence do we have?',
  'What should we do next?',
]

function suggestionsFor(ctx: ConversationContext, fallback?: string[]) {
  const contextual = contextualQuestions(ctx, 4)
  if (contextual.length > 0) return contextual
  return fallback ?? EMPTY_SUGGESTIONS.slice(0, 4)
}

type Reply = Omit<ChatMessage, 'id' | 'role'>

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function norm(value: string) {
  return value.trim().toLowerCase().replace(/[’']/g, "'")
}

function ownerName(id: string | undefined) {
  if (!id) return 'the accountable owner'
  return personLabel(id).split(',')[0]
}

function citationsFrom(ids: Array<string | undefined>, position: PositionState): ChatCitation[] {
  const seen = new Set<string>()
  const out: ChatCitation[] = []
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    const source = lookupSource(id, position)
    if (source) out.push({ id, title: source.title, kind: source.kind })
  }
  return out
}

function factsToCitations(answer: AiPanelModel, position: PositionState) {
  return citationsFrom(
    answer.facts.map((fact) => fact.citationId),
    position,
  )
}

function screenLabel(ctx: ConversationContext) {
  if (ctx.module === 'gap') return 'Connected phishing assurance'
  if (ctx.module === 'hub') return 'Executive Hub'
  if (ctx.module === 'connect') return 'Nox Connect'
  if (ctx.module === 'regulatory') return 'Regulatory'
  if (ctx.module === 'controls') return 'Controls'
  if (ctx.module === 'evidence') return 'Evidence'
  if (ctx.module === 'risks') return 'Risks'
  if (ctx.module === 'reports') return 'Reports'
  return 'Activity'
}

function matchPromptList(question: string, list: string[]) {
  const q = norm(question)
  return (
    list.find((item) => norm(item) === q) ??
    list.find((item) => q.includes(norm(item)) || norm(item).includes(q))
  )
}

function lastNox(history: ChatMessage[]) {
  return [...history].reverse().find((item) => item.role === 'nox')
}

function composeFromAnswer(
  answer: AiPanelModel,
  ctx: ConversationContext,
  topic: ConversationTopic,
  mode: 'full' | 'short' = 'full',
): Reply {
  if (mode === 'short') {
    return {
      text: answer.executiveAnswer,
      citations: factsToCitations(answer, ctx.position),
      suggestions: suggestionsFor(ctx, answer.prompts.slice(0, 3)),
      topic,
    }
  }

  const after = ctx.position === 'after'
  const parts = [answer.executiveAnswer, '', `Why it matters: ${answer.interpretation}`]

  if (answer.facts.length > 0) {
    parts.push('', 'From the records:')
    for (const fact of answer.facts.slice(0, 3)) parts.push(`• ${fact.text}`)
  }

  parts.push('', `Recommendation: ${answer.recommendedAction}`)
  if (!after) parts.push(answer.approval)
  if (answer.expectedImpact) parts.push(`Expected effect: ${answer.expectedImpact}`)

  return {
    text: parts.join('\n'),
    citations: factsToCitations(answer, ctx.position),
    suggestions: suggestionsFor(ctx, answer.prompts.slice(0, 4)),
    topic,
  }
}

function phishingFocusReply(ctx: ConversationContext): Reply {
  const risk = data.risks.find((item) => item.id === data.demo.focusRiskId)
  const controls = data.demo.focusControlIds
  const evidence = data.demo.focusEvidenceIds
  return {
    text: [
      `Start with ${data.demo.focusRiskCode} — ${risk?.title ?? data.demo.story}.`,
      '',
      risk?.whatCouldHappen ?? data.demo.story,
      '',
      `Inherent ${risk?.inherentLabel ?? 'High'}; residual ${risk?.residualLabel ?? 'Moderate'}; ${risk?.appetiteLabel ?? 'Within Appetite'}.`,
      '',
      data.demo.controlBlurb,
      '',
      `Next action: ${risk?.nextAction ?? 'Coach repeat-click users'}. Owner: ${ownerName(risk?.ownerId)}. Due: ${risk?.dueDate ?? '15 Oct 2026'}.`,
      '',
      'Would you like the linked controls, the evidence findings, or the next action detail?',
    ].join('\n'),
    citations: citationsFrom([risk?.id, ...controls, ...evidence, 'rep-phishing-summary'], ctx.position),
    suggestions: [
      'What is this risk?',
      'How are we protecting against it?',
      'What evidence do we have?',
      'What should we do next?',
    ],
    topic: 'risk',
  }
}

function supplierGapReply(ctx: ConversationContext): Reply {
  return phishingFocusReply(ctx)
}

function missingEvidenceReply(ctx: ConversationContext): Reply {
  const packs = data.demo.focusEvidenceIds
    .map((id) => data.evidence.find((item) => item.id === id))
    .filter((item): item is (typeof data.evidence)[number] => Boolean(item))
  return {
    text: [
      'For the phishing walkthrough, the linked evidence is already accepted.',
      '',
      'From the records:',
      ...packs.map((item) => `• ${item.code}: ${item.statusLabel} — ${item.resultOrGap ?? item.summary}`),
      '',
      'Recommendation: Keep EVD-005 and EVD-006 current while the Learning Manager completes the coaching action.',
    ].join('\n'),
    citations: citationsFrom([...data.demo.focusEvidenceIds, data.demo.focusRiskId], ctx.position),
    suggestions: ['What evidence do we have?', 'How are we protecting against it?', 'What should we do next?'],
    topic: 'evidence',
  }
}

function nextActionReply(ctx: ConversationContext): Reply {
  const risk = data.risks.find((item) => item.id === (ctx.selectedId?.startsWith('risk-') ? ctx.selectedId : data.demo.focusRiskId))
  const action = data.actions.find((item) => item.id === 'act-phishing-coach') ?? data.actions[0]
  return {
    text: [
      `Next action: ${risk?.nextAction ?? action?.title ?? 'Coach repeat-click users and retest reporting behavior.'}`,
      '',
      `Owner: ${ownerName(risk?.ownerId ?? action?.ownerId)} (${personLabel(risk?.ownerId ?? action?.ownerId)}). Due: ${risk?.dueDate ?? '2026-10-15'}. Status: ${risk?.actionStatus ?? 'Monitoring'}.`,
      '',
      'Why it matters: the linked phishing controls are effective and evidenced; the remaining work is cultural coaching and retesting.',
      '',
      'Recommendation: Open RSK-002, confirm CTL-005 / CTL-006 with EVD-005 / EVD-006, then track the Learning Manager action.',
    ].join('\n'),
    citations: citationsFrom([risk?.id ?? data.demo.focusRiskId, ...data.demo.focusControlIds, ...data.demo.focusEvidenceIds, 'rep-phishing-summary'], ctx.position),
    suggestions: [
      'What is this risk?',
      'How are we protecting against it?',
      'What evidence do we have?',
      'Open the phishing risk',
    ],
    topic: 'next-action',
  }
}

function positionReply(ctx: ConversationContext): Reply {
  const answer = hubAiFor(ctx.position)
  const after = ctx.position === 'after'
  return {
    text: [
      after
        ? `Yes — ${organisation.name}'s position has improved after approval.`
        : `${organisation.name}'s assurance position is still low because the material supplier-assurance gap remains open.`,
      '',
      answer.executiveAnswer,
      '',
      `Why it matters: ${answer.interpretation}`,
      '',
      `Recommendation: ${answer.recommendedAction}`,
    ].join('\n'),
    citations: factsToCitations(answer, ctx.position),
    suggestions: ['Open the phishing risk', 'What should I prioritise?', 'How are we protecting against phishing?'],
    topic: 'position',
  }
}

function recordWhyReply(ctx: ConversationContext): Reply | null {
  if (!ctx.selectedId) return null
  const source = lookupSource(ctx.selectedId, ctx.position)
  const title = ctx.selectedTitle || source?.title || 'This record'
  const after = ctx.position === 'after'

  if (ctx.selectedId.startsWith('ev-')) {
    const evidence = data.evidence.find((item) => item.id === ctx.selectedId)
    return {
      text: [
        `${title} matters because it is part of ${organisation.name}'s evidence health for this review.`,
        '',
        `Current status: ${evidence?.freshness ?? source?.freshness ?? 'known from catalogue'}.`,
        after
          ? 'In the current position, approved assessments are what moved coverage and risk. Older or duplicate packs stay visible so the catalogue stays honest.'
          : 'Until current assessments are approved, policy alone cannot close the supplier-assurance gap.',
        '',
        'Would you like the connected control, or the recommended next action?',
      ].join('\n'),
      citations: citationsFrom([ctx.selectedId, ...data.demo.focusControlIds], ctx.position),
      suggestions: ['What should we do next?', 'How are we protecting against it?'],
      topic: 'evidence',
    }
  }

  if (ctx.selectedId.startsWith('ctl-')) {
    const control = data.controls.find((item) => item.id === ctx.selectedId)
    const status = after ? control?.overallAfter ?? control?.assuranceAfter : control?.overallBefore ?? control?.assuranceBefore
    return {
      text: [
        'Sourced facts:',
        `${title} overall assurance is ${status}. Design ${after ? control?.designAfter : control?.designBefore}; operation ${after ? control?.operatingAfter : control?.operatingBefore}; evidence ${after ? control?.evidenceHealthAfter : control?.evidenceHealthBefore}.`,
        '',
        'Nox AI interpretation:',
        control?.whyBefore && !after
          ? control.whyBefore
          : control?.whyAfter && after
            ? control.whyAfter
            : `${title} sits on the path from frameworks and obligations to evidence and protected risks.`,
        '',
        `Confidence: high. Data freshness: ${after ? control?.evidenceHealthAfter : control?.evidenceHealthBefore}.`,
        '',
        `Recommended action: ${after ? control?.nextActionAfter : control?.nextActionBefore}.`,
        'Human approval is required before the organisation position changes.',
      ]
        .filter(Boolean)
        .join('\n'),
      citations: citationsFrom(
        [ctx.selectedId, ...(after ? control?.evidenceIdsAfter ?? [] : control?.evidenceIdsBefore ?? []).slice(0, 2)],
        ctx.position,
      ),
      suggestions: ['Why can this control not be relied upon?', 'What evidence is missing, expiring or conflicting?'],
      topic: 'control',
    }
  }

  if (ctx.selectedId.startsWith('risk-')) {
    const risk = data.risks.find((item) => item.id === ctx.selectedId)
    const residual = after ? risk?.residualAfter : risk?.residualBefore
    const appetite = after ? risk?.appetiteStatusAfter : risk?.appetiteStatusBefore
    const coverage = after ? risk?.controlCoverageAfter : risk?.controlCoverageBefore
    const treatment = after ? risk?.treatment.statusAfter : risk?.treatment.statusBefore
    const controlId = risk?.controlIds[0] ?? data.demo.focusControlIds[0]
    return {
      text: [
        '### Fact',
        `${title} currently has residual risk ${residual?.score ?? 'n/a'} (${residual?.rating ?? 'n/a'}).`,
        risk
          ? `Appetite is ${appetite}; control coverage is ${coverage}; treatment is ${treatment}.`
          : '',
        risk ? `Linked controls: ${risk.controlIds.length}. Linked obligations: ${risk.obligationIds.length}.` : '',
        '',
        '### Why it matters',
        risk?.contributingGap
          ? risk.contributingGap
          : `${title} remains on the executive radar because of connected control and compliance exposure.`,
        '',
        '### Recommended action',
        after
          ? 'Keep monitoring residual exposure and cite the improved evidence in reporting.'
          : treatment === 'overdue' || treatment === 'at-risk'
            ? 'Bring the treatment plan back on track and close the linked evidence gaps before the review.'
            : 'Strengthen the linked controls and evidence so residual risk can move toward target.',
      ]
        .filter(Boolean)
        .join('\n'),
      citations: citationsFrom([ctx.selectedId, controlId, ...(risk?.obligationIds.slice(0, 2) ?? [])], ctx.position),
      suggestions: [
        'Which controls are ineffective?',
        'Which evidence is missing?',
        'Is the treatment plan on track?',
        'What should I do next?',
      ],
      topic: 'risk',
    }
  }

  return {
    text: [
      `${title} is part of the current ${screenLabel(ctx)} context for ${organisation.name}.`,
      '',
      source ? `Record type: ${source.kind}. Status: ${source.freshness}.` : '',
      source?.meta ? source.meta : '',
      '',
      'Ask me what to do next, or how this connects to the phishing walkthrough.',
    ]
      .filter(Boolean)
      .join('\n'),
    citations: citationsFrom([ctx.selectedId], ctx.position),
      suggestions: suggestionsFor(ctx),
      topic: 'general',
    }
  }

function controlAndEvidenceReply(ctx: ConversationContext): Reply {
  const controls = data.demo.focusControlIds
    .map((id) => data.controls.find((item) => item.id === id))
    .filter((item): item is (typeof data.controls)[number] => Boolean(item))
  const evidence = data.demo.focusEvidenceIds
    .map((id) => data.evidence.find((item) => item.id === id))
    .filter((item): item is (typeof data.evidence)[number] => Boolean(item))
  return {
    text: [
      'Here are the phishing protections and evidence.',
      '',
      data.demo.controlBlurb,
      '',
      ...controls.map((item) => `• ${item.code} ${item.title} — ${item.effectivenessLabel}`),
      ...evidence.map((item) => `• ${item.code} ${item.title}: ${item.statusLabel} — ${item.resultOrGap ?? item.summary}`),
      '',
      'Recommendation: Keep these records open while you walk RSK-002.',
    ].join('\n'),
    citations: citationsFrom([...data.demo.focusControlIds, ...data.demo.focusEvidenceIds, data.demo.focusRiskId], ctx.position),
    suggestions: ['What is this risk?', 'What should we do next?', 'What evidence do we have?'],
    topic: 'control',
  }
}

function followUpReply(question: string, ctx: ConversationContext, history: ChatMessage[]): Reply | null {
  const q = norm(question)
  const prior = lastNox(history)
  const topic = prior?.topic ?? 'general'

  if (/^(yes|yeah|yep|ok|okay|sure|please|do it|show me|show them)\b/.test(q) || q === 'yes') {
    if (topic === 'supplier-gap' || topic === 'control' || topic === 'evidence') {
      return controlAndEvidenceReply(ctx)
    }
    if (topic === 'next-action' || topic === 'board') {
      return composeFromAnswer(
        answerFor({
          module: 'reports',
          position: ctx.position,
          question: prompts.reports[0],
        }),
        ctx,
        'board',
      )
    }
  }

  if (/show me the affected control|affected control and evidence|show the control/.test(q)) {
    return controlAndEvidenceReply(ctx)
  }

  if (/why is this a problem|why does this matter|why is that|why is this important|why\?$/.test(q)) {
    const recordReply = recordWhyReply(ctx)
    if (recordReply) return recordReply
    if (topic === 'supplier-gap' || topic === 'risk' || topic === 'evidence' || topic === 'control') {
      return {
        text:
          ctx.position === 'after'
            ? 'It mattered because missing assessments left four frameworks only partly supported and kept third-party and regulatory exposure elevated. That is now closed for this review.'
            : 'It is a problem because a current policy cannot substitute for current assessments. The same gap weakens the control, leaves obligations only partly supported, and elevates third-party and regulatory risk before the review.',
        citations: citationsFrom(['ctl-005', 'risk-002', 'risk-002'], ctx.position),
        suggestions: ['What should I do next?', 'Show me the affected control and evidence.'],
        topic,
      }
    }
  }

  if (/what should i do next|what next|next step|what do you recommend/.test(q)) {
    return nextActionReply(ctx)
  }

  return null
}

function frameworkCompareReply(ctx: ConversationContext): Reply {
  const after = ctx.position === 'after'
  return {
    text: after
      ? [
          'All four international frameworks improved after the same approval.',
          '',
          'ISO 27001 86% · NIS2 82% · GDPR 80% · NCA ECC 79%.',
          '',
          'Why it matters: they were never four separate projects. Current assessments support the shared supplier-assurance control, so coverage moved together.',
          '',
          'Recommendation: Cite this comparison in the Board Summary. A duplicate questionnaire remains a catalogue watch item.',
        ].join('\n')
      : [
          'Four international frameworks are in scope: ISO 27001 78%, NIS2 71%, GDPR 69% and NCA ECC 66%. Average coverage is 71%.',
          '',
          'Why it matters: each is limited by the same missing critical-supplier assessments. ISO 27001 still has two of three obligations supported; NIS2, GDPR and NCA ECC each have their supplier obligation only partly supported.',
          '',
          'Recommendation: Close the supplier evidence package once. That is more efficient than treating each framework as a separate gap.',
        ].join('\n'),
    citations: citationsFrom(
      after
        ? ['evd-005', 'ctl-005', 'obl-iso-a532']
        : ['ctl-005', 'obl-iso-a532', 'obl-nis2-supply', 'obl-gdpr-processor', 'obl-nca-third-party'],
      ctx.position,
    ),
    suggestions: after
      ? ['Has our position improved?', 'Summarise this for the board.']
      : ['Which gap affects the most frameworks?', 'What should I do next?'],
    topic: 'supplier-gap',
  }
}

function frameworkDetailReply(name: string, ctx: ConversationContext): Reply {
  const after = ctx.position === 'after'
  const framework = data.frameworks.find((item) => item.name.toLowerCase() === name.toLowerCase())
  const coverage = after ? framework?.coverageAfter : framework?.coverageBefore
  const obligation = data.obligations.find((item) => item.frameworkId === framework?.id && item.supportBefore === 'partial')
  return {
    text: after
      ? [
          `${framework?.name ?? name} coverage is now ${coverage}%, up from ${framework?.coverageBefore}%.`,
          '',
          `Why it matters: the supplier-related obligation is supported by current assessments, not by a separate ${framework?.name ?? name} workstream.`,
          '',
          'Recommendation: Keep this movement in the Board Summary narrative.',
        ].join('\n')
      : [
          `${framework?.name ?? name} is at ${coverage}% coverage.`,
          '',
          `Why it is only partly covered: ${obligation?.title ?? 'the supplier-related obligation'} is supported by a current policy, but current critical-supplier assessments are missing.`,
          '',
          'The same gap also limits NIS2, GDPR and NCA ECC. Closing one evidence package is the action.',
        ].join('\n'),
    citations: citationsFrom(
      [obligation?.id, 'ctl-005', after ? 'evd-005' : 'evd-005'],
      ctx.position,
    ),
    suggestions: ['How do the four frameworks compare?', 'What should I do next?'],
    topic: 'supplier-gap',
  }
}

function hubObjectReply(question: string, ctx: ConversationContext): Reply | null {
  const q = norm(question)
  const focus = ctx.hubFocus
  if (/how do the four frameworks compare|frameworks compare|framework coverage/.test(q)) {
    return frameworkCompareReply(ctx)
  }
  const named = ['ISO 27001', 'NIS2', 'GDPR', 'NCA ECC'].find((name) => q.includes(name.toLowerCase()))
  if (named && /cover|gap|partial|oblig/.test(q)) {
    return frameworkDetailReply(named, ctx)
  }
  if (focus?.kind === 'framework' && (/why is|partly covered|coverage change/.test(q) || q.includes(focus.title.toLowerCase()))) {
    return frameworkDetailReply(focus.title, ctx)
  }
  if (focus?.kind === 'map' && /explain|connected|this layer|this node/.test(q)) {
    if (focus.id === 'frameworks') return frameworkCompareReply(ctx)
    if (focus.id === 'obligations') {
      return {
        text: ctx.position === 'after'
          ? 'The four international supplier-related obligations are now supported by the same current assessments.'
          : 'Four international obligations are only partly supported. They share the supplier-assurance policy and control, and none is fully supported until current assessments exist.',
        citations: citationsFrom(
          ['obl-iso-a532', 'obl-nis2-supply', 'obl-gdpr-processor', 'obl-nca-third-party'],
          ctx.position,
        ),
        suggestions: ['Which gap affects the most frameworks?', 'What should I do next?'],
        topic: 'supplier-gap',
      }
    }
    if (focus.id === 'owners') return nextActionReply(ctx)
  }
  return null
}

function intentReply(question: string, ctx: ConversationContext): Reply | null {
  const focused = hubObjectReply(question, ctx)
  if (focused) return focused

  const q = norm(question)

  if (
    ((/biggest (current )?risk|top risk|largest risk/.test(q) || /what is our biggest/.test(q)) && /risk/.test(q)) ||
    /open the phishing risk|phishing risk|protecting against phishing/.test(q)
  ) {
    return phishingFocusReply(ctx)
  }

  if (/missing evidence|where are we missing|evidence gap|incomplete evidence|expiring or conflicting/.test(q)) {
    return missingEvidenceReply(ctx)
  }

  if (/supplier assurance gap|assurance gaps|supplier gap|biggest.*gap|material gap/.test(q)) {
    return supplierGapReply(ctx)
  }

  if (/controls can we rely|unverifiable|not be relied|greatest effect on nis2|insufficient for this risk/.test(q) && (ctx.module === 'controls' || /control/.test(q))) {
    return composeFromAnswer(
      answerFor({
        module: 'controls',
        position: ctx.position,
        question: question,
        selectedId: ctx.selectedId ?? undefined,
        selectedTitle: ctx.selectedTitle,
      }),
      ctx,
      'control',
    )
  }

  if (/priorit|highest-impact|requires my attention|what should i focus|what should i do next/.test(q)) {
    return nextActionReply(ctx)
  }

  if (/assurance position low|position low|has our position improved|current position|readiness|why is our assurance/.test(q)) {
    return positionReply(ctx)
  }

  if (/summarise|summarize|for the board|board summary|executive summary/.test(q)) {
    return composeFromAnswer(
      answerFor({
        module: 'reports',
        position: ctx.position,
        question: matchPromptList(question, prompts.reports) ?? prompts.reports[0],
        selectedId: ctx.selectedId ?? undefined,
        selectedTitle: ctx.selectedTitle,
      }),
      ctx,
      'board',
    )
  }

  if ((/why is this important|why is this a problem|why is this/.test(q)) && ctx.selectedId) {
    return recordWhyReply(ctx)
  }

  return null
}

export function buildNoxReply(
  question: string,
  ctx: ConversationContext,
  history: ChatMessage[],
): ChatMessage {
  const trimmed = question.trim()
  const follow = followUpReply(trimmed, ctx, history)
  if (follow) return { id: uid('nox'), role: 'nox', ...follow }

  const intent = intentReply(trimmed, ctx)
  if (intent) return { id: uid('nox'), role: 'nox', ...intent }

  if (ctx.module === 'gap') {
    const step = ctx.gapStep ?? 'overview'
    const answer = gapAiFor(ctx.position)[step]
    const short = /^(why|how|who|when)\b/.test(norm(trimmed)) && trimmed.length < 48
    return {
      id: uid('nox'),
      role: 'nox',
      ...composeFromAnswer(answer, ctx, 'supplier-gap', short ? 'short' : 'full'),
    }
  }

  const modulePrompts =
    ctx.module === 'hub' || ctx.module === 'connect'
      ? prompts.hub
      : ctx.module === 'regulatory'
        ? prompts.regulatory
        : ctx.module === 'controls'
          ? prompts.controls
          : ctx.module === 'evidence'
            ? prompts.evidence
            : ctx.module === 'risks'
              ? prompts.risks
              : ctx.module === 'reports'
                ? prompts.reports
                : prompts.activity

  const matched =
    matchPromptList(trimmed, modulePrompts) ??
    matchPromptList(trimmed, [...prompts.hub, ...prompts.evidence, ...prompts.risks, ...prompts.reports])

  const answer = answerFor({
    module: ctx.module,
    position: ctx.position,
    question: matched ?? trimmed,
    selectedId: ctx.selectedId ?? undefined,
    selectedTitle: ctx.selectedTitle,
  })

  const short =
    trimmed.length < 42 && /^(why|how|who|when|ok|thanks|thank you)\b/.test(norm(trimmed))

  const offScript =
    answer.executiveAnswer.includes('I can answer from') ||
    answer.interpretation.toLowerCase().includes('will not invent')

  if (offScript) {
    return {
      id: uid('nox'),
      role: 'nox',
      text: [
        `I can help from ${organisation.name}'s seeded records while you are on ${screenLabel(ctx)}.`,
        ctx.selectedTitle ? `You currently have “${ctx.selectedTitle}” selected.` : '',
        '',
        `Fact: readiness is ${ctx.position === 'after' ? '72 (Improved)' : '64 (Needs attention)'} and the focus story is ${data.demo.story} (${data.demo.focusRiskCode}).`,
        '',
        'Interpretation: I will not invent obligations, evidence or scores outside this organisation dataset.',
        '',
        'Try one of the suggestions below, or ask about the phishing risk, linked controls, evidence, or next action.',
      ]
        .filter(Boolean)
        .join('\n'),
      citations: citationsFrom(
        [data.demo.focusRiskId, ...data.demo.focusControlIds, ...data.demo.focusEvidenceIds],
        ctx.position,
      ),
      suggestions: suggestionsFor(ctx),
      topic: 'general',
    }
  }

  return {
    id: uid('nox'),
    role: 'nox',
    ...composeFromAnswer(
      answer,
      ctx,
      matched?.toLowerCase().includes('board') ? 'board' : 'general',
      short ? 'short' : 'full',
    ),
  }
}

export function createUserMessage(text: string): ChatMessage {
  return { id: uid('user'), role: 'user', text: text.trim() }
}

export function contextBanner(ctx: ConversationContext) {
  const bits = [
    organisation.name,
    screenLabel(ctx),
    ctx.position === 'after' ? 'Position improved' : 'Position needs attention',
  ]
  if (ctx.hubFocus?.title) bits.push(ctx.hubFocus.title)
  else if (ctx.selectedTitle) bits.push(ctx.selectedTitle)
  else if (ctx.riskDrill?.label) bits.push(ctx.riskDrill.label)
  else if (ctx.controlDrill?.label) bits.push(ctx.controlDrill.label)
  return bits.join(' · ')
}

export function welcomeText(ctx: ConversationContext) {
  const firstFact = hubAnswerBefore.sourcedFacts?.[0]?.text
  const focus = ctx.selectedTitle ? ` “${ctx.selectedTitle}” is selected.` : ''
  return [
    `Hi — I'm Nox, your GRC colleague for ${organisation.name}.`,
    '',
    `You're on ${screenLabel(ctx)}.${focus} ${
      ctx.position === 'after'
        ? 'The material supplier-assurance gap is closed for this review.'
        : `The open material gap is still about ${firstFact ? firstFact.replace(/\.$/, '') : 'missing current critical-supplier assessments'}.`
    }`,
    '',
    'Ask me what is happening, why it matters, or what to do next.',
  ].join('\n')
}
