import { useState } from 'react'
import { lookupSource } from '../mock/data.ts'
import type { AiPanelModel, PositionState } from '../mock/types.ts'
import './ai.css'

export function NoxAiPanel({
  answer,
  question,
  position,
  onAsk,
  onOpenSource,
}: {
  answer: AiPanelModel
  question: string
  position: PositionState
  onAsk: (prompt: string) => void
  onOpenSource: (id: string) => void
}) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const source = sourceId ? lookupSource(sourceId, position) : null

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
          <p className="ai-note">From organisation records</p>
          <ul>
            {answer.facts.map((fact) => (
              <li key={`${fact.citationId}-${fact.text}`}>
                {fact.text}{' '}
                <button
                  type="button"
                  className="cite"
                  aria-current={sourceId === fact.citationId}
                  onClick={() => {
                    setSourceId(fact.citationId)
                    onOpenSource(fact.citationId)
                  }}
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
        <section>
          <span>Ask this screen</span>
          <div className="ai-rel">
            {answer.prompts.map((prompt) => (
              <button key={prompt} type="button" className="cite" onClick={() => onAsk(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="ai-act">
        <span>Recommended action</span>
        <p className="ai-note">
          {position === 'after' ? 'Already applied after human approval' : 'Not applied until human approval'}
        </p>
        <p>{answer.recommendedAction}</p>
        <p>{answer.approval}</p>
      </section>
    </aside>
  )
}
