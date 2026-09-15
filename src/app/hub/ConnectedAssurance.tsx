import type { MapFilter, MapNodeId, HubFocus } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import { AssuranceMap } from './AssuranceMap.tsx'

export function ConnectedAssurance({
  expanded,
  filter,
  selectedNode,
  onToggle,
  onFilter,
  onSelectNode,
  onOpenGap,
}: {
  expanded: boolean
  filter: MapFilter
  selectedNode: MapNodeId
  onToggle: () => void
  onFilter: (filter: MapFilter) => void
  onSelectNode: (id: MapNodeId, focus: HubFocus, prompt: string) => void
  onOpenGap: () => void
}) {
  const { view } = useSession()
  return (
    <section className="connect" aria-label="Connected assurance">
      <header>
        <div>
          <span>Connected assurance</span>
          <p>{view.hub.connectedLede}</p>
        </div>
        <div className="connect-tools">
          <button className="ghost" type="button" onClick={onToggle}>
            {expanded ? 'Collapse map' : 'Explore connected assurance'}
          </button>
          <button className="follow" type="button" onClick={onOpenGap}>
            {view.position === 'after' ? 'Open connected view' : 'Open connected gap'}
          </button>
        </div>
      </header>
      <div className="connect-chain" role="list">
        {view.hub.layers.map((item, index) => (
          <div key={item.id} className="connect-step" role="listitem">
            {index > 0 ? <i className="connect-line" aria-hidden="true" /> : null}
            <button
              type="button"
              className={`connect-node tone-${item.status}${selectedNode === item.id ? ' on' : ''}`}
              aria-pressed={selectedNode === item.id}
              onClick={() =>
                onSelectNode(
                  item.id,
                  {
                    kind: 'map',
                    id: item.id,
                    title: item.title,
                    recordId:
                      item.id === 'controls'
                        ? 'ctl-005'
                        : item.id === 'evidence'
                          ? view.position === 'after'
                            ? 'evd-006'
                            : 'evd-005'
                          : item.id === 'risks'
                            ? 'risk-002'
                            : item.id === 'obligations'
                              ? 'obl-iso-a532'
                              : undefined,
                  },
                  item.askPrompt,
                )
              }
            >
              <span>{item.layer}</span>
              <strong>{item.detail}</strong>
            </button>
          </div>
        ))}
      </div>
      {expanded ? (
        <AssuranceMap
          filter={filter}
          selectedNode={selectedNode}
          onFilter={onFilter}
          onSelectNode={(id) => {
            const layer = view.hub.layers.find((item) => item.id === id)
            onSelectNode(
              id,
              {
                kind: 'map',
                id,
                title: layer?.title ?? id,
              },
              layer?.askPrompt ?? `Explain ${layer?.title ?? id}`,
            )
          }}
          onOpenGap={onOpenGap}
        />
      ) : null}
    </section>
  )
}
