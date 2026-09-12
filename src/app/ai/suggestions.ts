import { data, organisation } from '../mock/data.ts'
import type { GapStepId, HubFocus, ModuleId, PositionState } from '../mock/types.ts'

export type NoxNavigateTarget =
  | { type: 'module'; module: ModuleId; recordId?: string | null }
  | { type: 'gap'; step?: GapStepId }
  | { type: 'upload' }
  | { type: 'board' }

export type NoxActionChip = {
  id: string
  label: string
  navigate: NoxNavigateTarget
}

export type NoxGuidance = {
  actions: NoxActionChip[]
  questions: string[]
  intro: string
}

export type SuggestionContext = {
  position: PositionState
  module: ModuleId | 'gap'
  selectedId?: string | null
  selectedTitle?: string
  hubFocus?: HubFocus | null
  gapStep?: GapStepId
}

function elevatedRisks(position: PositionState) {
  return data.risks.filter((item) => {
    const level = position === 'after' ? item.levelAfter : item.levelBefore
    return level === 'elevated'
  })
}

function partialControls(position: PositionState) {
  return data.controls.filter((item) => {
    const assurance = position === 'after' ? item.assuranceAfter : item.assuranceBefore
    return assurance !== 'assured'
  })
}

function partialObligations(position: PositionState) {
  return data.obligations.filter((item) => {
    const support = position === 'after' ? item.supportAfter : item.supportBefore
    return support !== 'supported'
  })
}

function evidenceSignals(position: PositionState) {
  const after = position === 'after'
  const catalogue = data.evidence.filter((item) => {
    if (after && item.id === 'ev-supplier-assessments-2026') return true
    if (!after && item.id === 'ev-supplier-assessments-2026') return false
    return true
  })
  const missing = after ? 0 : 1
  const expired = catalogue.filter((item) => item.freshness === 'expired' && !item.duplicateOf).length
  const underReview = 0
  const expiring = catalogue.filter((item) => item.freshness === 'expiring').length
  return { missing, expired, underReview, expiring }
}

function recordGuidance(ctx: SuggestionContext): NoxGuidance | null {
  if (!ctx.selectedId && !ctx.hubFocus?.recordId && ctx.hubFocus?.kind !== 'briefing') return null
  const id = ctx.selectedId ?? ctx.hubFocus?.recordId
  const title = ctx.selectedTitle ?? ctx.hubFocus?.title
  if (!id && !title) return null

  if (id?.startsWith('risk-') || ctx.module === 'risks') {
    const risk = data.risks.find((item) => item.id === id)
    const name = risk?.title ?? title ?? 'this risk'
    return {
      intro: `You're looking at ${name}. I can explain the rating, missing evidence, or what to do next.`,
      actions: [
        { id: 'act-risk-open', label: `Review ${name}`, navigate: { type: 'module' as const, module: 'risks', recordId: id } },
        {
          id: 'act-risk-evidence',
          label: 'Review missing evidence',
          navigate: { type: 'module' as const, module: 'evidence', recordId: ctx.position === 'after' ? 'ev-supplier-assessments-2026' : 'ev-audit-findings' },
        },
        {
          id: 'act-risk-control',
          label: 'Open affected control',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
      ] as NoxActionChip[],
      questions: [
        `Why is ${name} rated high?`,
        'What evidence is missing?',
        'Which controls are affected?',
        `What should I do about ${name}?`,
      ],
    }
  }

  if (id?.startsWith('ctl-') || (ctx.module === 'controls' && id)) {
    const control = data.controls.find((item) => item.id === id)
    const name = control?.title ?? title ?? 'this control'
    return {
      intro: `You're on ${name}. Ask why it is partial, what evidence is missing, or what to do next.`,
      actions: [
        { id: 'act-ctl-open', label: `Review ${name}`, navigate: { type: 'module' as const, module: 'controls', recordId: id } },
        {
          id: 'act-ctl-evidence',
          label: 'Show controls missing evidence',
          navigate: { type: 'module' as const, module: 'evidence' },
        },
        {
          id: 'act-ctl-risk',
          label: 'Review related risk',
          navigate: { type: 'module' as const, module: 'risks', recordId: 'risk-third-party' },
        },
      ],
      questions: [
        `Why is ${name} only partially assured?`,
        'Which evidence is missing for this control?',
        'What risk does this create?',
        'What should I do next?',
      ],
    }
  }

  if (id?.startsWith('ev-') || (ctx.module === 'evidence' && id)) {
    const evidence = data.evidence.find((item) => item.id === id)
    const name = evidence?.title ?? title ?? 'this evidence'
    return {
      intro: `Selected evidence: ${name}. I can explain impact on assurance or the upload path.`,
      actions: [
        { id: 'act-ev-open', label: 'Review this evidence', navigate: { type: 'module' as const, module: 'evidence', recordId: id } },
        ...(ctx.position === 'before'
          ? ([{ id: 'act-ev-upload', label: 'Upload missing evidence', navigate: { type: 'upload' as const } }] as NoxActionChip[])
          : ([{ id: 'act-ev-board', label: 'Prepare board summary', navigate: { type: 'board' as const } }] as NoxActionChip[])),
        {
          id: 'act-ev-control',
          label: 'Open affected control',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
      ],
      questions: [
        `Why does ${name} matter?`,
        'What evidence is blocking our assurance position?',
        'Which control is affected?',
        'What should I do next?',
      ],
    }
  }

  if (id?.startsWith('obl-') || (ctx.module === 'regulatory' && id)) {
    const obligation = data.obligations.find((item) => item.id === id)
    const name = obligation?.title ?? title ?? 'this requirement'
    return {
      intro: `You're reviewing ${name}. I can explain coverage, related controls, or next steps.`,
      actions: [
        { id: 'act-obl-open', label: 'Open this requirement', navigate: { type: 'module' as const, module: 'regulatory', recordId: id } },
        {
          id: 'act-obl-control',
          label: 'Review related controls',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
        {
          id: 'act-obl-gap',
          label: 'Review compliance gaps',
          navigate: { type: 'gap' as const, step: 'overview' },
        },
      ],
      questions: [
        `Why is ${name} only partly covered?`,
        'Which requirements have the highest exposure?',
        'Which requirements need evidence?',
        'What should I do next?',
      ],
    }
  }

  if (ctx.hubFocus?.kind === 'action' || id?.startsWith('act-')) {
    return {
      intro: `This action sits on ${organisation.name}'s open work. I can explain impact or take you to the linked record.`,
      actions: [
        ...(ctx.position === 'before'
          ? ([{ id: 'act-hub-upload', label: 'Upload missing evidence', navigate: { type: 'upload' as const } }] as NoxActionChip[])
          : ([{ id: 'act-hub-board', label: 'Prepare board summary', navigate: { type: 'board' as const } }] as NoxActionChip[])),
        { id: 'act-hub-gap', label: 'Show the biggest gap', navigate: { type: 'gap' as const, step: 'overview' } },
      ],
      questions: [
        'Why does this action matter?',
        'What should I focus on today?',
        'Where is our biggest remaining gap?',
        'What should I tell the board?',
      ],
    }
  }

  return null
}

export function buildContextGuidance(ctx: SuggestionContext): NoxGuidance {
  const record = recordGuidance(ctx)
  if (record) return record

  const after = ctx.position === 'after'
  const elevated = elevatedRisks(ctx.position)
  const partial = partialControls(ctx.position)
  const obligations = partialObligations(ctx.position)
  const evidence = evidenceSignals(ctx.position)

  if (ctx.module === 'gap') {
    return {
      intro: 'You are on the connected supplier-assurance gap. Follow policy → obligation → control → evidence → risk → action.',
      actions: [
        {
          id: 'gap-evidence',
          label: 'Review missing evidence',
          navigate: { type: 'module' as const, module: 'evidence', recordId: after ? 'ev-supplier-assessments-2026' : 'ev-audit-findings' },
        },
        {
          id: 'gap-control',
          label: 'Open affected control',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
        {
          id: 'gap-risk',
          label: 'Review related risk',
          navigate: { type: 'module' as const, module: 'risks', recordId: 'risk-third-party' },
        },
        ...(after
          ? ([{ id: 'gap-board', label: 'Prepare board summary', navigate: { type: 'board' as const } }] as NoxActionChip[])
          : ([{ id: 'gap-upload', label: 'Upload missing evidence', navigate: { type: 'upload' as const } }] as NoxActionChip[])),
      ],
      questions: [
        'Why does this gap matter?',
        'Which control is affected?',
        'What evidence is missing?',
        'What risk does this create?',
        'What should I do next?',
      ],
    }
  }

  if (ctx.module === 'risks') {
    const count = elevated.length
    return {
      intro:
        count > 0
          ? `${organisation.name} currently has ${count} elevated risk${count === 1 ? '' : 's'}. Start with the highest exposure.`
          : 'Elevated third-party and regulatory exposure are reduced. Continuity remains a watch item.',
      actions: [
        {
          id: 'risk-highest',
          label: count > 0 ? `Open the highest risk` : 'Review continuity risk',
          navigate: {
            type: 'module' as const,
            module: 'risks',
            recordId: elevated[0]?.id ?? 'risk-continuity',
          },
        },
        {
          id: 'risk-no-mitigation',
          label: 'Show risks tied to missing evidence',
          navigate: { type: 'module' as const, module: 'risks', recordId: 'risk-third-party' },
        },
        {
          id: 'risk-evidence',
          label: after ? 'Review approved evidence' : 'Review missing evidence',
          navigate: {
            type: 'module' as const,
            module: 'evidence',
            recordId: after ? 'ev-supplier-assessments-2026' : 'ev-audit-findings',
          },
        },
      ],
      questions: [
        count > 0 ? `Show me the ${count} elevated risks.` : 'What are our highest risks?',
        'Which risks need immediate attention?',
        'Why are these risks rated high?',
        'Which risks have no mitigation plan?',
        'Which risks could impact our assurance position?',
      ],
    }
  }

  if (ctx.module === 'controls') {
    const count = partial.length
    return {
      intro:
        count > 0
          ? `${count} control${count === 1 ? ' is' : 's are'} only partially assured. The supplier-assurance control is the priority.`
          : 'Controls are assured for this review. Keep evidence mappings current.',
      actions: [
        {
          id: 'ctl-priority',
          label: 'Open the highest-priority control',
          navigate: { type: 'module' as const, module: 'controls', recordId: partial[0]?.id ?? 'ctl-supplier-assurance' },
        },
        {
          id: 'ctl-missing-ev',
          label: 'Show controls missing evidence',
          navigate: { type: 'module' as const, module: 'evidence' },
        },
        {
          id: 'ctl-review',
          label: after ? 'Review assured control' : 'Review ineffective controls',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
      ],
      questions: [
        'Which controls are currently ineffective?',
        'Which controls are missing evidence?',
        'Which controls are overdue for review?',
        'What is causing our control coverage gap?',
      ],
    }
  }

  if (ctx.module === 'evidence') {
    return {
      intro: after
        ? 'Critical assessments are current. Watch expired, duplicate and expiring packs in the catalogue.'
        : `Evidence health needs attention: ${evidence.missing} missing pack, ${evidence.expired} expired, ${evidence.expiring} expiring.`,
      actions: [
        {
          id: 'ev-missing',
          label: after ? 'Review approved assessments' : 'Review missing evidence',
          navigate: {
            type: 'module' as const,
            module: 'evidence',
            recordId: after ? 'ev-supplier-assessments-2026' : 'ev-audit-findings',
          },
        },
        {
          id: 'ev-expired',
          label: 'Review expired evidence',
          navigate: { type: 'module' as const, module: 'evidence', recordId: 'ev-supplier-assessments-2023' },
        },
        ...(after
          ? ([{ id: 'ev-board', label: 'Prepare board summary', navigate: { type: 'board' as const } }] as NoxActionChip[])
          : ([{ id: 'ev-upload', label: 'Upload missing evidence', navigate: { type: 'upload' as const } }] as NoxActionChip[])),
      ],
      questions: [
        'Which evidence is missing?',
        'What evidence is currently under review?',
        'Which evidence is about to expire?',
        'What evidence is blocking our assurance position?',
      ],
    }
  }

  if (ctx.module === 'regulatory') {
    const count = obligations.filter((item) => item.frameworkId !== 'fw-internal').length
    return {
      intro: after
        ? 'International obligations are supported by the approved assessments.'
        : `${count} international requirements remain only partly supported by the same missing assessments.`,
      actions: [
        {
          id: 'reg-gaps',
          label: 'Review compliance gaps',
          navigate: { type: 'gap' as const, step: 'overview' },
        },
        {
          id: 'reg-uncovered',
          label: 'Show uncovered requirements',
          navigate: {
            type: 'module' as const,
            module: 'regulatory',
            recordId: obligations.find((item) => item.frameworkId !== 'fw-internal')?.id ?? 'obl-iso-a532',
          },
        },
        {
          id: 'reg-controls',
          label: 'Review related controls',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
      ],
      questions: [
        'Which regulatory requirements are not covered?',
        'Where do we have compliance gaps?',
        'Which requirements have the highest exposure?',
        'Which requirements need evidence?',
      ],
    }
  }

  if (ctx.module === 'reports') {
    return {
      intro: after
        ? 'Board Summary can cite the approved assessments and improved position.'
        : 'Board narrative still depends on closing the supplier-assurance evidence gap.',
      actions: [
        { id: 'rep-board', label: 'Open Board Summary', navigate: { type: 'board' as const } },
        {
          id: 'rep-gap',
          label: after ? 'Review closed gap' : 'Show the biggest gap',
          navigate: { type: 'gap' as const, step: 'overview' },
        },
      ],
      questions: [
        'What should I tell the board?',
        'Has our position improved?',
        'What changed from our previous position?',
        'Summarise this for the board.',
      ],
    }
  }

  if (ctx.module === 'activity') {
    return {
      intro: 'Activity shows the organisation trail for this review. Ask what changed or what still needs attention.',
      actions: [
        {
          id: 'act-priority',
          label: after ? 'Prepare board summary' : 'Review missing evidence',
          navigate: after ? { type: 'board' as const } : { type: 'module' as const, module: 'evidence' },
        },
        { id: 'act-hub', label: 'Return to Executive Hub', navigate: { type: 'module' as const, module: 'hub' } },
      ],
      questions: [
        'What changed from our previous position?',
        'What should I focus on today?',
        'Where is our biggest remaining gap?',
      ],
    }
  }


  if (ctx.module === 'connect') {
    const readiness = after ? data.position.after.readinessValue : data.position.before.readinessValue
    return {
      intro: after
        ? `Nox Connect shows ${organisation.name}'s connected estate after approval. Assurance is ${readiness}%. Ask what changed or what to do next.`
        : `Nox Connect shows how ${organisation.name}'s risks, controls, regulatory obligations, evidence and actions connect. Assurance is ${readiness}%.`,
      actions: [
        { id: 'connect-gap', label: 'Explore connected exposure', navigate: { type: 'gap' as const, step: 'overview' } },
        {
          id: 'connect-risks',
          label: 'Review priority risks',
          navigate: { type: 'module' as const, module: 'risks', recordId: elevated[0]?.id ?? 'risk-third-party' },
        },
        {
          id: 'connect-evidence',
          label: after ? 'Review approved evidence' : 'Review missing evidence',
          navigate: {
            type: 'module' as const,
            module: 'evidence',
            recordId: after ? 'ev-supplier-assessments-2026' : 'ev-audit-findings',
          },
        },
        {
          id: 'connect-regulatory',
          label: 'Show regulatory gaps',
          navigate: { type: 'module' as const, module: 'regulatory' },
        },
        ...(after
          ? ([{ id: 'connect-board', label: 'Prepare board summary', navigate: { type: 'board' as const } }] as NoxActionChip[])
          : ([{ id: 'connect-upload', label: 'Upload missing evidence', navigate: { type: 'upload' as const } }] as NoxActionChip[])),
      ],
      questions: [
        'What should I focus on next?',
        `Why is our assurance position ${readiness}%?`,
        'Show me our biggest organisational risks',
        'What is driving our regulatory exposure?',
        'Which controls are creating the most exposure?',
        'What evidence gaps have the biggest impact?',
      ],
    }
  }

  // Executive Hub default
  return {
    intro: after
      ? `${organisation.name}'s position improved after approval. Focus on the Board Summary and remaining watch items.`
      : `${organisation.name}'s position still needs attention. The material gap is missing current critical-supplier assessments.`,
    actions: [
      { id: 'hub-gap', label: 'Show the biggest gap', navigate: { type: 'gap' as const, step: 'overview' } },
      {
        id: 'hub-risks',
        label: 'Review priority risks',
        navigate: { type: 'module' as const, module: 'risks', recordId: elevated[0]?.id ?? 'risk-third-party' },
      },
      {
        id: 'hub-evidence',
        label: after ? 'Review approved evidence' : 'Review missing evidence',
        navigate: {
          type: 'module' as const,
          module: 'evidence',
          recordId: after ? 'ev-supplier-assessments-2026' : 'ev-audit-findings',
        },
      },
      ...(after
        ? ([{ id: 'hub-board', label: 'Prepare board summary', navigate: { type: 'board' as const } }] as NoxActionChip[])
        : ([{ id: 'hub-upload', label: 'Upload missing evidence', navigate: { type: 'upload' as const } }] as NoxActionChip[])),
    ],
    questions: [
      'What is the biggest issue affecting our assurance position?',
      'What changed from our previous position?',
      'What should I focus on today?',
      'What should I tell the board?',
      'Where is our biggest remaining gap?',
    ],
  }
}

export function contextualQuestions(ctx: SuggestionContext, limit = 4) {
  return buildContextGuidance(ctx).questions.slice(0, limit)
}
