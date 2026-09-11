import { useState } from 'react'
import { Owl, Orbit, Wordmark } from './Brand.tsx'
import { activity, ai, frameworks, nav, org, position, sources } from './content.ts'

type Screen = 'login' | 'hub'

export function DirectionC({
  screen,
  aiOpen,
  theme,
  onShowHub,
  onToggleAi,
}: {
  screen: Screen
  aiOpen: boolean
  theme: 'dark' | 'light'
  onShowHub: () => void
  onToggleAi: () => void
}) {
  const root = `dir-c theme-${theme}`

  if (screen === 'login') {
    return (
      <div className={`${root} c-login`}>
        <aside className="c-aside">
          <div className="c-mark">
            <Owl className="owl" />
            <Wordmark className="wordmark" />
          </div>
          <Orbit className="c-orbit" />
          <p className="c-antler">Prepared for Antler</p>
        </aside>
        <div className="c-form-wrap">
          <div className="c-form">
            <h1>Sign in</h1>
            <p className="sub">Meridian International</p>
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
              <div className="row">
                <span className="forgot">Forgot password</span>
              </div>
              <button className="submit" type="submit">
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${root} c-hub`}>
      <header className="c-top">
        <div className="c-mark">
          <Owl className="owl" />
          <Wordmark className="wordmark" />
        </div>
        <nav className="c-nav" aria-label="Product">
          {nav.map((item) => (
            <span key={item} aria-current={item === 'Hub' ? 'page' : undefined}>
              {item}
            </span>
          ))}
        </nav>
        <p className="who">
          {org.user} · {org.role}
        </p>
        <button className="c-ask" type="button" onClick={onToggleAi}>
          Ask Nox AI
        </button>
      </header>
      <div className={`c-page${aiOpen ? '' : ' ai-closed'}`}>
        <div className="c-doc">
          <div className="c-title">
            <h1>Executive Hub</h1>
            <p>
              {org.name} · {org.review}
            </p>
          </div>
          <section className="c-matter">
            <header>
              <span>Matter for attention</span>
              <span>Obligation · Evidence · Approval</span>
            </header>
            <article>
              <h2>{position.attention}</h2>
              <p>
                {position.changed} {position.assurance}
              </p>
            </article>
          </section>
          <div className="c-grid">
            <div className="c-box">
              <h3>Framework coverage</h3>
              <ul className="c-bars">
                {frameworks.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <i style={{ ['--w' as string]: `${item.coverage}%` }} />
                    <span>{item.coverage}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="c-box">
              <h3>Evidence health</h3>
              <ul className="c-list">
                <li>Supplier-assurance policy — current</li>
                <li>Critical-supplier assessments — missing</li>
                <li>2023 assessment pack — expired</li>
                <li>Business continuity test — expiring</li>
              </ul>
            </div>
            <div className="c-box">
              <h3>Connected risks and controls</h3>
              <ul className="c-list">
                <li>Control: supplier assurance — partial</li>
                <li>Risk: third-party assurance — elevated</li>
                <li>Risk: regulatory exposure — elevated</li>
                <li>Readiness {position.readinessValue} — {position.readinessLabel}</li>
              </ul>
            </div>
            <div className="c-box">
              <h3>Recent activity</h3>
              <ul className="c-list">
                {activity.map((item) => (
                  <li key={item.text}>
                    {item.when}: {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="c-approve">
            <div>
              <p className="mark">Recommended action</p>
              <strong>{position.next}</strong>
              <div>{position.owner}</div>
            </div>
            <div className="mark">For approval</div>
          </div>
        </div>
        {aiOpen ? <PanelC /> : null}
      </div>
    </div>
  )
}

function PanelC() {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sources.find((item) => item.id === sourceId)

  return (
    <aside className="c-panel" aria-label="Nox AI">
      <p className="memo">Nox AI briefing</p>
      <h2 className="serif">{ai.question}</h2>
      <p className="ctx">{ai.context}</p>
      <h3>Executive answer</h3>
      <p>{ai.answer}</p>
      <h3>Sourced facts</h3>
      <ol>
        {ai.facts.map((fact, index) => (
          <li key={fact.citationId}>
            {fact.text}{' '}
            <button
              className="fn"
              type="button"
              aria-current={sourceId === fact.citationId}
              onClick={() => setSourceId(fact.citationId)}
            >
              [{index + 1}]
            </button>
          </li>
        ))}
      </ol>
      <h3>AI interpretation</h3>
      <p className="interp">{ai.interpretation}</p>
      <h3>Connected obligations, controls, evidence and risks</h3>
      <p>
        {ai.connected.obligations.join('; ')}. Controls: {ai.connected.controls.join(', ')}.
        Evidence: {ai.connected.evidence.join(', ')}. Risks: {ai.connected.risks.join(', ')}.
      </p>
      <h3>Confidence and evidence freshness</h3>
      <p>
        {ai.confidence}. {ai.freshness}
      </p>
      <div className="action">
        <h3>Recommended next action</h3>
        <p>{ai.action}</p>
        <p>{ai.approval}</p>
      </div>
      {source ? (
        <div className="src">
          <strong>{source.title}</strong>
          <div>
            {source.kind} · {source.freshness}
          </div>
          <div>{source.meta}</div>
        </div>
      ) : null}
    </aside>
  )
}
