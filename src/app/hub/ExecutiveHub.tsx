import type { MapFilter, MapNodeId } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import { AssuranceMap } from './AssuranceMap.tsx'
import './hub.css'

export function ExecutiveHub({
  mapOpen,
  mapFilter,
  selectedNode,
  onToggleMap,
  onFilter,
  onSelectNode,
  onAsk,
  onOpenGap,
  onOpenBoard,
  onUpload,
}: {
  mapOpen: boolean
  mapFilter: MapFilter
  selectedNode: MapNodeId
  onToggleMap: () => void
  onFilter: (filter: MapFilter) => void
  onSelectNode: (id: MapNodeId) => void
  onAsk: (prompt?: string) => void
  onOpenGap: (step?: 'overview' | 'evidence') => void
  onOpenBoard: () => void
  onUpload: () => void
}) {
  const { view } = useSession()
  const closed = view.position === 'after'

  return (
    <div className="hub">
      <header className="hub-head">
        <div>
          <p className="hub-kicker">{view.greeting.kicker}</p>
          <h1>
            {hello()}, {view.currentUser.name.split(' ')[0]}.
          </h1>
          <p className="hub-lede">{view.greeting.lede}</p>
        </div>
        <div className="hub-head-actions">
          <button className="ghost" type="button" onClick={onToggleMap}>
            {mapOpen ? 'Hide assurance map' : 'Assurance map'}
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => (closed ? onOpenBoard() : onAsk())}
          >
            {view.greeting.reviewPlan}
          </button>
        </div>
      </header>
      {mapOpen ? (
        <AssuranceMap
          filter={mapFilter}
          selectedNode={selectedNode}
          onFilter={onFilter}
          onSelectNode={onSelectNode}
          onOpenGap={() => (closed ? onOpenGap('overview') : onOpenGap('overview'))}
        />
      ) : (
        <PositionStrip onOpenGap={() => onOpenGap('overview')} />
      )}
      <div className="hub-lower">
        <AiBriefing
          onAsk={onAsk}
          onPrimary={closed ? onOpenBoard : () => onOpenGap('overview')}
        />
        <PriorityActions onPrimary={closed ? onOpenBoard : onUpload} />
      </div>
    </div>
  )
}

function hello() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

function PositionStrip({ onOpenGap }: { onOpenGap: () => void }) {
  const { view } = useSession()
  const evidence = view.strip.evidenceHealth
  const lead = view.strip.leadingFramework
  const closed = view.position === 'after'

  return (
    <section className="strip" aria-label="Current position">
      <article>
        <span>Compliance readiness</span>
        <strong>{view.strip.readinessValue}</strong>
        <em>{view.strip.readinessLabel}</em>
        <i className="bar">
          <b style={{ width: `${view.strip.readinessValue}%` }} />
        </i>
      </article>
      <article>
        <span>Framework coverage</span>
        <strong>{view.strip.frameworkCount}</strong>
        <em>
          {view.strip.coverageAverage}% avg · {lead?.name} leads at {lead?.coverage}%
        </em>
        <div className="pips" aria-hidden="true">
          {view.strip.frameworks.map((item) => (
            <i key={item.id} style={{ width: `${Math.max(18, item.coverage / 5)}%` }} />
          ))}
        </div>
      </article>
      <button className="gap" type="button" onClick={onOpenGap}>
        <span>Material gaps</span>
        <strong>{view.strip.materialGaps}</strong>
        <em>{closed ? 'Closed for this review' : 'Supplier assurance · highest impact'}</em>
        <small>{closed ? 'Open connected view' : 'Open connected gap'}</small>
      </button>
      <article>
        <span>Evidence health</span>
        <strong>{view.strip.evidenceLabel}</strong>
        <em>
          {closed
            ? `${evidence.missing} missing · ${evidence.superseded} superseded · ${evidence.duplicate} duplicate · ${evidence.expiring} expiring`
            : `${evidence.missing} missing · ${evidence.expired} expired · ${evidence.duplicate} duplicate · ${evidence.expiring} expiring`}
        </em>
        <i className={`bar${closed ? '' : ' mixed'}`}>
          <b style={{ width: closed ? '78%' : undefined }} />
        </i>
      </article>
    </section>
  )
}

function AiBriefing({
  onAsk,
  onPrimary,
}: {
  onAsk: (prompt?: string) => void
  onPrimary: () => void
}) {
  const { view } = useSession()
  const closed = view.position === 'after'
  return (
    <section className="briefing">
      <header>
        <span>Position briefing</span>
        <em>{view.briefing.confidence === 'high' ? 'High confidence' : view.briefing.confidence}</em>
      </header>
      <h2>{view.briefing.title}</h2>
      <p>{view.briefing.body}</p>
      <div className="briefing-actions">
        <button className="primary" type="button" onClick={onPrimary}>
          {closed ? 'Open Board Summary' : 'Open connected gap'}
        </button>
        <button
          className="follow"
          type="button"
          onClick={() => onAsk(closed ? 'Has our position improved?' : 'What is our biggest supplier assurance gap?')}
        >
          Ask Nox
        </button>
      </div>
    </section>
  )
}

function PriorityActions({ onPrimary }: { onPrimary: () => void }) {
  const { view } = useSession()
  return (
    <section className="actions">
      <header>
        <span>Priority actions</span>
      </header>
      <ol>
        {view.actions.map((item, index) => (
          <li key={item.id}>
            {item.primary ? (
              <button type="button" className="action-open" onClick={onPrimary}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div>
                  <strong>{item.title}</strong>
                  <em>
                    {item.owner} · {item.due}
                  </em>
                </div>
                <small>{item.impact}</small>
              </button>
            ) : (
              <>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div>
                  <strong>{item.title}</strong>
                  <em>
                    {item.owner} · {item.due}
                  </em>
                </div>
                <small>{item.impact}</small>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
