import { useState } from 'react'
import { Owl, Orbit, Wordmark } from './Brand.tsx'
import { ai, frameworks, nav, org, position, sources } from './content.ts'

type Screen = 'login' | 'hub'

export function DirectionB({
  screen,
  aiOpen,
  onShowHub,
  onToggleAi,
}: {
  screen: Screen
  aiOpen: boolean
  onShowHub: () => void
  onToggleAi: () => void
}) {
  if (screen === 'login') {
    return (
      <div className="dir-b b-login">
        <div className="b-orbit-field">
          <Orbit className="b-orbit" />
        </div>
        <div className="b-sign">
          <Wordmark className="wordmark" />
          <form
            onSubmit={(event) => {
              event.preventDefault()
              onShowHub()
            }}
          >
            <label>
              Email
              <input type="email" name="email" autoComplete="username" />
            </label>
            <label>
              Password
              <input type="password" name="password" autoComplete="current-password" />
            </label>
            <button className="submit" type="submit">
              Sign in
            </button>
          </form>
          <div className="aux">
            <span>Forgot password</span>
            <span>Prepared for Antler</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dir-b b-hub">
      <header className="b-top">
        <div className="b-brand">
          <Owl className="owl" />
          <Wordmark className="wordmark" />
        </div>
        <nav className="b-nav" aria-label="Product">
          {nav.map((item) => (
            <span key={item} aria-current={item === 'Hub' ? 'page' : undefined}>
              {item}
            </span>
          ))}
        </nav>
        <p className="ctx">
          {org.name} · {org.review}
        </p>
        <button className="b-ask" type="button" onClick={onToggleAi}>
          Ask Nox AI
        </button>
      </header>
      <div className={`b-workspace${aiOpen ? '' : ' ai-closed'}`}>
        <div className="b-map">
          <div className="b-map-head">
            <p>
              {org.user}, {org.role}
            </p>
            <h1>One gap, four frameworks</h1>
          </div>
          <div className="b-graph">
            <div className="b-frameworks">
              {frameworks.map((item) => (
                <div className="b-node" key={item.name}>
                  <strong>Framework</strong>
                  {item.name}
                  <div>{item.coverage}% coverage</div>
                </div>
              ))}
            </div>
            <div className="b-spine" aria-hidden="true" />
            <div className="b-center">
              <h2>Supplier assurance</h2>
              <p>{position.attention}</p>
            </div>
            <div className="b-spine" aria-hidden="true" />
            <div className="b-outcomes">
              <div className="b-node">
                <strong>Evidence</strong>
                Assessments missing
                <div>Policy current</div>
              </div>
              <div className="b-node">
                <strong>Control</strong>
                Partially assured
              </div>
              <div className="b-node">
                <strong>Risks</strong>
                Third-party · Regulatory
              </div>
            </div>
          </div>
          <div className="b-status">
            <div>
              <span>Changed</span>
              <p>{position.changed}</p>
            </div>
            <div>
              <span>Evidence health</span>
              <p>{position.evidence}</p>
            </div>
            <div>
              <span>Accountable</span>
              <p>{position.owner}</p>
            </div>
            <div>
              <span>Next</span>
              <p>{position.next}</p>
            </div>
          </div>
        </div>
        {aiOpen ? <PanelB /> : null}
      </div>
    </div>
  )
}

function PanelB() {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sources.find((item) => item.id === sourceId)

  return (
    <aside className="b-panel" aria-label="Nox AI">
      <p className="layer">Intelligence layer · {ai.context}</p>
      <h2>{ai.question}</h2>
      <p className="q">Reading the highlighted relationship on the Hub.</p>
      <p className="answer">{ai.answer}</p>
      <section>
        <span className="label">Sourced facts</span>
        <ul className="b-facts">
          {ai.facts.map((fact) => (
            <li key={fact.citationId}>
              {fact.text}{' '}
              <button
                className="cite"
                type="button"
                aria-current={sourceId === fact.citationId}
                onClick={() => setSourceId(fact.citationId)}
              >
                Open source
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <span className="label">AI interpretation</span>
        <p>{ai.interpretation}</p>
      </section>
      <section>
        <span className="label">Connected records</span>
        <div className="b-rel">
          {ai.connected.obligations.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {ai.connected.risks.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
      <section>
        <span className="label">Confidence · freshness</span>
        <p>
          {ai.confidence}. {ai.freshness}
        </p>
      </section>
      <div className="b-next">
        <span className="label">Recommended action</span>
        <p>{ai.action}</p>
        <p>{ai.approval}</p>
      </div>
      {source ? (
        <div className="b-source">
          <strong>{source.title}</strong>
          <div>
            {source.kind} · {source.freshness} · {source.meta}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
