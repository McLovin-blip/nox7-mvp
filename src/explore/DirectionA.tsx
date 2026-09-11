import { useState } from 'react'
import { Owl } from './Brand.tsx'
import {
  activity,
  ai,
  frameworks,
  nav,
  org,
  position,
  sources,
} from './content.ts'

export function DirectionA({
  aiOpen,
  onToggleAi,
}: {
  aiOpen: boolean
  onToggleAi: () => void
}) {
  return (
    <div className="dir-a a-hub">
      <aside className="a-rail">
        <Owl className="owl" />
        <nav className="a-nav" aria-label="Product">
          {nav.map((item) => (
            <span key={item} aria-current={item === 'Hub' ? 'page' : undefined}>
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <div className="a-main">
        <header className="a-top">
          <span className="org">{org.name}</span>
          <span className="sep">/</span>
          <span className="mute">{org.review}</span>
          <span className="mute">
            {org.user} · {org.role}
          </span>
          <button className="a-ask" type="button" onClick={onToggleAi}>
            Ask Nox AI
          </button>
        </header>
        <div className={`a-body${aiOpen ? '' : ' ai-closed'}`}>
          <div className="a-canvas">
            <div className="a-briefing">
              <i />
              <p>{ai.answer}</p>
            </div>
            <div className="a-split">
              <div>
                <p className="a-kicker">Current position</p>
                <h2>Coverage is substantial. Assurance is uneven.</h2>
                <p className="lede">{position.changed}</p>
              </div>
              <dl className="a-ledger">
                <div>
                  <dt>Readiness</dt>
                  <dd>
                    {position.readinessLabel} · {position.readinessValue}
                  </dd>
                </div>
                <div>
                  <dt>Frameworks</dt>
                  <dd>{frameworks.map((item) => `${item.name} ${item.coverage}%`).join(' · ')}</dd>
                </div>
                <div>
                  <dt>Evidence health</dt>
                  <dd>{position.evidence}</dd>
                </div>
                <div>
                  <dt>Control assurance</dt>
                  <dd>{position.assurance}</dd>
                </div>
                <div>
                  <dt>Connected risks</dt>
                  <dd>{position.risks}</dd>
                </div>
                <div>
                  <dt>Accountable</dt>
                  <dd>{position.owner}</dd>
                </div>
              </dl>
            </div>
            <div className="a-attention">
              <div>
                <p className="a-kicker">Requires attention</p>
                <h3>{position.attention}</h3>
                <p>{position.next}</p>
              </div>
              <ul className="a-activity">
                {activity.map((item) => (
                  <li key={item.text}>
                    <span>{item.when}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {aiOpen ? <PanelA /> : null}
        </div>
      </div>
    </div>
  )
}

function PanelA() {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sources.find((item) => item.id === sourceId)

  return (
    <aside className="a-panel" aria-label="Nox AI">
      <header>
        <p>{ai.context}</p>
        <h2>{ai.question}</h2>
      </header>
      <div className="block">
        <p className="label">Executive answer</p>
        <p>{ai.answer}</p>
      </div>
      <div className="block">
        <p className="label">Sourced facts</p>
        <ul className="a-facts">
          {ai.facts.map((fact) => (
            <li key={fact.citationId}>
              {fact.text}{' '}
              <button
                className="cite"
                type="button"
                aria-current={sourceId === fact.citationId}
                onClick={() => setSourceId(fact.citationId)}
              >
                Source
              </button>
            </li>
          ))}
        </ul>
        {source ? (
          <div className="a-source">
            <strong>{source.title}</strong>
            <div>
              {source.kind} · {source.freshness}
            </div>
            <div>{source.meta}</div>
          </div>
        ) : null}
      </div>
      <div className="block a-interp">
        <p className="label">AI interpretation</p>
        <p>{ai.interpretation}</p>
      </div>
      <div className="block">
        <p className="label">Connected</p>
        <div className="a-chips">
          {[...ai.connected.obligations, ...ai.connected.controls, ...ai.connected.risks].map(
            (item) => (
              <b key={item}>{item}</b>
            ),
          )}
        </div>
      </div>
      <div className="block">
        <p className="label">Confidence · freshness</p>
        <p>
          {ai.confidence}. {ai.freshness}
        </p>
      </div>
      <div className="block a-action">
        <p className="label">Recommended action</p>
        <p>{ai.action}</p>
        <p>{ai.approval}</p>
        <span className="go">Approval required</span>
      </div>
    </aside>
  )
}
