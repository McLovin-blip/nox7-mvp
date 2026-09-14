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
  riskDrill?: { label: string; questions: string[] } | null
  controlDrill?: { label: string; questions: string[] } | null
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

  if (id?.startsWith('risk-')) {
    const risk = data.risks.find((item) => item.id === id)
    const name = risk?.title ?? title ?? 'this risk'
    const after = ctx.position === 'after'
    const appetite = after ? risk?.appetiteStatusAfter : risk?.appetiteStatusBefore
    const coverage = after ? risk?.controlCoverageAfter : risk?.controlCoverageBefore
    const treatment = after ? risk?.treatment.statusAfter : risk?.treatment.statusBefore
    const controlId = risk?.controlIds[0]
    const evidenceId = after
      ? risk?.evidenceIdsAfter.find((item) => item.includes('2026')) ?? risk?.evidenceIdsAfter[0]
      : risk?.evidenceIdsBefore.find((item) => item.includes('audit') || item.includes('findings')) ??
        risk?.evidenceIdsBefore[0]
    const pressure = [
      appetite === 'above' ? 'above appetite' : null,
      coverage && coverage !== 'adequate' ? `${coverage} control coverage` : null,
      treatment === 'overdue' || treatment === 'at-risk' ? 'treatment under pressure' : null,
    ].filter(Boolean)
    return {
      intro: pressure.length
        ? `You're reviewing ${name}. It needs attention because it is ${pressure.join(' and ')}.`
        : `You're reviewing ${name}. I can explain residual exposure, linked controls, compliance impact, or treatment.`,
      actions: [
        { id: 'act-risk-open', label: `Review ${name}`, navigate: { type: 'module' as const, module: 'risks', recordId: id } },
        controlId
          ? {
              id: 'act-risk-control',
              label: 'Open linked control',
              navigate: { type: 'module' as const, module: 'controls', recordId: controlId },
            }
          : {
              id: 'act-risk-controls',
              label: 'Browse controls',
              navigate: { type: 'module' as const, module: 'controls' },
            },
        evidenceId
          ? {
              id: 'act-risk-evidence',
              label: after ? 'Open related evidence' : 'Review missing evidence',
              navigate: { type: 'module' as const, module: 'evidence', recordId: evidenceId },
            }
          : {
              id: 'act-risk-evidence-module',
              label: 'Open evidence',
              navigate: { type: 'module' as const, module: 'evidence' },
            },
        risk?.obligationIds[0]
          ? {
              id: 'act-risk-obligation',
              label: 'Review compliance impact',
              navigate: { type: 'module' as const, module: 'regulatory', recordId: risk.obligationIds[0] },
            }
          : {
              id: 'act-risk-regulatory',
              label: 'Open regulatory',
              navigate: { type: 'module' as const, module: 'regulatory' },
            },
      ] as NoxActionChip[],
      questions: [
        `Why is ${name} rated ${risk?.severity ?? 'this severity'}?`,
        'What is driving residual risk?',
        'Why is this risk above appetite?',
        'Which controls are ineffective?',
        'Which evidence is missing?',
        'Which frameworks are affected?',
        'Is the treatment plan on track?',
        'What should I do next?',
      ],
    }
  }

  if (id?.startsWith('ctl-') || (ctx.module === 'controls' && id)) {
    const control = data.controls.find((item) => item.id === id)
    const name = control?.title ?? title ?? 'this control'
    const after = ctx.position === 'after'
    const overall = after ? control?.overallAfter : control?.overallBefore
    return {
      intro:
        overall === 'unverifiable'
          ? `You're on ${name}. It is unverifiable because current evidence is insufficient — not because the control has been found failed.`
          : overall === 'ineffective'
            ? `You're on ${name}. Current evidence is enough to conclude it is not operating as intended.`
            : `You're on ${name}. I can explain the trust profile, linked risks, or the next action.`,
      actions: [
        { id: 'act-ctl-open', label: `Review ${name}`, navigate: { type: 'module' as const, module: 'controls', recordId: id } },
        {
          id: 'act-ctl-evidence',
          label: 'Open supporting evidence',
          navigate: {
            type: 'module' as const,
            module: 'evidence',
            recordId: (after ? control?.evidenceIdsAfter[0] : control?.evidenceIdsBefore[0]) ?? undefined,
          },
        },
        {
          id: 'act-ctl-risk',
          label: 'Review related risk',
          navigate: { type: 'module' as const, module: 'risks', recordId: control?.riskIds[0] ?? 'risk-third-party' },
        },
      ],
      questions: [
        `Why can ${name} not be relied upon?`,
        'What evidence is missing, expiring or conflicting?',
        'Which risks would be affected if this control weakened?',
        'What should the owner do next?',
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
    const above = data.risks.filter((item) => {
      const appetite = after ? item.appetiteStatusAfter : item.appetiteStatusBefore
      return appetite === 'above'
    })
    const overdue = data.risks.filter((item) => {
      const status = after ? item.treatment.statusAfter : item.treatment.statusBefore
      return status === 'overdue' || status === 'at-risk'
    })
    const drill = ctx.riskDrill
    return {
      intro: drill
        ? `Active risk drill-down: ${drill.label}. I can explain why this population matters, which record to open first, and what action to take.`
        : count > 0
          ? `${organisation.name} currently has ${count} elevated risk${count === 1 ? '' : 's'} and ${above.length} above appetite. Start with the highest residual exposure.`
          : `Elevated exposure is reduced. ${above.length ? `${above.length} remain above appetite.` : 'Appetite pressure is lower.'} Continuity remains a watch item.`,
      actions: [
        {
          id: 'risk-highest',
          label: count > 0 ? 'Open the highest risk' : 'Review continuity risk',
          navigate: {
            type: 'module' as const,
            module: 'risks',
            recordId: elevated[0]?.id ?? 'risk-continuity',
          },
        },
        {
          id: 'risk-above-appetite',
          label: 'Review above-appetite risks',
          navigate: {
            type: 'module' as const,
            module: 'risks',
            recordId: above[0]?.id ?? elevated[0]?.id ?? 'risk-third-party',
          },
        },
        {
          id: 'risk-overdue-treatment',
          label: overdue.length ? 'Review overdue treatments' : 'Review treatment plans',
          navigate: {
            type: 'module' as const,
            module: 'risks',
            recordId: overdue[0]?.id ?? 'risk-privileged-access',
          },
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
      questions: drill?.questions?.length
        ? drill.questions
        : [
            count > 0 ? `Show me the ${count} elevated risks.` : 'What are our biggest risks?',
            'Which risks need immediate attention?',
            'Which risks are above appetite?',
            'Which risks have overdue treatments?',
            'Which business unit has the highest exposure?',
            'Which risks have ineffective controls?',
            'Which risks affect compliance the most?',
            'What changed in our risk position?',
          ],
    }
  }

  if (ctx.module === 'controls') {
    const unverifiable = data.controls.filter((item) => {
      const overall = after ? item.overallAfter : item.overallBefore
      return overall === 'unverifiable'
    })
    const ineffective = data.controls.filter((item) => {
      const overall = after ? item.overallAfter : item.overallBefore
      return overall === 'ineffective'
    })
    const drill = ctx.controlDrill
    const priority = unverifiable[0] ?? ineffective[0] ?? partial[0]
    return {
      intro: drill
        ? `Active control context: ${drill.label}. I can explain what can be relied on, what is unverifiable, and what action is due.`
        : after
          ? `Supplier assurance is now effective. ${ineffective.length} control${ineffective.length === 1 ? '' : 's'} remain ineffective and ${unverifiable.length} unverifiable.`
          : `${unverifiable.length} control${unverifiable.length === 1 ? ' is' : 's are'} unverifiable because evidence is missing, and ${ineffective.length} ${ineffective.length === 1 ? 'is' : 'are'} ineffective. Unverifiable is not failed.`,
      actions: [
        {
          id: 'ctl-priority',
          label: 'Open the highest-priority control',
          navigate: { type: 'module' as const, module: 'controls', recordId: priority?.id ?? 'ctl-supplier-assurance' },
        },
        {
          id: 'ctl-missing-ev',
          label: after ? 'Review approved assessments' : 'Show missing supplier evidence',
          navigate: after
            ? { type: 'module' as const, module: 'evidence', recordId: 'ev-supplier-assessments-2026' }
            : { type: 'upload' as const },
        },
        {
          id: 'ctl-hse',
          label: 'Review safety inspections',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-safety-inspection' },
        },
        {
          id: 'ctl-risk',
          label: 'Review related risk',
          navigate: { type: 'module' as const, module: 'risks', recordId: 'risk-third-party' },
        },
      ],
      questions: drill?.questions?.length
        ? drill.questions
        : [
            'Which controls can we rely on?',
            'Which cybersecurity controls are currently unverifiable?',
            'Why can this control not be relied upon?',
            'What evidence is missing, expiring or conflicting?',
            'Which controls have the greatest effect on NIS2 assurance?',
            'Which controls are insufficient for this risk?',
            'What should the owner do next?',
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
        'Which evidence can we rely on?',
        'What evidence is missing, expiring or conflicting?',
        'Which evidence is blocking our assurance position?',
        'Where is this evidence being used?',
      ],
    }
  }

  if (ctx.module === 'regulatory') {
    const unverifiable = data.obligations.filter((item) => (after ? item.overallAfter : item.overallBefore) === 'unverifiable')
    const drill = ctx.controlDrill
    return {
      intro: drill
        ? `Active regulatory context: ${drill.label}. I can explain which requirements are supported, which are only counting a policy, and what to do next.`
        : after
          ? `Supplier-related international obligations are now supported. ${unverifiable.length} remain unverifiable elsewhere in the inventory.`
          : `${unverifiable.length} obligations are unverifiable. A current policy is not support until operating evidence exists.`,
      actions: [
        {
          id: 'reg-priority',
          label: 'Open the priority obligation',
          navigate: { type: 'module' as const, module: 'regulatory', recordId: unverifiable[0]?.id ?? 'obl-iso-a532' },
        },
        {
          id: 'reg-gap',
          label: 'Show the connected supplier gap',
          navigate: { type: 'gap' as const, step: 'overview' },
        },
        {
          id: 'reg-controls',
          label: 'Review related controls',
          navigate: { type: 'module' as const, module: 'controls', recordId: 'ctl-supplier-assurance' },
        },
      ],
      questions: drill?.questions?.length
        ? drill.questions
        : [
            'Which obligations are actually supported?',
            'Where are we only counting a policy?',
            'Which obligations have the greatest effect on NIS2?',
            'What should the owner do next?',
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
