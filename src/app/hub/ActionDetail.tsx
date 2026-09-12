import { useEffect } from 'react'
import type { HubAction } from '../mock/hubModel.ts'

export function ActionDetail({
  action,
  onClose,
  onAsk,
  onContinue,
}: {
  action: HubAction
  onClose: () => void
  onAsk: () => void
  onContinue: () => void
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="action-overlay" role="presentation" onClick={onClose}>
      <div
        className="action-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <span>{action.primary ? 'Primary action' : 'Watch item'}</span>
          <button type="button" className="ghost" onClick={onClose} aria-label="Close action detail">
            Close
          </button>
        </header>
        <h2 id="action-detail-title">{action.title}</h2>
        <p className="action-record">{action.recordTitle}</p>
        <dl className="action-dl">
          <div>
            <dt>Accountable owner</dt>
            <dd>
              {action.owner}, {action.ownerRole}
            </dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{action.due}</dd>
          </div>
          <div>
            <dt>Approval</dt>
            <dd>{action.approvalStatus}</dd>
          </div>
          <div>
            <dt>Business and assurance impact</dt>
            <dd>{action.impact}</dd>
          </div>
        </dl>
        <div className="briefing-actions">
          <button className="primary" type="button" onClick={onContinue}>
            {action.cta}
          </button>
          <button className="follow" type="button" onClick={onAsk}>
            Discuss with Nox
          </button>
        </div>
      </div>
    </div>
  )
}
