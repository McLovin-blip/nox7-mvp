import type { HubAction } from '../mock/hubModel.ts'
import type { HubFocus, MapFilter, MapNodeId } from '../mock/types.ts'
import { ActionDetail } from './ActionDetail.tsx'
import { AiBriefing } from './AiBriefing.tsx'
import { ConnectedAssurance } from './ConnectedAssurance.tsx'
import { FrameworkCoverage } from './FrameworkCoverage.tsx'
import { HubGreeting } from './HubGreeting.tsx'
import { PositionStrip } from './PositionStrip.tsx'
import { PriorityActions } from './PriorityActions.tsx'
import { RecentChanges } from './RecentChanges.tsx'
import './hub.css'

export function ExecutiveHub({
  mapOpen,
  mapFilter,
  selectedNode,
  hubFocus,
  openAction,
  onToggleMap,
  onFilter,
  onSelectNode,
  onFocus,
  onAsk,
  onOpenGap,
  onOpenBoard,
  onUpload,
  onOpenSource,
  onOpenAction,
  onCloseAction,
}: {
  mapOpen: boolean
  mapFilter: MapFilter
  selectedNode: MapNodeId
  hubFocus: HubFocus | null
  openAction: HubAction | null
  onToggleMap: () => void
  onFilter: (filter: MapFilter) => void
  onSelectNode: (id: MapNodeId, focus: HubFocus, prompt: string) => void
  onFocus: (focus: HubFocus, prompt: string) => void
  onAsk: (prompt?: string) => void
  onOpenGap: (step?: 'overview' | 'evidence') => void
  onOpenBoard: () => void
  onUpload: () => void
  onOpenSource: (id: string) => void
  onOpenAction: (action: HubAction) => void
  onCloseAction: () => void
}) {
  const indicatorId = hubFocus?.kind === 'indicator' ? hubFocus.id : null
  const frameworkId = hubFocus?.kind === 'framework' ? hubFocus.id : null
  const actionId = hubFocus?.kind === 'action' ? hubFocus.id : openAction?.id
  const changeId = hubFocus?.kind === 'change' ? hubFocus.id : null

  return (
    <div className="hub">
      <HubGreeting />
      <PositionStrip selectedId={indicatorId} onSelect={onFocus} />
      <AiBriefing
        selected={hubFocus?.kind === 'briefing'}
        onSelect={(prompt) => onFocus({ kind: 'briefing', id: 'briefing', title: 'Nox AI briefing' }, prompt)}
        onOpenSource={onOpenSource}
        onPrimary={() => onOpenSource('risk-002')}
      />
      <PriorityActions
        selectedId={actionId}
        onSelect={(action, focus) => {
          onOpenAction(action)
          onFocus(focus, action.askPrompt)
        }}
      />
      <FrameworkCoverage selectedId={frameworkId} onSelect={onFocus} />
      <ConnectedAssurance
        expanded={mapOpen}
        filter={mapFilter}
        selectedNode={selectedNode}
        onToggle={onToggleMap}
        onFilter={onFilter}
        onSelectNode={onSelectNode}
        onOpenGap={() => onOpenGap('overview')}
      />
      <RecentChanges selectedId={changeId} onSelect={onFocus} onOpenSource={onOpenSource} />
      {openAction ? (
        <ActionDetail
          action={openAction}
          onClose={onCloseAction}
          onAsk={() => onAsk(openAction.askPrompt)}
          onContinue={() => {
            if (openAction.target === 'board') onOpenBoard()
            else if (openAction.target === 'upload') onUpload()
            else if (openAction.recordId) onOpenSource(openAction.recordId)
            onCloseAction()
          }}
        />
      ) : null}
    </div>
  )
}
