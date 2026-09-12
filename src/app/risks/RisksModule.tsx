import { useMemo, useState } from 'react'
import { organisation, reportingPeriod } from '../mock/data.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import {
  appetiteLabel,
  buildRiskRecords,
  buildRiskSummary,
  coverageLabel,
  defaultFilters,
  filterRisks,
  linkedControlsFor,
  linkedEvidenceFor,
  linkedObligationsFor,
  riskContextIntro,
  severityLabel,
  sortRisks,
  treatmentLabel,
  trendLabel,
  type RiskFilters,
  type RiskNavigateTarget,
  type RiskRecord,
  type RiskSortKey,
} from './riskModel.ts'
import './risks.css'

type DetailTab = 'overview' | 'assessment' | 'connections' | 'treatment' | 'activity'

export function RisksModule({
  selectedId,
  onSelect,
  onNavigate,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNavigate?: (target: RiskNavigateTarget) => void
}) {
  const { position } = useSession()
  const [filters, setFilters] = useState<RiskFilters>(defaultFilters())
  const [sortKey, setSortKey] = useState<RiskSortKey>('residual')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [tab, setTab] = useState<DetailTab>('overview')

  const risks = useMemo(() => buildRiskRecords(position), [position])
  const summary = useMemo(() => buildRiskSummary(risks), [risks])
  const visible = useMemo(
    () => sortRisks(filterRisks(risks, filters), sortKey, sortDirection),
    [risks, filters, sortKey, sortDirection],
  )
  const selected = selectedId ? risks.find((item) => item.id === selectedId) ?? null : null

  const patchFilters = (patch: Partial<RiskFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    onSelect(null)
  }

  const toggleSort = (key: RiskSortKey) => {
    if (sortKey === key) setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDirection(key === 'title' || key === 'businessUnit' || key === 'review' ? 'asc' : 'desc')
    }
  }

  if (selected) {
    return (
      <RiskDetail
        risk={selected}
        position={position}
        tab={tab}
        onTab={setTab}
        onBack={() => onSelect(null)}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="risk-page">
      <header className="risk-page-head">
        <p className="risk-kicker">Risks</p>
        <h1>Understand, prioritise and manage your organisational risks</h1>
        <p className="risk-lede">
          Identify what could impact your objectives, see how well risks are controlled, and take action to reduce
          exposure.
        </p>
        <div className="risk-context-chips">
          <span>{organisation.name}</span>
          <span>All business units</span>
          <span>{reportingPeriod}</span>
        </div>
      </header>

      <ExecutiveSummary summary={summary} onFilter={patchFilters} onOpenRisk={onSelect} />
      <Register
        risks={visible}
        allRisks={risks}
        filters={filters}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onFilter={patchFilters}
        onSort={toggleSort}
        onOpenRisk={(id) => {
          setTab('overview')
          onSelect(id)
        }}
      />
    </div>
  )
}

function ExecutiveSummary({
  summary,
  onFilter,
  onOpenRisk,
}: {
  summary: ReturnType<typeof buildRiskSummary>
  onFilter: (patch: Partial<RiskFilters>) => void
  onOpenRisk: (id: string) => void
}) {
  const unitMax = Math.max(...summary.byUnit.map((item) => item.count), 1)
  const categoryMax = Math.max(...summary.byCategory.map((item) => item.count), 1)

  return (
    <div className="risk-exec">
      <div className="risk-kpi-row">
        <button type="button" className="risk-kpi" onClick={() => onFilter(defaultFilters())}>
          <span>Total Risks</span>
          <strong>{summary.total}</strong>
          <em>Organisation risk register</em>
        </button>
        <button type="button" className="risk-kpi is-critical" onClick={() => onFilter({ severity: 'critical' })}>
          <span>Critical Risks</span>
          <strong>{summary.criticalCount}</strong>
          <em>Requires executive attention</em>
        </button>
        <button type="button" className="risk-kpi is-high" onClick={() => onFilter({ severity: 'high' })}>
          <span>High Risks</span>
          <strong>{summary.highCount}</strong>
          <em>Prioritise for treatment</em>
        </button>
        <button type="button" className="risk-kpi is-appetite" onClick={() => onFilter({ appetite: 'above' })}>
          <span>Above Appetite</span>
          <strong>{summary.aboveCount}</strong>
          <em>
            {summary.aboveCritical} Critical · {summary.aboveHigh} High
          </em>
        </button>
        <button type="button" className="risk-kpi" onClick={() => onFilter({ treatment: 'overdue' })}>
          <span>Treatment Progress</span>
          <strong>{summary.treatmentProgress}%</strong>
          <em>
            {summary.treatmentActive} of {summary.total} active · {summary.treatmentOverdue} overdue
          </em>
        </button>
      </div>

      <div className="risk-exec-grid">
        <section className="risk-card">
          <header>
            <h2>Risk exposure by business unit</h2>
            <p>Where organisational risk is concentrated.</p>
          </header>
          <ul className="risk-bars">
            {summary.byUnit.map((item) => (
              <li key={item.name}>
                <button type="button" onClick={() => onFilter({ businessUnit: item.name })}>
                  <span>{item.name}</span>
                  <b>{item.count}</b>
                </button>
                <i style={{ width: `${(item.count / unitMax) * 100}%` }} />
              </li>
            ))}
          </ul>
        </section>

        <section className="risk-card">
          <header>
            <h2>Top risk categories</h2>
            <p>How exposure is distributed by risk type.</p>
          </header>
          <ul className="risk-bars">
            {summary.byCategory.map((item) => (
              <li key={item.name}>
                <button type="button" onClick={() => onFilter({ category: item.name })}>
                  <span>{item.name}</span>
                  <b>{item.count}</b>
                </button>
                <i style={{ width: `${(item.count / categoryMax) * 100}%` }} />
              </li>
            ))}
          </ul>
        </section>

        <section className="risk-card">
          <header>
            <h2>Control coverage — critical & high</h2>
            <p>Are the most important risks actually controlled?</p>
          </header>
          <div className="risk-coverage">
            <strong>{summary.coveragePct}%</strong>
            <p>
              {summary.adequate} adequate · {summary.partial} partial · {summary.insufficient} insufficient across{' '}
              {summary.coveragePoolSize} priority risks
            </p>
            <div className="risk-coverage-stack">
              <i className="ok" style={{ flex: Math.max(summary.adequate, 0.0001) }} />
              <i className="partial" style={{ flex: Math.max(summary.partial, 0.0001) }} />
              <i className="bad" style={{ flex: Math.max(summary.insufficient, 0.0001) }} />
            </div>
          </div>
        </section>
      </div>

      <div className="risk-exec-grid two">
        <section className="risk-card">
          <header>
            <h2>Compliance impact</h2>
            <p>{summary.complianceCount} risks affect active regulatory obligations.</p>
          </header>
          <ul className="risk-frameworks">
            {summary.frameworks.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>
                  {item.count} linked risk{item.count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="risk-card">
          <header>
            <h2>Emerging / changing risks</h2>
            <p>Material movement supported by current position data.</p>
          </header>
          <ul className="risk-emerging">
            {summary.emerging.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onOpenRisk(item.id)}>
                  <div>
                    <strong>{item.title}</strong>
                    <em>
                      {item.businessUnit} · Residual {item.residual.score} · {appetiteLabel(item.appetiteStatus)}
                    </em>
                  </div>
                  <div className="risk-pill-row">
                    <Pill className={`sev-${item.severity}`}>{severityLabel(item.severity)}</Pill>
                    <Pill className={`trend-${item.trend}`}>{trendLabel(item.trend)}</Pill>
                    <Pill className={`treatment-${item.treatment.status}`}>{treatmentLabel(item.treatment.status)}</Pill>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="risk-card">
        <header>
          <h2>Top risks requiring attention</h2>
          <p>Ranked by residual exposure, appetite, control weakness, treatment pressure and compliance impact.</p>
        </header>
        <div className="risk-top-list">
          {summary.topRisks.map((item, index) => (
            <button key={item.id} type="button" className="risk-top-row" onClick={() => onOpenRisk(item.id)}>
              <b>{index + 1}</b>
              <div>
                <strong>{item.title}</strong>
                <em>
                  {item.businessUnit} · Residual {item.residual.score} ({item.residual.rating}) ·{' '}
                  {treatmentLabel(item.treatment.status)}
                </em>
              </div>
              <div className="risk-pill-row">
                <Pill className={`sev-${item.severity}`}>{severityLabel(item.severity)}</Pill>
                <Pill className={`appetite-${item.appetiteStatus}`}>{appetiteLabel(item.appetiteStatus)}</Pill>
                <Pill className={`coverage-${item.controlCoverage}`}>{coverageLabel(item.controlCoverage)}</Pill>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function Register({
  risks,
  allRisks,
  filters,
  sortKey,
  sortDirection,
  onFilter,
  onSort,
  onOpenRisk,
}: {
  risks: RiskRecord[]
  allRisks: RiskRecord[]
  filters: RiskFilters
  sortKey: RiskSortKey
  sortDirection: 'asc' | 'desc'
  onFilter: (patch: Partial<RiskFilters>) => void
  onSort: (key: RiskSortKey) => void
  onOpenRisk: (id: string) => void
}) {
  const units = unique(allRisks.map((item) => item.businessUnit))
  const categories = unique(allRisks.map((item) => item.category))
  const owners = unique(allRisks.map((item) => item.owner))

  return (
    <section className="risk-register" id="risk-register">
      <header className="risk-register-head">
        <div>
          <h2>Risk Register</h2>
          <p>Review and manage all organisational risks.</p>
        </div>
        <em>
          Showing {risks.length} of {allRisks.length}
        </em>
      </header>

      <div className="risk-toolbar">
        <input
          value={filters.query}
          onChange={(event) => onFilter({ query: event.target.value })}
          placeholder="Search risks, IDs, owners, units…"
          aria-label="Search risks"
        />
        <select value={filters.severity} onChange={(event) => onFilter({ severity: event.target.value as RiskFilters['severity'] })}>
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filters.businessUnit}
          onChange={(event) => onFilter({ businessUnit: event.target.value })}
        >
          <option value="all">All business units</option>
          {units.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={filters.category} onChange={(event) => onFilter({ category: event.target.value })}>
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={filters.appetite} onChange={(event) => onFilter({ appetite: event.target.value as RiskFilters['appetite'] })}>
          <option value="all">All appetite states</option>
          <option value="above">Above appetite</option>
          <option value="near">Near appetite</option>
          <option value="within">Within appetite</option>
        </select>
        <select
          value={filters.treatment}
          onChange={(event) => onFilter({ treatment: event.target.value as RiskFilters['treatment'] })}
        >
          <option value="all">All treatments</option>
          <option value="overdue">Overdue</option>
          <option value="at-risk">At risk</option>
          <option value="in-progress">In progress</option>
          <option value="not-started">Not started</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filters.coverage} onChange={(event) => onFilter({ coverage: event.target.value as RiskFilters['coverage'] })}>
          <option value="all">All coverage</option>
          <option value="adequate">Adequate</option>
          <option value="partial">Partial</option>
          <option value="insufficient">Insufficient</option>
        </select>
        <select value={filters.owner} onChange={(event) => onFilter({ owner: event.target.value })}>
          <option value="all">All owners</option>
          {owners.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="button" className="risk-ghost-btn" onClick={() => onFilter(defaultFilters())}>
          Reset
        </button>
      </div>

      <div className="risk-table-wrap">
        <table className="risk-table">
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => onSort('title')}>
                  Risk{sortKey === 'title' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
              <th>Category</th>
              <th>
                <button type="button" onClick={() => onSort('businessUnit')}>
                  Business unit{sortKey === 'businessUnit' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort('severity')}>
                  Severity{sortKey === 'severity' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort('residual')}>
                  Residual{sortKey === 'residual' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
              <th>Appetite</th>
              <th>Coverage</th>
              <th>
                <button type="button" onClick={() => onSort('treatment')}>
                  Treatment{sortKey === 'treatment' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
              <th>Compliance</th>
              <th>Owner</th>
              <th>
                <button type="button" onClick={() => onSort('review')}>
                  Next review{sortKey === 'review' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {risks.map((item) => (
              <tr key={item.id} onClick={() => onOpenRisk(item.id)}>
                <td>
                  <strong>{item.title}</strong>
                  <small>{item.code}</small>
                </td>
                <td>{item.category}</td>
                <td>{item.businessUnit}</td>
                <td>
                  <Pill className={`sev-${item.severity}`}>{severityLabel(item.severity)}</Pill>
                </td>
                <td>
                  <strong>{item.residual.score}</strong>
                  <small>{item.residual.rating}</small>
                </td>
                <td>
                  <Pill className={`appetite-${item.appetiteStatus}`}>{appetiteLabel(item.appetiteStatus)}</Pill>
                </td>
                <td>
                  <Pill className={`coverage-${item.controlCoverage}`}>{coverageLabel(item.controlCoverage)}</Pill>
                </td>
                <td>
                  <Pill className={`treatment-${item.treatment.status}`}>{treatmentLabel(item.treatment.status)}</Pill>
                  <small>{item.treatment.progress}%</small>
                </td>
                <td>{item.obligationIds.length ? `${item.obligationIds.length} obligations` : '—'}</td>
                <td>{item.owner}</td>
                <td>{formatDate(item.nextReview)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {risks.length === 0 ? <p className="risk-empty">No risks match the current filters.</p> : null}
      </div>
    </section>
  )
}

function RiskDetail({
  risk,
  position,
  tab,
  onTab,
  onBack,
  onNavigate,
}: {
  risk: RiskRecord
  position: PositionState
  tab: DetailTab
  onTab: (tab: DetailTab) => void
  onBack: () => void
  onNavigate?: (target: RiskNavigateTarget) => void
}) {
  const controls = linkedControlsFor(risk, position)
  const obligations = linkedObligationsFor(risk, position)
  const evidence = linkedEvidenceFor(risk, position)
  const go = (module: ModuleId, recordId?: string) => onNavigate?.({ type: 'module', module, recordId })

  return (
    <div className="risk-detail">
      <button type="button" className="risk-back" onClick={onBack}>
        ← Back to Risks
      </button>

      <header className="risk-detail-head">
        <small>{risk.code}</small>
        <h1>{risk.title}</h1>
        <div className="risk-pill-row">
          <Pill className={`sev-${risk.severity}`}>{severityLabel(risk.severity)}</Pill>
          <Pill className="neutral">{`Residual ${risk.residual.rating}`}</Pill>
          <Pill className={`appetite-${risk.appetiteStatus}`}>{appetiteLabel(risk.appetiteStatus)}</Pill>
          <Pill className={`treatment-${risk.treatment.status}`}>{treatmentLabel(risk.treatment.status)}</Pill>
        </div>
        <div className="risk-detail-meta">
          <span>Owner · {risk.owner}</span>
          <span>Business unit · {risk.businessUnit}</span>
          <span>Next review · {formatDate(risk.nextReview)}</span>
        </div>
        <p className="risk-ai-hint">{riskContextIntro(risk)}</p>
      </header>

      <div className="risk-metric-row">
        <Metric label="Inherent risk" score={risk.inherent.score} rating={risk.inherent.rating} />
        <Metric label="Residual risk" score={risk.residual.score} rating={risk.residual.rating} />
        <Metric label="Target risk" score={risk.target.score} rating={risk.target.rating} />
        <Metric label="Appetite" score={appetiteLabel(risk.appetiteStatus)} />
        <Metric label="Control coverage" score={coverageLabel(risk.controlCoverage)} />
        <Metric label="Compliance impact" score={`${risk.obligationIds.length} obligations`} />
        <Metric label="Treatment" score={`${risk.treatment.progress}%`} rating={treatmentLabel(risk.treatment.status)} />
      </div>

      <nav className="risk-tabs" aria-label="Risk detail sections">
        {(
          [
            ['overview', 'Overview'],
            ['assessment', 'Assessment'],
            ['connections', 'Connections'],
            ['treatment', 'Treatment'],
            ['activity', 'Activity'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'is-active' : undefined} onClick={() => onTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <div className="risk-detail-grid">
          <section className="risk-card">
            <header>
              <h2>Risk statement</h2>
            </header>
            <div className="risk-statement">
              <div>
                <h3>Cause</h3>
                <p>{risk.cause}</p>
              </div>
              <div>
                <h3>Risk event</h3>
                <p>{risk.event}</p>
              </div>
              <div>
                <h3>Business impact</h3>
                <p>{risk.businessImpact}</p>
              </div>
            </div>
          </section>
          <section className="risk-card">
            <header>
              <h2>Key information</h2>
            </header>
            <dl className="risk-kv">
              <div>
                <dt>Risk ID</dt>
                <dd>{risk.code}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{risk.category}</dd>
              </div>
              <div>
                <dt>Business unit</dt>
                <dd>{risk.businessUnit}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>
                  {risk.owner}
                  <small>{risk.ownerRole}</small>
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{risk.level}</dd>
              </div>
              <div>
                <dt>Last assessment</dt>
                <dd>{formatDate(risk.lastAssessment)}</dd>
              </div>
              <div>
                <dt>Next review</dt>
                <dd>{formatDate(risk.nextReview)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDate(risk.updatedAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}

      {tab === 'assessment' ? (
        <section className="risk-card">
          <header>
            <h2>Risk assessment</h2>
            <p>How exposure moves from inherent risk through controls and treatment toward target.</p>
          </header>
          <div className="risk-assessment-flow">
            <AssessmentBlock title="Inherent risk" score={risk.inherent} />
            <p>↓ Controls + treatment</p>
            <AssessmentBlock title="Residual risk" score={risk.residual} />
            <p>↓ Target</p>
            <AssessmentBlock title="Target risk" score={risk.target} />
          </div>
          <div className="risk-appetite-panel">
            <h3>Risk appetite</h3>
            <Pill className={`appetite-${risk.appetiteStatus}`}>{appetiteLabel(risk.appetiteStatus)}</Pill>
            <p>
              {risk.appetiteStatus === 'above'
                ? 'Residual exposure is outside the approved appetite and needs active treatment.'
                : risk.appetiteStatus === 'near'
                  ? 'Residual exposure is close to appetite and should remain under close review.'
                  : 'Residual exposure is currently within the approved appetite.'}
            </p>
          </div>
        </section>
      ) : null}

      {tab === 'connections' ? (
        <div className="risk-detail-stack">
          <section className="risk-card">
            <header>
              <h2>Connected GRC context</h2>
              <p>Risk → Controls → Frameworks / Obligations → Evidence → Treatment</p>
            </header>
            <div className="risk-chain">
              <span>Risk</span>
              <em>→</em>
              <span>{controls.length} controls</span>
              <em>→</em>
              <span>{obligations.length} obligations</span>
              <em>→</em>
              <span>{evidence.length} evidence</span>
              <em>→</em>
              <span>{risk.treatment.actions.length} actions</span>
            </div>
          </section>

          <section className="risk-card">
            <header>
              <h2>Linked controls</h2>
              <p>
                {controls.length} linked · {controls.filter((item) => item.tone === 'assured').length} effective ·{' '}
                {controls.filter((item) => item.tone === 'partial').length} partial
              </p>
            </header>
            <ul className="risk-link-list">
              {controls.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => go('controls', item.id)}>
                    <div>
                      <strong>{item.title}</strong>
                      <em>
                        {item.id} · {item.owner}
                      </em>
                    </div>
                    <div>
                      <span>{item.effectiveness}</span>
                      <small>{item.evidenceStatus}</small>
                      <small>{item.testingStatus}</small>
                    </div>
                  </button>
                </li>
              ))}
              {controls.length === 0 ? <li className="risk-empty">No linked controls in the current dataset.</li> : null}
            </ul>
          </section>

          <section className="risk-card">
            <header>
              <h2>Framework & compliance impact</h2>
            </header>
            <ul className="risk-link-list">
              {obligations.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => go('regulatory', item.id)}>
                    <div>
                      <strong>{item.title}</strong>
                      <em>
                        {item.framework} · {item.id}
                      </em>
                    </div>
                    <span>{item.support}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="risk-card">
            <header>
              <h2>Evidence impact</h2>
            </header>
            <ul className="risk-link-list">
              {evidence.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => go('evidence', item.id)}>
                    <div>
                      <strong>{item.title}</strong>
                      <em>
                        {item.id} · {item.date ? formatDate(item.date) : 'n/a'}
                      </em>
                    </div>
                    <span>{item.freshness}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === 'treatment' ? (
        <div className="risk-detail-grid">
          <section className="risk-card">
            <header>
              <h2>Treatment plan</h2>
            </header>
            <dl className="risk-kv">
              <div>
                <dt>Strategy</dt>
                <dd>{risk.treatment.strategy}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{risk.treatment.owner}</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>{risk.treatment.progress}%</dd>
              </div>
              <div>
                <dt>Target date</dt>
                <dd>{formatDate(risk.treatment.targetDate)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{treatmentLabel(risk.treatment.status)}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{risk.treatment.priority}</dd>
              </div>
              <div>
                <dt>Latest update</dt>
                <dd>{risk.treatment.latestUpdate}</dd>
              </div>
            </dl>
          </section>
          <section className="risk-card">
            <header>
              <h2>Treatment actions</h2>
            </header>
            <ul className="risk-action-list">
              {risk.treatment.actions.map((action) => (
                <li key={action.id}>
                  <div>
                    <strong>{action.title}</strong>
                    <em>
                      Owner: {action.owner} · Due {formatDate(action.dueDate)}
                    </em>
                  </div>
                  <Pill className={`treatment-${action.status}`}>{treatmentLabel(action.status)}</Pill>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === 'activity' ? (
        <section className="risk-card">
          <header>
            <h2>Activity / history</h2>
          </header>
          <ul className="risk-history">
            {risk.history.map((item) => (
              <li key={`${item.date}-${item.text}`}>
                <strong>{formatDate(item.date)}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function Metric({ label, score, rating }: { label: string; score: string | number; rating?: string }) {
  return (
    <div className="risk-metric">
      <span>{label}</span>
      <strong>{score}</strong>
      {rating ? <em>{rating}</em> : null}
    </div>
  )
}

function AssessmentBlock({ title, score }: { title: string; score: RiskRecord['residual'] }) {
  return (
    <div className="risk-assessment-block">
      <span>{title}</span>
      <strong>
        {score.score} — {score.rating}
      </strong>
      <em>
        Likelihood {score.likelihood} · Impact {score.impact}
      </em>
    </div>
  )
}

function Pill({ className, children }: { className?: string; children: string }) {
  return <span className={`risk-pill ${className ?? ''}`}>{children}</span>
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}
