import type { GapStepId } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import './gap.css'

export function ConnectedGapView({
  selectedStep,
  onBack,
  onSelectStep,
  onContinue,
}: {
  selectedStep: GapStepId
  onBack: () => void
  onSelectStep: (id: GapStepId) => void
  onContinue: () => void
}) {
  const { view } = useSession()
  const gap = view.gap
  const detail = gap.details[selectedStep]
  const action = gap.action

  return (
    <div className="gap-view">
      <header className="gap-head">
        <div>
          <button className="ghost" type="button" onClick={onBack}>
            Back to Hub
          </button>
          <p className="gap-kicker">{gap.kicker}</p>
          <h1>{gap.title}</h1>
          <p className="gap-lede">{gap.lede}</p>
        </div>
      </header>

      <ol className="gap-chain" aria-label="Connected compliance gap">
        {gap.steps.map((step) => (
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
            {gap.steps.map((step) => (
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
        <button className="primary" type="button" onClick={onContinue} style={{ marginTop: 12, width: '100%' }}>
          {action.cta}
        </button>
      </aside>
    </div>
  )
}
