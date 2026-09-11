import { briefing, currentUser, hubGreeting, positionStrip, priorityActions } from '../mock/store.ts'
import type { MapFilter, MapNodeId } from '../mock/types.ts'
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
}: {
  mapOpen: boolean
  mapFilter: MapFilter
  selectedNode: MapNodeId
  onToggleMap: () => void
  onFilter: (filter: MapFilter) => void
  onSelectNode: (id: MapNodeId) => void
  onAsk: (prompt?: string) => void
}) {
  return (
    <div className="hub">
      <HubGreeting onAsk={onAsk} onToggleMap={onToggleMap} mapOpen={mapOpen} />
      {mapOpen ? (
        <AssuranceMap
          filter={mapFilter}
          selectedNode={selectedNode}
          onFilter={onFilter}
          onSelectNode={onSelectNode}
        />
      ) : (
        <PositionStrip />
      )}
      <div className="hub-lower">
        <AiBriefing onAsk={onAsk} />
        <PriorityActions />
      </div>
    </div>
  )
}

function HubGreeting({
  mapOpen,
  onToggleMap,
  onAsk,
}: {
  mapOpen: boolean
  onToggleMap: () => void
  onAsk: (prompt?: string) => void
}) {
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="hub-head">
      <div>
        <p className="hub-kicker">{hubGreeting.kicker}</p>
        <h1>
          {hello}, {currentUser.name.split(' ')[0]}.
        </h1>
        <p className="hub-lede">{hubGreeting.lede}</p>
      </div>
      <div className="hub-head-actions">
        <button className="ghost" type="button" onClick={onToggleMap}>
          {mapOpen ? 'Hide assurance map' : 'Assurance map'}
        </button>
        <button className="ghost" type="button" onClick={() => onAsk()}>
          {hubGreeting.reviewPlan}
        </button>
      </div>
    </header>
  )
}

function PositionStrip() {
  const evidence = positionStrip.evidenceHealth
  const lead = positionStrip.leadingFramework

  return (
    <section className="strip" aria-label="Current position">
      <article>
        <span>Compliance readiness</span>
        <strong>{positionStrip.readinessValue}</strong>
        <em>{positionStrip.readinessLabel}</em>
        <i className="bar">
          <b style={{ width: `${positionStrip.readinessValue}%` }} />
        </i>
      </article>
      <article>
        <span>Framework coverage</span>
        <strong>{positionStrip.frameworkCount}</strong>
        <em>{positionStrip.coverageAverage}% avg · {lead?.name} leads at {lead?.coverage}%</em>
        <div className="pips" aria-hidden="true">
          {positionStrip.frameworks.map((item) => (
            <i key={item.id} style={{ width: `${Math.max(18, item.coverage / 5)}%` }} />
          ))}
        </div>
      </article>
      <article className="gap">
        <span>Material gaps</span>
        <strong>{positionStrip.materialGaps}</strong>
        <em>Supplier assurance is highest impact</em>
        <small>Executive attention</small>
      </article>
      <article>
        <span>Evidence health</span>
        <strong>
          {evidence.missing} missing
        </strong>
        <em>
          {evidence.expired} expired · {evidence.duplicate} duplicate · {evidence.expiring} expiring
        </em>
        <i className="bar mixed">
          <b />
        </i>
      </article>
    </section>
  )
}

function AiBriefing({ onAsk }: { onAsk: (prompt?: string) => void }) {
  return (
    <section className="briefing">
      <header>
        <span>Nox AI briefing</span>
        <em>{briefing.confidence === 'high' ? 'High confidence' : briefing.confidence}</em>
      </header>
      <h2>{briefing.title}</h2>
      <p>{briefing.body}</p>
      <div className="chips">
        {briefing.chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      <button className="follow" type="button" onClick={() => onAsk()}>
        Ask a follow-up about this briefing
      </button>
      <div className="prompts">
        {briefing.prompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => onAsk(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </section>
  )
}

function PriorityActions() {
  return (
    <section className="actions">
      <header>
        <span>Priority actions</span>
      </header>
      <ol>
        {priorityActions.map((item, index) => (
          <li key={item.id}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <div>
              <strong>{item.title}</strong>
              <em>
                {item.owner} · {item.due}
              </em>
            </div>
            <small>{item.impact}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}
