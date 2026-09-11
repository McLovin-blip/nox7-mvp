import { useState } from 'react'
import { Owl } from './Brand.tsx'
import { activity, ai, frameworks, nav, org, position, sources } from './content.ts'

export function DirectionMix({
  aiOpen,
  onToggleAi,
}: {
  aiOpen: boolean
  onToggleAi: () => void
}) {
  return (
    <div className="dir-mix">
      <aside className="mix-rail">
        <Owl className="owl" />
        <nav aria-label="Product">
          {nav.map((item) => (
            <span key={item} aria-current={item === 'Hub' ? 'page' : undefined}>
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <div className="mix-shell">
        <header className="mix-top">
          <div className="mix-crumb">
            <strong>{org.name}</strong>
            <span>Organisation</span>
          </div>
          <span className="mix-chip">{org.review}</span>
          <span className="mix-user">
            {org.user}
            <em>{org.role}</em>
          </span>
          <button className="mix-ask" type="button" onClick={onToggleAi}>
            <span>Ask Nox AI</span>
            <kbd>⌘K</kbd>
          </button>
        </header>
        <div className={`mix-body${aiOpen ? '' : ' ai-closed'}`}>
          <div className="mix-canvas">
            <div className="mix-bg" aria-hidden="true" />
            <section className="mix-stage" aria-label="Connected compliance">
              <div className="mix-intro">
                <p className="mix-kicker">Executive Hub</p>
                <h1>
                  Coverage is substantial. Assurance is <em>uneven.</em>
                </h1>
                <p className="mix-lede">{position.changed}</p>
                <div className="mix-chips">
                  {frameworks.map((item) => (
                    <span key={item.name}>
                      {item.name}
                      <b>{item.coverage}%</b>
                    </span>
                  ))}
                </div>
                <div className="mix-impact">
                  <div>
                    <span>Control assurance</span>
                    <strong>Partial — policy without current assessments</strong>
                  </div>
                  <div>
                    <span>Connected exposure</span>
                    <strong>Third-party · Regulatory</strong>
                  </div>
                </div>
                <button className="mix-gap" type="button" onClick={onToggleAi}>
                  Ask about this gap
                </button>
              </div>

              <div className="mix-rad">
                <i className="mix-ring r1" />
                <i className="mix-ring r2" />
                <div className="mix-core">
                  <span>Material gap</span>
                  <h2>Supplier assurance</h2>
                  <p>{position.attention}</p>
                </div>
                <div className="mix-sat n">
                  <i />
                  <small>Frameworks</small>
                </div>
                <div className="mix-sat e">
                  <i />
                  <small>Controls</small>
                </div>
                <div className="mix-sat s alert">
                  <i />
                  <small>Evidence</small>
                </div>
                <div className="mix-sat w">
                  <i />
                  <small>Risks</small>
                </div>
              </div>
            </section>
          </div>

          <div className="mix-side">
            <section className="mix-hpan">
              <header>
                <span>What changed</span>
              </header>
              <ul>
                {activity.map((item) => (
                  <li key={item.text}>
                    <i aria-hidden="true" />
                    <div>
                      <strong>{item.text}</strong>
                      <em>{item.when}</em>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="mix-hpan">
              <header>
                <span>Priority action</span>
                <em>For approval</em>
              </header>
              <ol>
                <li>
                  <b>1</b>
                  <div>
                    <strong>{position.next}</strong>
                    <em>
                      Improves coverage across four frameworks · {position.owner}
                    </em>
                  </div>
                </li>
              </ol>
            </section>
          </div>

          {aiOpen ? <MixPanel /> : null}
        </div>
      </div>
    </div>
  )
}

function MixPanel() {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sources.find((item) => item.id === sourceId)

  return (
    <aside className="mix-panel" aria-label="Nox AI">
      <header>
        <p className="mix-layer">Intelligence layer</p>
        <p className="mix-ctx">{ai.context}</p>
        <h2>{ai.question}</h2>
      </header>
      <div className="mix-scroll">
      <div className="mix-block">
        <span>Executive answer</span>
        <p>{ai.answer}</p>
      </div>
      <div className="mix-block">
        <span>Sourced facts</span>
        <ul>
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
          <div className="mix-src">
            <strong>{source.title}</strong>
            <div>
              {source.kind} · {source.freshness}
            </div>
            <div>{source.meta}</div>
          </div>
        ) : null}
      </div>
      <div className="mix-block mix-interp">
        <span>AI interpretation</span>
        <p>{ai.interpretation}</p>
      </div>
      <div className="mix-block">
        <span>Connected</span>
        <div className="mix-rel">
          {ai.connected.obligations.map((item) => (
            <b key={item}>{item}</b>
          ))}
        </div>
      </div>
      <div className="mix-block">
        <span>Confidence · freshness</span>
        <p>
          {ai.confidence}. {ai.freshness}
        </p>
      </div>
      </div>
      <div className="mix-block mix-act">
        <span>Recommended action</span>
        <p>{ai.action}</p>
        <p>{ai.approval}</p>
      </div>
    </aside>
  )
}
