import { useState } from 'react'
import { hubAi, lookupSource } from '../mock/store.ts'
import './ai.css'

export function NoxAiPanel({ question }: { question: string }) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sourceId ? lookupSource(sourceId) : null

  return (
    <aside className="ai-panel" aria-label="Nox AI">
      <header>
        <p className="ai-kicker">Ask Nox AI</p>
        <p className="ai-ctx">{hubAi.context}</p>
        <h2>{question || hubAi.question}</h2>
      </header>
      <div className="ai-scroll">
        <section>
          <span>Executive answer</span>
          <p>{hubAi.executiveAnswer}</p>
        </section>
        <section className="ai-facts">
          <span>Sourced facts</span>
          <ul>
            {hubAi.facts.map((fact) => (
              <li key={fact.citationId}>
                {fact.text}{' '}
                <button
                  type="button"
                  className="cite"
                  aria-current={sourceId === fact.citationId}
                  onClick={() => setSourceId(fact.citationId)}
                >
                  Source
                </button>
              </li>
            ))}
          </ul>
          {source ? (
            <div className="ai-source">
              <strong>{source.title}</strong>
              <div>
                {source.kind} · {source.freshness}
              </div>
              <div>{source.meta}</div>
            </div>
          ) : null}
        </section>
        <section className="ai-interp">
          <span>AI interpretation</span>
          <p>{hubAi.interpretation}</p>
        </section>
        <section>
          <span>Connected</span>
          <div className="ai-rel">
            {hubAi.connected.map((item) => (
              <b key={item}>{item}</b>
            ))}
          </div>
        </section>
        <section>
          <span>Evidence freshness</span>
          <p>{hubAi.freshness}</p>
        </section>
        <section>
          <span>Confidence</span>
          <p>{hubAi.confidence === 'high' ? 'High' : hubAi.confidence}</p>
        </section>
        <section>
          <span>Accountable owner</span>
          <p>{hubAi.owner}</p>
        </section>
        <section>
          <span>Expected effect</span>
          <p>{hubAi.expectedImpact}</p>
        </section>
      </div>
      <section className="ai-act">
        <span>Recommended action</span>
        <p>{hubAi.recommendedAction}</p>
        <p>{hubAi.approval}</p>
      </section>
    </aside>
  )
}
