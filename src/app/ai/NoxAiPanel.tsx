import { useState } from 'react'
import { lookupSource } from '../mock/store.ts'
import type { AiPanelModel } from '../mock/types.ts'
import './ai.css'

export function NoxAiPanel({
  answer,
  question,
}: {
  answer: AiPanelModel
  question: string
}) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sourceId ? lookupSource(sourceId) : null

  return (
    <aside className="ai-panel" aria-label="Nox AI">
      <header>
        <p className="ai-kicker">Ask Nox AI</p>
        <p className="ai-ctx">{answer.context}</p>
        <h2>{question || answer.question}</h2>
      </header>
      <div className="ai-scroll">
        <section>
          <span>Executive answer</span>
          <p>{answer.executiveAnswer}</p>
        </section>
        <section className="ai-facts">
          <span>Sourced facts</span>
          <p className="ai-note">From seeded records only</p>
          <ul>
            {answer.facts.map((fact) => (
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
          <p className="ai-note">Inference, not a sourced fact</p>
          <p>{answer.interpretation}</p>
        </section>
        <section>
          <span>Connected</span>
          <div className="ai-rel">
            {answer.connected.map((item) => (
              <b key={item}>{item}</b>
            ))}
          </div>
        </section>
        <section>
          <span>Evidence freshness</span>
          <p>{answer.freshness}</p>
        </section>
        <section>
          <span>Confidence</span>
          <p>{answer.confidence === 'high' ? 'High' : answer.confidence}</p>
        </section>
        <section>
          <span>Accountable owner</span>
          <p>{answer.owner}</p>
        </section>
        <section>
          <span>Expected effect</span>
          <p>{answer.expectedImpact}</p>
        </section>
      </div>
      <section className="ai-act">
        <span>Recommended action</span>
        <p className="ai-note">Not applied until human approval</p>
        <p>{answer.recommendedAction}</p>
        <p>{answer.approval}</p>
      </section>
    </aside>
  )
}
