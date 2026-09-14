import type { ReactNode } from 'react'
import {
  assuranceLabel,
  assuranceTone,
  effectivenessLabel,
  formatDate,
  frequencyLabel,
  healthLabel,
  linkedObligations,
  linkedRisks,
  type ControlRecord,
  type ControlNavigateTarget,
} from './controlModel.ts'
import { frameworkName } from '../mock/data.ts'

export function Pill({ tone, children }: { tone: 'ok' | 'watch' | 'bad'; children: ReactNode }) {
  return <span className={`ctl-pill ${tone}`}>{children}</span>
}

export function ControlDetail({
  control,
  onBack,
  onAskNox,
  onNavigate,
  onOwner,
  onEvidence,
  onRisks,
  onObligations,
  onFramework,
  onAction,
  onOpenControl,
}: {
  control: ControlRecord
  onBack: () => void
  onAskNox: (prompt?: string) => void
  onNavigate: (target: ControlNavigateTarget) => void
  onOwner: (personId: string) => void
  onEvidence: () => void
  onRisks: () => void
  onObligations: () => void
  onFramework: (frameworkId: string) => void
  onAction: () => void
  onOpenControl?: (id: string) => void
}) {
  const obligations = linkedObligations(control)
  const risks = linkedRisks(control)
  const open = control.openActions.filter((item) => item.status !== 'completed')

  return (
    <div className="ctl-detail">
      <div className="ctl-crumb">
        <button type="button" onClick={onBack}>
          Controls
        </button>
        <span aria-hidden="true">/</span>
        <span>{control.categoryShort}</span>
        <span aria-hidden="true">/</span>
        <strong>{control.title}</strong>
      </div>

      <header className="ctl-detail-head">
        <p className="ctl-kicker">Control</p>
        <h1>{control.title}</h1>
        <p className="ctl-lede">{control.why}</p>
        <div className="ctl-meta">
          <span>{control.categoryName}</span>
          <span>{control.businessUnit}</span>
          <span>{control.sessionAdded ? 'Session draft' : 'Organisation record'}</span>
        </div>
        <div className="ctl-toolbar">
          <button type="button" className="ctl-ghost" onClick={onBack}>
            Back to inventory
          </button>
          <button type="button" className="ctl-btn" onClick={() => onAskNox(`Why can ${control.title} not be relied upon?`)}>
            Ask Nox about this control
          </button>
          <button type="button" className="ctl-btn primary" onClick={onAction}>
            Review next action
          </button>
        </div>
      </header>

      <section className="ctl-card">
        <header>
          <h2>Relationship</h2>
          <p>Frameworks → obligations → control → evidence → risks protected</p>
        </header>
        <div className="ctl-chain" aria-label="Control relationship">
          {control.frameworkIds.map((id) => (
            <button key={id} type="button" onClick={() => onFramework(id)}>
              {frameworkName(id)}
            </button>
          ))}
          <em>→</em>
          <button type="button" onClick={onObligations}>
            {control.obligationIds.length} obligations
          </button>
          <em>→</em>
          <button type="button" onClick={() => onOpenControl?.(control.id)}>
            {control.title}
          </button>
          <em>→</em>
          <button type="button" onClick={onEvidence}>
            {healthLabel(control.evidenceHealth)} evidence
          </button>
          <em>→</em>
          <button type="button" onClick={onRisks}>
            {control.riskIds.length} risks protected
          </button>
        </div>
      </section>

      <div className="ctl-detail-grid ctl-split two">
        <section className="ctl-card">
          <header>
            <h2>1. Executive assurance conclusion</h2>
          </header>
          <p>
            <Pill tone={assuranceTone(control.overall)}>{assuranceLabel(control.overall)}</Pill>
          </p>
          <p className="ctl-lede">
            {control.overall === 'unverifiable'
              ? 'This control cannot yet be relied on because current evidence is insufficient. That is not the same as failed.'
              : control.overall === 'ineffective'
                ? 'Current evidence is enough to conclude the control is not operating as intended.'
                : control.overall === 'effective'
                  ? 'Design, operation and current evidence support reliance for this review.'
                  : 'Some assurance exists, but not enough for full reliance.'}
          </p>
        </section>
        <section className="ctl-card">
          <header>
            <h2>2. Why the conclusion was reached</h2>
          </header>
          <p className="ctl-lede">{control.why}</p>
        </section>
        <section className="ctl-card">
          <header>
            <h2>3. What changed</h2>
          </header>
          <p className="ctl-lede">{control.whatChanged}</p>
        </section>
        <section className="ctl-card">
          <header>
            <h2>4–6. Trust profile</h2>
          </header>
          <dl className="ctl-dl">
            <dt>Design</dt>
            <dd>
              <button type="button" className="ctl-linkish" onClick={() => onAskNox(`Why is design for ${control.title} ${effectivenessLabel(control.design).toLowerCase()}?`)}>
                {effectivenessLabel(control.design)}
              </button>
            </dd>
            <dt>Operation</dt>
            <dd>
              <button type="button" className="ctl-linkish" onClick={() => onAskNox(`Why can ${control.title} not be relied upon?`)}>
                {effectivenessLabel(control.operating)}
              </button>
            </dd>
            <dt>Evidence</dt>
            <dd>
              <button type="button" className="ctl-linkish" onClick={onEvidence}>
                {healthLabel(control.evidenceHealth)} · {control.evidenceSufficiency}
              </button>
            </dd>
          </dl>
        </section>
      </div>

      <div className="ctl-detail-grid ctl-split two">
        <section className="ctl-card">
          <header>
            <h2>7. Connected risks</h2>
            <p>{risks.length} organisational risks this control is intended to mitigate.</p>
          </header>
          <ul className="ctl-list">
            {risks.length ? (
              risks.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onNavigate({ type: 'module', module: 'risks', recordId: item.id })}>
                    <span>
                      {item.title}
                      <em className="ctl-muted"> · {item.severity} · {item.unit}</em>
                    </span>
                    <b>Open</b>
                  </button>
                </li>
              ))
            ) : (
              <li>
                <button type="button" onClick={onRisks}>
                  No mapped risks yet
                </button>
              </li>
            )}
          </ul>
        </section>
        <section className="ctl-card">
          <header>
            <h2>8. Connected obligations and frameworks</h2>
          </header>
          <div className="ctl-pills">
            {control.frameworkIds.map((id) => (
              <button key={id} type="button" className="ctl-chip" onClick={() => onFramework(id)}>
                {frameworkName(id)}
              </button>
            ))}
            {control.mappingLabels
              .filter((label) => !control.frameworkIds.some((id) => frameworkName(id) === label))
              .map((label) => (
                <span key={label} className="ctl-pill">
                  {label}
                </span>
              ))}
          </div>
          <ul className="ctl-list">
            {obligations.length ? (
              obligations.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onNavigate({ type: 'module', module: 'regulatory', recordId: item.id })}>
                    <span>
                      {item.title}
                      <em className="ctl-muted"> · {item.framework}</em>
                    </span>
                    <b>Open</b>
                  </button>
                </li>
              ))
            ) : (
              <li>
                <button type="button" onClick={onObligations}>
                  No mapped obligations yet
                </button>
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="ctl-card">
        <header>
          <h2>9. Supporting evidence</h2>
          <p>Evidence health is {healthLabel(control.evidenceHealth).toLowerCase()}.</p>
        </header>
        <button type="button" className="ctl-btn" onClick={onEvidence}>
          Open evidence records
        </button>
      </section>

      <div className="ctl-detail-grid ctl-split two">
        <section className="ctl-card">
          <header>
            <h2>10. Testing and assessment history</h2>
          </header>
          <ul className="ctl-list">
            {control.testingHistory.map((item) => (
              <li key={`${item.date}-${item.result}`}>
                <button type="button" onClick={() => onAskNox(`What changed for ${control.title}?`)}>
                  <span>
                    {formatDate(item.date)} · {item.result}
                    <em className="ctl-muted"> · {item.assessor}</em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="ctl-card">
          <header>
            <h2>11. Owner and accountability</h2>
          </header>
          <dl className="ctl-dl">
            <dt>Owner</dt>
            <dd>
              <button type="button" className="ctl-linkish" onClick={() => onOwner(control.ownerId)}>
                {control.owner}, {control.ownerRole}
              </button>
            </dd>
            <dt>Executive</dt>
            <dd>
              <button type="button" className="ctl-linkish" onClick={() => onOwner(control.accountableExecutiveId)}>
                {control.accountableExecutive}
              </button>
            </dd>
            <dt>Type</dt>
            <dd>
              {control.type} · {control.execution} · {frequencyLabel(control.frequency)}
            </dd>
            <dt>Last assessed</dt>
            <dd>{formatDate(control.lastAssessed)}</dd>
            <dt>Next assessment</dt>
            <dd>{formatDate(control.nextAssessment)}</dd>
          </dl>
        </section>
      </div>

      <section className="ctl-card">
        <header>
          <h2>12. Open actions</h2>
        </header>
        <ul className="ctl-list">
          {(open.length ? open : control.openActions).length ? (
            (open.length ? open : control.openActions).map((item) => (
              <li key={item.id}>
                <button type="button" onClick={onAction}>
                  <span>
                    {item.title}
                    <em className="ctl-muted">
                      {' '}
                      · {item.owner} · {formatDate(item.dueDate)} · {item.status}
                    </em>
                  </span>
                  <b>Review</b>
                </button>
              </li>
            ))
          ) : (
            <li>
              <button type="button" onClick={onAction}>
                No open actions for this control
              </button>
            </li>
          )}
        </ul>
      </section>

      <div className="ctl-detail-grid ctl-split two">
        <section className="ctl-card">
          <header>
            <h2>13. Nox AI analysis</h2>
          </header>
          <p className="ctl-lede">{control.why}</p>
          <button type="button" className="ctl-btn" onClick={() => onAskNox(`Why can ${control.title} not be relied upon?`)}>
            Ask Nox why this conclusion was reached
          </button>
        </section>
        <section className="ctl-card">
          <header>
            <h2>14. Recommended next action</h2>
          </header>
          <p className="ctl-lede">{control.nextAction}</p>
          <p className="ctl-muted">Due {formatDate(control.dueDate)} · {control.owner}</p>
          <button type="button" className="ctl-btn primary" onClick={onAction}>
            Open review workflow
          </button>
        </section>
      </div>
    </div>
  )
}
