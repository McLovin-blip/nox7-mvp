import { connectedGap } from '../mock/store.ts'
import type { GapStepId } from '../mock/types.ts'
import './gap.css'

export function ConnectedGapView({
  selectedStep,
  onBack,
  onSelectStep,
}: {
  selectedStep: GapStepId
  onBack: () => void
  onSelectStep: (id: GapStepId) => void
}) {
  const detail = connectedGap.details[selectedStep]
  const action = connectedGap.action

  return (
    <div className="gap-view">
      <header className="gap-head">
        <div>
          <button className="ghost" type="button" onClick={onBack}>
            Back to Hub
          </button>
          <p className="gap-kicker">{connectedGap.kicker}</p>
          <h1>{connectedGap.title}</h1>
          <p className="gap-lede">{connectedGap.lede}</p>
        </div>
      </header>

      <ol className="gap-chain" aria-label="Connected compliance gap">
        {connectedGap.steps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              className={`gap-step ${step.tone}${selectedStep === step.id ? ' on' : ''}`}
              aria-current={selectedStep === step.id ? 'step' : undefined}
              onClick={() => onSelectStep(step.id)}
            >
              <b>{step.index}</b>
              <span>
                <em>{step.kicker}</em>
                <strong>{step.title}</strong>
                <small>{step.summary}</small>
              </span>
              <i>{step.status}</i>
            </button>
          </li>
        ))}
      </ol>

      <section className="gap-detail" aria-live="polite">
        <header>
          <span>{detail.kicker}</span>
          <i className={detail.tone}>{detail.status}</i>
        </header>
        <h2>{detail.title}</h2>
        <p>{detail.body}</p>
        {detail.items.length > 0 ? (
          <ul>
            {detail.items.map((item) => (
              <li key={`${item.label}-${item.title}`}>
                <em>{item.label}</em>
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
              </li>
            ))}
          </ul>
        ) : (
          <div className="gap-walk">
            {connectedGap.steps.map((step) => (
              <button key={step.id} type="button" onClick={() => onSelectStep(step.id)}>
                {step.kicker}
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="gap-action">
        <span>{action.kicker}</span>
        <strong>{action.title}</strong>
        <p>
          {action.owner} · {action.due}
        </p>
        <p>Approver · {action.approver}</p>
        <p className="gap-note">Not applied until current assessments are approved.</p>
      </aside>
    </div>
  )
}
