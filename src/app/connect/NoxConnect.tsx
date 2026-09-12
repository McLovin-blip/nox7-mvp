import type { ConnectNavigate } from '../mock/connectModel.ts'
import { useSession } from '../state/SessionProvider.tsx'
import './connect.css'

function AssuranceRing({ value }: { value: number }) {
  const size = 118
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="connect-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(139,111,232,0.16)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--purple)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="connect-ring-label">
        <strong>{value}%</strong>
        <span>Assurance</span>
      </div>
    </div>
  )
}

function RiskRing({
  total,
  segments,
}: {
  total: number
  segments: { key: string; label: string; value: number; color: string }[]
}) {
  const size = 118
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const arcs = segments.reduce<
    { key: string; color: string; length: number; dashoffset: number }[]
  >((list, segment) => {
    const length = total === 0 ? 0 : (segment.value / total) * circumference
    const previous = list.reduce((sum, item) => sum + item.length, 0)
    list.push({
      key: segment.key,
      color: segment.color,
      length,
      dashoffset: circumference * 0.25 - previous,
    })
    return list
  }, [])
  return (
    <div className="connect-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={arc.dashoffset}
          />
        ))}
      </svg>
      <div className="connect-ring-label">
        <strong>{total}</strong>
        <span>Total risks</span>
      </div>
    </div>
  )
}

export function NoxConnect
({
  onAsk,
  onNavigate,
}: {
  onAsk: (prompt?: string) => void
  onNavigate: (target: ConnectNavigate) => void
}) {
  const { view } = useSession()
  const model = view.connect

  return (
    <div className="connect-page">
      <header className="connect-hero">
        <div>
          <p className="connect-kicker">Nox Connect</p>
          <h1>Your complete GRC &amp; Cyber estate, connected</h1>
          <p className="connect-lede">
            A unified view of your risks, controls, regulatory obligations, evidence and assurance
            position — so you can see what matters, why it matters, and what to do next.
          </p>
        </div>
        <div className="connect-hero-meta">
          <strong>{model.organisationName}</strong>
          <span>{model.reviewLine}</span>
        </div>
      </header>

      <section className="connect-row-3" aria-label="Organisation position">
        <article className="connect-card">
          <header className="connect-card-head">
            <h2>Overall assurance</h2>
            <em>{model.overallLabel}</em>
          </header>
          <div className="connect-assurance">
            <AssuranceRing value={model.overall} />
            <div className="connect-score-list">
              <div>
                <span>Controls</span>
                <b>{model.controlsScore}%</b>
                <i style={{ width: `${model.controlsScore}%` }} />
              </div>
              <div>
                <span>Evidence</span>
                <b>{model.evidenceScore}%</b>
                <i style={{ width: `${model.evidenceScore}%` }} />
              </div>
              <div>
                <span>Regulatory</span>
                <b>{model.regulatoryScore}%</b>
                <i style={{ width: `${model.regulatoryScore}%` }} />
              </div>
            </div>
          </div>
          <p className={`connect-trend${model.trend > 0 ? ' up' : ''}`}>{model.trendLabel}</p>
          <p className="connect-why">{model.whyAssurance}</p>
          <button
            type="button"
            className="connect-link"
            onClick={() => onAsk(`Why is our assurance position ${model.overall}%?`)}
          >
            Why is assurance {model.overall}%?
          </button>
        </article>

        <article className="connect-card">
          <header className="connect-card-head">
            <h2>Organisational risk exposure</h2>
            <em>Executive summary</em>
          </header>
          <div className="connect-assurance">
            <RiskRing total={model.riskExposure.total} segments={model.riskExposure.segments} />
            <ul className="connect-legend">
              {model.riskExposure.segments.map((segment) => (
                <li key={segment.key}>
                  <i style={{ background: segment.color }} />
                  {segment.label} <b>{segment.value}</b>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" className="connect-link" onClick={() => onNavigate({ type: 'module', module: 'risks' })}>
            View all risks →
          </button>
        </article>

        <article className="connect-card">
          <header className="connect-card-head">
            <h2>Regulatory position</h2>
            <em>{model.regulatoryScore}% average coverage</em>
          </header>
          <div className="connect-frameworks">
            {model.frameworks.map((framework) => (
              <div key={framework.id}>
                <span>
                  {framework.name}
                  <b>{framework.coverage}%</b>
                </span>
                <div className="connect-bar">
                  <i style={{ width: `${framework.coverage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="connect-link"
            onClick={() => onNavigate({ type: 'module', module: 'regulatory' })}
          >
            View regulatory gaps →
          </button>
        </article>
      </section>

      <section className="connect-card connect-chain" aria-label="Connected GRC view">
        <header className="connect-section-head">
          <div>
            <h2>Connected GRC view</h2>
            <p>See how risks, controls, regulatory obligations, evidence and actions connect across your organisation.</p>
          </div>
          <button type="button" className="primary" onClick={() => onNavigate({ type: 'gap', step: 'overview' })}>
            Explore the connections →
          </button>
        </header>
        <div className="connect-flow">
          <button type="button" className="connect-node" onClick={() => onNavigate({ type: 'module', module: 'risks' })}>
            <span>Risks</span>
            <strong>{model.chain.risks.total}</strong>
            <em>{model.chain.risks.critical} elevated</em>
            <em>{model.chain.risks.medium} watch</em>
          </button>
          <span className="connect-arrow" aria-hidden="true">
            →
          </span>
          <button type="button" className="connect-node" onClick={() => onNavigate({ type: 'module', module: 'controls' })}>
            <span>Controls</span>
            <strong>{model.chain.controls.total}</strong>
            <em>{model.chain.controls.ineffective} partially assured</em>
            <em>{model.chain.controls.needEvidence} need evidence</em>
          </button>
          <span className="connect-arrow" aria-hidden="true">
            →
          </span>
          <button type="button" className="connect-node" onClick={() => onNavigate({ type: 'module', module: 'regulatory' })}>
            <span>Regulatory</span>
            <strong>{model.chain.regulatory.total}</strong>
            <em>{model.chain.regulatory.withGaps} with gaps</em>
            <em>{model.chain.regulatory.highExposure} high exposure</em>
          </button>
          <span className="connect-arrow" aria-hidden="true">
            →
          </span>
          <button type="button" className="connect-node" onClick={() => onNavigate({ type: 'module', module: 'evidence' })}>
            <span>Evidence</span>
            <strong>{model.chain.evidence.total}</strong>
            <em>{model.chain.evidence.missing} missing</em>
            <em>{model.chain.evidence.attention} needing attention</em>
          </button>
          <span className="connect-arrow" aria-hidden="true">
            →
          </span>
          <button
            type="button"
            className="connect-node"
            onClick={() =>
              onNavigate(
                model.chain.actions.overdue > 0
                  ? { type: 'upload' }
                  : { type: 'module', module: 'activity' },
              )
            }
          >
            <span>Actions</span>
            <strong>{model.chain.actions.total}</strong>
            <em>{model.chain.actions.overdue} open</em>
            <em>{model.chain.actions.completed} completed</em>
          </button>
        </div>
      </section>

      <section className="connect-row-3" aria-label="Exposure and priorities">
        <article className="connect-card">
          <header className="connect-section-head tight">
            <div>
              <h2>Top organisational risks</h2>
              <p>Executive view only — open Risks for treatment detail.</p>
            </div>
          </header>
          <ol className="connect-risk-list">
            {model.topRisks.map((risk, index) => (
              <li key={risk.id}>
                <button type="button" onClick={() => onNavigate({ type: 'module', module: 'risks', recordId: risk.id })}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <span>
                    <strong>{risk.title}</strong>
                    <em>{risk.domain}</em>
                  </span>
                  <i className={`sev ${risk.level}`}>{risk.severity}</i>
                  <u>{risk.assurance}% assurance</u>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="connect-link" onClick={() => onNavigate({ type: 'module', module: 'risks' })}>
            View all risks →
          </button>
        </article>

        <article className="connect-card">
          <header className="connect-section-head tight">
            <div>
              <h2>Regulatory exposure</h2>
              <p>Coverage and the drivers behind the gap.</p>
            </div>
          </header>
          <div className="connect-frameworks">
            {model.frameworks.map((framework) => (
              <div key={framework.id}>
                <span>
                  {framework.name}
                  <b>{framework.coverage}%</b>
                </span>
                <div className="connect-bar">
                  <i style={{ width: `${framework.coverage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="connect-insight">{model.regulatoryInsight}</p>
          <button
            type="button"
            className="connect-link"
            onClick={() => onNavigate({ type: 'module', module: 'regulatory' })}
          >
            View regulatory gaps →
          </button>
        </article>

        <article className="connect-card">
          <header className="connect-section-head tight">
            <div>
              <h2>Nox priorities</h2>
              <p>Connected recommendations across risk, control, evidence and regulation.</p>
            </div>
          </header>
          <ul className="connect-priorities">
            {model.priorities.map((priority) => (
              <li key={priority.id}>
                <button type="button" onClick={() => onNavigate(priority.navigate)}>
                  <b>{priority.index}</b>
                  <span>
                    <strong>{priority.title}</strong>
                    <em>{priority.detail}</em>
                    <small>
                      <i>{priority.impact}</i>
                      <i>{priority.status}</i>
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="connect-ai-strip" aria-label="Nox AI insights">
        <div>
          <h2>Get deeper insights with Nox AI</h2>
          <p>Ask about your risks, compliance gaps, or what to prioritise next.</p>
        </div>
        <div className="connect-ai-chips">
          {model.insightPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => onAsk(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
