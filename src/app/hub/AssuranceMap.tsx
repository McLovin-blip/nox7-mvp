import type { MapFilter, MapNodeId } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'frameworks', label: 'Frameworks' },
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
    <section className="map" aria-label="Assurance map">
      <header>
        <div>
          <strong>Assurance map</strong>
          <span>Current position</span>
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
        {view.position === 'after'
          ? 'The material gap is closed. The same objects now agree across the organisation.'
          : 'One material gap is limiting assurance across four frameworks.'}{' '}
        <button type="button" className="map-open" onClick={onOpenGap}>
          {view.position === 'after' ? 'Open connected view' : 'Open connected gap'}
        </button>
      </p>
      <div className="map-stage">
        <svg className="map-lines" viewBox="0 0 800 420" aria-hidden="true">
          <circle cx="400" cy="190" r="118" fill="none" stroke="rgba(139,111,232,0.18)" />
          <circle cx="400" cy="190" r="168" fill="none" stroke="rgba(139,111,232,0.12)" />
          <line x1="400" y1="190" x2="400" y2="58" stroke="rgba(139,111,232,0.35)" />
          <line x1="400" y1="190" x2="640" y2="130" stroke="rgba(139,111,232,0.35)" />
          <line x1="400" y1="190" x2="170" y2="330" stroke="rgba(139,111,232,0.35)" />
          <line x1="400" y1="190" x2="630" y2="330" stroke="rgba(139,111,232,0.35)" />
          <line x1="400" y1="190" x2="400" y2="390" stroke="rgba(139,111,232,0.35)" />
        </svg>
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
        {view.mapNodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`map-node ${node.id}${selectedNode === node.id ? ' on' : ''}${filter !== 'all' && filter !== node.id ? ' dim' : ''}`}
            onClick={() => onSelectNode(node.id)}
          >
            <strong>{node.title}</strong>
            <em>{node.detail}</em>
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
    </section>
  )
}
