import {
  data,
  hubAnswerBefore,
  lookupSource,
  organisation,
  personLabel,
  prompts,
  supplierControl,
} from '../mock/data.ts'
import type { AiPanelModel, GapStepId, ModuleId, PositionState } from '../mock/types.ts'
import { answerFor, gapAiFor, hubAiFor } from './answers.ts'

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
  gapStep?: GapStepId
}

export const EMPTY_SUGGESTIONS = [
  'What is our biggest current risk?',
  'Where are we missing evidence?',
  'Show me our supplier assurance gaps.',
  'What should I prioritise?',
  'Why is our assurance position low?',
  'Summarise this for the board.',
]

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
  if (ctx.module === 'gap') return 'Connected supplier-assurance gap'
  if (ctx.module === 'hub') return 'Executive Hub'
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
      suggestions: answer.prompts.slice(0, 3),
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
    suggestions: answer.prompts.slice(0, 4),
    topic,
  }
}

function supplierGapReply(ctx: ConversationContext): Reply {
  const after = ctx.position === 'after'
  const control = supplierControl
  const policy = data.evidence.find((item) => item.id === 'ev-policy-supplier')
  const risk = data.risks.find((item) => item.id === 'risk-third-party')
  const action = data.actions[0]

  if (after) {
    return {
      text: [
        'Your largest supplier-assurance gap is closed for this review.',
        '',
        `Why it matters: ${organisation.name} can now show current critical-supplier assessments against ${control?.title ?? 'supplier assurance'}, so the connected frameworks and risks move together.`,
        '',
        'From the records:',
        `• ${control?.title ?? 'Supplier assurance'} is assured.`,
        '• 2026 critical-supplier assessments are current.',
        '• Third-party and regulatory exposure are reduced.',
        '',
        'Recommendation: Open the Board Summary and cite the approved assessments. Keep the duplicate questionnaire flagged as a catalogue issue.',
        '',
        'Would you like the Board Summary sources, or what still needs watching?',
      ].join('\n'),
      citations: citationsFrom(
        ['ctl-supplier-assurance', 'ev-supplier-assessments-2026', 'risk-third-party', 'rep-board-summary'],
        ctx.position,
      ),
      suggestions: ['Summarise this for the board.', 'What should I prioritise?', 'Where are we missing evidence?'],
      topic: 'supplier-gap',
    }
  }

  return {
    text: [
      'Your biggest current supplier-assurance gap is missing current critical-supplier assessments.',
      '',
      `Why it matters: ${policy?.title ?? 'The supplier assurance policy'} is current, but without the assessments ${control?.title ?? 'supplier assurance'} stays only partially assured. That leaves obligations across ISO 27001, NIS2, GDPR and NCA ECC weakly supported and keeps ${risk?.title ?? 'third-party assurance'} elevated ahead of the review.`,
      '',
      'From the records:',
      `• Control: ${control?.title ?? 'Supplier assurance'} — partially assured.`,
      '• Expected evidence: current critical-supplier assessments.',
      `• Accountable owner: ${ownerName(action?.ownerId)}. Approver: ${ownerName(action?.approverId)}.`,
      '',
      'Recommendation: Upload the current assessment pack, review the suggested mappings, then approve. The organisation position does not move until approval.',
      '',
      'Would you like me to show the affected control and evidence, or explain what to do next?',
    ].join('\n'),
    citations: citationsFrom(
      ['ctl-supplier-assurance', 'ev-policy-supplier', 'ev-audit-findings', 'risk-third-party', 'risk-regulatory'],
      ctx.position,
    ),
    suggestions: [
      'Show me the affected control and evidence.',
      'What should I do next?',
      'Which gap affects the most frameworks?',
      'Where are we missing evidence?',
    ],
    topic: 'supplier-gap',
  }
}

function missingEvidenceReply(ctx: ConversationContext): Reply {
  const after = ctx.position === 'after'
  if (after) {
    return {
      text: [
        'The critical missing pack is no longer missing.',
        '',
        'Why it matters: the review can cite current assessments. A duplicate questionnaire remains flagged, and continuity evidence is still approaching review — those are watch items, not the material gap.',
        '',
        'Recommendation: Keep the duplicate pack visible and schedule a refresh of the continuity report.',
      ].join('\n'),
      citations: citationsFrom(
        ['ev-supplier-assessments-2026', 'ev-supplier-q-duplicate', 'ev-bc-test'],
        ctx.position,
      ),
      suggestions: ['What should I prioritise?', 'Summarise this for the board.'],
      topic: 'evidence',
    }
  }

  const expired = data.evidence.find((item) => item.id === 'ev-supplier-assessments-2023')
  const duplicate = data.evidence.find((item) => item.id === 'ev-supplier-q-duplicate')
  return {
    text: [
      'The material missing evidence is current critical-supplier assessments.',
      '',
      'Why it matters: without that pack, supplier assurance stays partial and four frameworks stay only partly supported.',
      '',
      'From the records:',
      '• Missing: current critical-supplier assessments for this review.',
      `• ${expired?.title ?? '2023 assessments'} are expired and not acceptable.`,
      `• ${duplicate?.title ?? '2024 questionnaire pack'} is a duplicate of an older pack.`,
      '',
      'Recommendation: Upload the current assessments in one action, then approve the suggested mappings.',
      '',
      'I can explain the upload path, or show the connected control first.',
    ].join('\n'),
    citations: citationsFrom(
      ['ev-audit-findings', 'ev-supplier-assessments-2023', 'ev-supplier-q-duplicate', 'ctl-supplier-assurance'],
      ctx.position,
    ),
    suggestions: [
      'Show me our supplier assurance gaps.',
      'What should I do next?',
      'What requires my attention today?',
    ],
    topic: 'evidence',
  }
}

function nextActionReply(ctx: ConversationContext): Reply {
  const after = ctx.position === 'after'
  const action = data.actions[0]
  if (after) {
    return {
      text: [
        'Next, take the improved position into the Board Summary.',
        '',
        'Why it matters: the approval already updated coverage, assurance and risk. The board pack should cite the same 2026 assessments.',
        '',
        'Recommendation: Open Board Summary and ask me to show the sources behind the conclusion.',
      ].join('\n'),
      citations: citationsFrom(['rep-board-summary', 'ev-supplier-assessments-2026'], ctx.position),
      suggestions: ['Summarise this for the board.', 'Show the sources behind this conclusion.'],
      topic: 'next-action',
    }
  }

  return {
    text: [
      'I recommend requesting and uploading the missing current critical-supplier assessments first.',
      '',
      `Why it matters: that is the highest-impact open action — ${action?.title ?? 'obtain and approve current assessments'}. Owner: ${ownerName(action?.ownerId)}. Approver: ${ownerName(action?.approverId)}.`,
      '',
      'If the evidence cannot be provided in time for the review, raise a remediation action or exception — but the happy path is upload, review, and approve.',
      '',
      'Would you like the connected gap first, or a short explanation of the Evidence upload path?',
    ].join('\n'),
    citations: citationsFrom(['ctl-supplier-assurance', 'ev-audit-findings', action?.id], ctx.position),
    suggestions: [
      'Show me our supplier assurance gaps.',
      'Where are we missing evidence?',
      'What requires my attention today?',
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
    suggestions: after
      ? ['Summarise this for the board.', 'What should I prioritise?']
      : ['Show me our supplier assurance gaps.', 'What should I do next?', 'Where are we missing evidence?'],
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
      citations: citationsFrom([ctx.selectedId, 'ctl-supplier-assurance'], ctx.position),
      suggestions: ['What should I do next?', 'Show me our supplier assurance gaps.'],
      topic: 'evidence',
    }
  }

  if (ctx.selectedId.startsWith('ctl-')) {
    const control = data.controls.find((item) => item.id === ctx.selectedId)
    const status = after ? control?.assuranceAfter : control?.assuranceBefore
    return {
      text: [
        `${title} is important because it sits on the path from policy and obligations to evidence and risk.`,
        '',
        `Current assurance: ${status}.`,
        control?.partialReason && !after ? `Interpretation: ${control.partialReason}` : '',
        '',
        `Recommendation: ${after ? 'Use this control in the Board Summary narrative.' : 'Close the missing evidence that keeps this control partial.'}`,
      ]
        .filter(Boolean)
        .join('\n'),
      citations: citationsFrom(
        [ctx.selectedId, ...(after ? control?.evidenceIdsAfter ?? [] : control?.evidenceIdsBefore ?? []).slice(0, 2)],
        ctx.position,
      ),
      suggestions: ['Where are we missing evidence?', 'What should I do next?'],
      topic: 'control',
    }
  }

  if (ctx.selectedId.startsWith('risk-')) {
    const risk = data.risks.find((item) => item.id === ctx.selectedId)
    const level = after ? risk?.levelAfter : risk?.levelBefore
    return {
      text: [
        `${title} is on the executive radar because it is linked to the same supplier-assurance story.`,
        '',
        `Current level: ${level}.`,
        risk ? `Contributing gap: ${risk.contributingGap}.` : '',
        '',
        `Recommendation: ${after ? 'Keep monitoring, and cite the improved evidence in reporting.' : 'Close the missing assessments to reduce this exposure before the review.'}`,
      ]
        .filter(Boolean)
        .join('\n'),
      citations: citationsFrom([ctx.selectedId, 'ctl-supplier-assurance'], ctx.position),
      suggestions: ['What should I prioritise?', 'Show me our supplier assurance gaps.'],
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
      'Ask me what to do next, or how this connects to the supplier-assurance gap.',
    ]
      .filter(Boolean)
      .join('\n'),
    citations: citationsFrom([ctx.selectedId], ctx.position),
    suggestions: EMPTY_SUGGESTIONS.slice(0, 4),
    topic: 'general',
  }
}

function controlAndEvidenceReply(ctx: ConversationContext): Reply {
  const control = supplierControl
  return {
    text: [
      'Here is the control and related evidence.',
      '',
      `Control: ${control?.title ?? 'Supplier assurance'} — ${ctx.position === 'after' ? 'assured' : 'partially assured'}.`,
      ctx.position === 'after'
        ? 'Related evidence: supplier assurance policy (current) and 2026 critical-supplier assessments (current).'
        : 'Related evidence: supplier assurance policy is current; current critical-supplier assessments are missing. Internal audit already flags that gap.',
      '',
      `Recommendation: ${ctx.position === 'after' ? 'Cite these records in the Board Summary.' : 'Upload the missing assessments, then approve the mappings.'}`,
    ].join('\n'),
    citations: citationsFrom(
      ctx.position === 'after'
        ? ['ctl-supplier-assurance', 'ev-policy-supplier', 'ev-supplier-assessments-2026']
        : ['ctl-supplier-assurance', 'ev-policy-supplier', 'ev-audit-findings'],
      ctx.position,
    ),
    suggestions: ['What should I do next?', 'Where are we missing evidence?', 'Summarise this for the board.'],
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
        citations: citationsFrom(['ctl-supplier-assurance', 'risk-third-party', 'risk-regulatory'], ctx.position),
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

function intentReply(question: string, ctx: ConversationContext): Reply | null {
  const q = norm(question)

  if ((/biggest (current )?risk|top risk|largest risk/.test(q) || /what is our biggest/.test(q)) && /risk/.test(q)) {
    const risk = data.risks.find((item) => item.id === 'risk-third-party')
    return {
      text: [
        ctx.position === 'after'
          ? `The previously elevated ${risk?.title ?? 'third-party assurance'} risk is now reduced after the assessment approval. Continuity evidence approaching review remains a watch item.`
          : `Your biggest current risk is ${risk?.title ?? 'third-party assurance'} — elevated because current critical-supplier assessments are missing.`,
        '',
        'Why it matters: it is the risk language of the same supplier-assurance gap that also drives regulatory exposure ahead of the review.',
        '',
        'Recommendation: treat the assessment upload as the risk-reduction action, not a separate workstream.',
      ].join('\n'),
      citations: citationsFrom(['risk-third-party', 'risk-regulatory', 'ctl-supplier-assurance'], ctx.position),
      suggestions: [
        'Show me our supplier assurance gaps.',
        'What should I prioritise?',
        'Where are we missing evidence?',
      ],
      topic: 'risk',
    }
  }

  if (/missing evidence|where are we missing|evidence gap|incomplete evidence/.test(q)) {
    return missingEvidenceReply(ctx)
  }

  if (/supplier assurance gap|assurance gaps|supplier gap|biggest.*gap|material gap/.test(q)) {
    return supplierGapReply(ctx)
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
    ctx.module === 'hub'
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
        `Fact: readiness is ${ctx.position === 'after' ? '72 (Improved)' : '64 (Needs attention)'} and the material supplier-assurance story is ${ctx.position === 'after' ? 'closed for this review' : 'still open'}.`,
        '',
        'Interpretation: I will not invent obligations, evidence or scores outside this organisation dataset.',
        '',
        'Try one of the suggestions below, or ask about the supplier-assurance gap, missing evidence, risk, or the board summary.',
      ]
        .filter(Boolean)
        .join('\n'),
      citations: citationsFrom(
        ctx.position === 'after'
          ? ['ev-supplier-assessments-2026', 'ctl-supplier-assurance']
          : ['ctl-supplier-assurance', 'ev-audit-findings'],
        ctx.position,
      ),
      suggestions: EMPTY_SUGGESTIONS,
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
  if (ctx.selectedTitle) bits.push(ctx.selectedTitle)
  return bits.join(' · ')
}

export function welcomeText(ctx: ConversationContext) {
  const firstFact = hubAnswerBefore.sourcedFacts?.[0]?.text
  return [
    `Hi, I'm Nox. Ask me anything about ${organisation.name}'s risks, controls, compliance, evidence or assurance position.`,
    '',
    `You're on ${screenLabel(ctx)}. ${
      ctx.position === 'after'
        ? 'The material supplier-assurance gap is closed for this review.'
        : `The open material gap is still about ${firstFact ? firstFact.replace(/\.$/, '') : 'missing current critical-supplier assessments'}.`
    }`,
  ].join('\n')
}
