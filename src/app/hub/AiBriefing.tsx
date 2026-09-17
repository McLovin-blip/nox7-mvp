import { useSession } from '../state/SessionProvider.tsx'

export function AiBriefing({
  selected,
  onSelect,
  onOpenSource,
  onPrimary,
}: {
  selected: boolean
  onSelect: (prompt: string) => void
  onOpenSource: (id: string) => void
  onPrimary: () => void
}) {
  const { view } = useSession()
  const briefing = view.hub.briefing

  return (
    <section className={`briefing${selected ? ' on' : ''}`} aria-label="Nox AI executive briefing">
      <header>
        <div>
          <span>{briefing.kicker}</span>
          <h2>{briefing.title}</h2>
        </div>
        <div className="briefing-meta">
          <em>Confidence · {briefing.confidence === 'high' ? 'High' : briefing.confidence}</em>
          <small>Freshness · {briefing.freshness}</small>
        </div>
      </header>

      <div className="briefing-grid">
        <div>
          <h3>Verified facts</h3>
          <ul className="fact-list">
            {briefing.facts.map((fact) => (
              <li key={fact.id}>
                <button
                  type="button"
                  className="fact-link"
                  onClick={() => onOpenSource(fact.citationIds[0])}
                >
                  {fact.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Nox AI interpretation</h3>
          <button type="button" className="interpret" onClick={() => onSelect(briefing.askPrompt)}>
            {briefing.interpretation}
          </button>
          <h3>Recommended action</h3>
          <p className="briefing-action">{briefing.recommendedAction}</p>
          <p className="briefing-approval">{briefing.approval}</p>
        </div>
      </div>

      <div className="briefing-foot">
        <div className="sources" aria-label="Supporting sources">
          {briefing.sources.map((source) => (
            <button key={source.id} type="button" onClick={() => onOpenSource(source.id)}>
              <span>{source.kind}</span>
              {source.title}
            </button>
          ))}
        </div>
        <div className="briefing-actions">
          <button className="primary" type="button" onClick={onPrimary}>
            {briefing.primaryCta ?? 'Open phishing risk'}
          </button>
        </div>
      </div>
    </section>
  )
}
