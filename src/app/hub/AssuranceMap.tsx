import type { MapFilter, MapNodeId } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'frameworks', label: 'Frameworks' },
  { id: 'obligations', label: 'Obligations' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'risks', label: 'Risks' },
]

export function AssuranceMap({
  filter,
  selectedNode,
  onFilter,
  onSelectNode,
  onOpenGap,
}: {
  filter: MapFilter
  selectedNode: MapNodeId
  onFilter: (filter: MapFilter) => void
  onSelectNode: (id: MapNodeId) => void
  onOpenGap: () => void
}) {
  const { view } = useSession()
  return (
    <div className="map" aria-label="Expanded connected assurance">
      <header>
        <div>
          <strong>Assurance map</strong>
          <span>Expanded view</span>
        </div>
        <div className="map-filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => onFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>
      <p className="map-lede">
        {view.hub.connectedLede}{' '}
        <button type="button" className="map-open" onClick={onOpenGap}>
          {view.position === 'after' ? 'Open dedicated view' : 'Open dedicated gap view'}
        </button>
      </p>
      <button
        className={`map-core${selectedNode === 'centre' ? ' on' : ''}`}
        type="button"
        onClick={() => {
          onSelectNode('centre')
          onOpenGap()
        }}
      >
        <span>{view.mapCentre.kicker}</span>
        <strong>{view.mapCentre.title}</strong>
        <em>{view.mapCentre.detail}</em>
      </button>
      <div className="map-grid">
        {view.mapNodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`map-card tone-${node.status}${selectedNode === node.id ? ' on' : ''}${filter !== 'all' && filter !== node.id ? ' dim' : ''}`}
            onClick={() => onSelectNode(node.id)}
          >
            <span>{node.title}</span>
            <strong>{node.detail}</strong>
          </button>
        ))}
      </div>
      <ul className="legend">
        <li>
          <i className="assured" /> Fully assured
        </li>
        <li>
          <i className="partial" /> Partial
        </li>
        <li>
          <i className="attention" /> Attention
        </li>
      </ul>
    </div>
  )
}
