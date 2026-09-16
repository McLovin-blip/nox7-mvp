import { useEffect, useMemo, useState } from 'react'
import { organisation, reportingPeriod } from '../mock/data.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import {
  activeFilterChips,
  appetiteLabel,
  buildComplianceImpactRows,
  buildFrameworkImpact,
  buildRiskRecords,
  buildRiskSummary,
  clearFilterChip,
  complianceFilterOptions,
  coverageLabel,
  coverageRowsFor,
  defaultComplianceFilters,
  defaultFilters,
  describeRiskDrill,
  emptyStateForFilters,
  filterComplianceImpactRows,
  filterRisks,
  hasActiveFilters,
  linkedControlsFor,
  linkedEvidenceFor,
  linkedObligationsFor,
  riskContextIntro,
  severityLabel,
  sortRisks,
  treatmentLabel,
  type ComplianceImpactFilters,
  type ComplianceImpactRow,
  type FilterChip,
  type FrameworkImpact,
  type RiskFilters,
  type RiskNavigateTarget,
  type RiskRecord,
  type RiskSortKey,
} from './riskModel.ts'
import './risks.css'

type DetailTab = 'overview' | 'assessment' | 'connections' | 'treatment' | 'activity'
type DrillPanel = 'none' | 'coverage' | 'framework' | 'treatment'

function scrollToRegister() {
  window.requestAnimationFrame(() => {
    document.getElementById('risk-register')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

export function RisksModule({
  selectedId,
  onSelect,
  onNavigate,
  onAskNox,
  onDrillContextChange,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNavigate?: (target: RiskNavigateTarget) => void
  onAskNox?: (prompt?: string) => void
  onDrillContextChange?: (context: { label: string; questions: string[] } | null) => void
}) {
  const { position } = useSession()
  const [filters, setFilters] = useState<RiskFilters>(defaultFilters())
  const [sortKey, setSortKey] = useState<RiskSortKey>('residual')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [tab, setTab] = useState<DetailTab>('overview')
  const [drillPanel, setDrillPanel] = useState<DrillPanel>('none')

  const risks = useMemo(() => buildRiskRecords(position), [position])
  const summary = useMemo(() => buildRiskSummary(risks), [risks])
  const visible = useMemo(
    () => sortRisks(filterRisks(risks, filters), sortKey, sortDirection),
    [risks, filters, sortKey, sortDirection],
  )
  const selected = selectedId ? risks.find((item) => item.id === selectedId) ?? null : null
  const drill = useMemo(() => describeRiskDrill(filters), [filters])
  const chips = useMemo(() => activeFilterChips(filters), [filters])
  const coverageRows = useMemo(() => coverageRowsFor(risks), [risks])
  const frameworkImpact = useMemo(() => {
    if (filters.framework === 'all') return null
    return buildFrameworkImpact(risks, filters.framework, position)
  }, [filters.framework, risks, position])
  const emptyState = useMemo(() => emptyStateForFilters(filters, risks), [filters, risks])

  useEffect(() => {
    onDrillContextChange?.(drill ? { label: drill.label, questions: drill.questions } : null)
  }, [drill, onDrillContextChange])

  const patchFilters = (patch: Partial<RiskFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    onSelect(null)
  }

  const applyDrill = (next: RiskFilters, panel: DrillPanel = 'none') => {
    setFilters(next)
    setDrillPanel(panel)
    onSelect(null)
    scrollToRegister()
  }

  const clearAll = () => applyDrill(defaultFilters(), 'none')

  const removeChip = (chip: FilterChip) => {
    const next = clearFilterChip(filters, chip.key)
    setFilters(next)
    if (chip.key === 'framework') setDrillPanel((current) => (current === 'framework' ? 'none' : current))
    if (chip.key === 'coverage' || chip.key === 'priorityOnly') {
      if (!next.priorityOnly && next.coverage === 'all') {
        setDrillPanel((current) => (current === 'coverage' ? 'none' : current))
      }
    }
    if (chip.key === 'treatment' && next.treatment === 'all') {
      setDrillPanel((current) => (current === 'treatment' ? 'none' : current))
    }
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

      <ExecutiveSummary
        summary={summary}
        risks={risks}
        position={position}
        onDrill={applyDrill}
        onOpenRisk={(id) => {
          setTab('overview')
          onSelect(id)
        }}
        onNavigate={onNavigate}
      />

      <Register
        risks={visible}
        allRisks={risks}
        filters={filters}
        chips={chips}
        drill={drill}
        drillPanel={drillPanel}
        coverageRows={coverageRows}
        frameworkImpact={frameworkImpact}
        emptyState={emptyState}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onFilter={patchFilters}
        onClearChip={removeChip}
        onClearAll={clearAll}
        onAskNox={onAskNox}
        onSort={toggleSort}
        onOpenRisk={(id) => {
          setTab('overview')
          onSelect(id)
        }}
        onShowPanel={setDrillPanel}
      />
    </div>
  )
}

function ExecutiveSummary({
  summary,
  risks,
  position,
  onDrill,
  onOpenRisk,
  onNavigate,
}: {
  summary: ReturnType<typeof buildRiskSummary>
  risks: RiskRecord[]
  position: PositionState
  onDrill: (filters: RiskFilters, panel?: DrillPanel) => void
  onOpenRisk: (id: string) => void
  onNavigate?: (target: RiskNavigateTarget) => void
}) {
  const unitMax = Math.max(...summary.byUnit.map((item) => item.count), 1)
  const categoryMax = Math.max(...summary.byCategory.map((item) => item.count), 1)

  const drill = (patch: Partial<RiskFilters>, panel: DrillPanel = 'none') => {
    onDrill({ ...defaultFilters(), ...patch }, panel)
  }

  return (
    <div className="risk-exec">
      <div className="risk-kpi-row">
        <button type="button" className="risk-kpi" onClick={() => drill({})}>
          <span>Total Risks</span>
          <strong>{summary.total}</strong>
          <em>Organisation risk register</em>
        </button>
        <button type="button" className="risk-kpi is-critical" onClick={() => drill({ severity: 'critical' })}>
          <span>Critical Risks</span>
          <strong>{summary.criticalCount}</strong>
          <em>Requires executive attention</em>
        </button>
        <button type="button" className="risk-kpi is-high" onClick={() => drill({ severity: 'high' })}>
          <span>High Risks</span>
          <strong>{summary.highCount}</strong>
          <em>Prioritise for treatment</em>
        </button>
        <button type="button" className="risk-kpi is-appetite" onClick={() => drill({ appetite: 'above' })}>
          <span>Above Appetite</span>
          <strong>{summary.aboveCount}</strong>
          <em>
            {summary.aboveCritical} Critical · {summary.aboveHigh} High
          </em>
        </button>
        <div className="risk-kpi risk-kpi-split">
          <button type="button" onClick={() => drill({ treatment: 'active' }, 'treatment')}>
            <span>Treatment Progress</span>
            <strong>{summary.treatmentProgress}%</strong>
            <em>
              {summary.treatmentActive} of {summary.total} active
            </em>
          </button>
          <button type="button" className="risk-kpi-overdue" onClick={() => drill({ treatment: 'overdue' }, 'treatment')}>
            {summary.treatmentOverdue} overdue
          </button>
        </div>
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
                <button type="button" onClick={() => drill({ businessUnit: item.name })}>
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
                <button type="button" onClick={() => drill({ category: item.name })}>
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
            <button type="button" className="risk-coverage-hero" onClick={() => drill({ priorityOnly: true }, 'coverage')}>
              <strong>{summary.coveragePct}%</strong>
              <span>View priority coverage breakdown</span>
            </button>
            <div className="risk-coverage-metrics" role="group" aria-label="Control coverage breakdown">
              <button type="button" onClick={() => drill({ priorityOnly: true, coverage: 'adequate' }, 'coverage')}>
                {summary.adequate} adequate
              </button>
              <button type="button" onClick={() => drill({ priorityOnly: true, coverage: 'partial' }, 'coverage')}>
                {summary.partial} partial
              </button>
              <button type="button" onClick={() => drill({ priorityOnly: true, coverage: 'insufficient' }, 'coverage')}>
                {summary.insufficient} insufficient
              </button>
            </div>
            <p>across {summary.coveragePoolSize} priority risks</p>
            <div className="risk-coverage-stack" aria-hidden="true">
              <i className="ok" style={{ flex: Math.max(summary.adequate, 0.0001) }} />
              <i className="partial" style={{ flex: Math.max(summary.partial, 0.0001) }} />
              <i className="bad" style={{ flex: Math.max(summary.insufficient, 0.0001) }} />
            </div>
          </div>
        </section>
      </div>

      <ComplianceImpactPanel risks={risks} position={position} onOpenRisk={onOpenRisk} onNavigate={onNavigate} />

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

function ComplianceImpactPanel({
  risks,
  position,
  onOpenRisk,
  onNavigate,
}: {
  risks: RiskRecord[]
  position: PositionState
  onOpenRisk: (id: string) => void
  onNavigate?: (target: RiskNavigateTarget) => void
}) {
  const [filters, setFilters] = useState<ComplianceImpactFilters>(defaultComplianceFilters)
  const rows = useMemo(() => buildComplianceImpactRows(risks, position), [risks, position])
  const options = useMemo(() => complianceFilterOptions(rows), [rows])
  const visible = useMemo(() => filterComplianceImpactRows(rows, filters), [rows, filters])
  const active =
    filters.query.trim() !== '' ||
    filters.residualRating !== 'all' ||
    filters.framework !== 'all' ||
    filters.evidenceStatus !== 'all' ||
    filters.ownerId !== 'all'

  const openModule = (module: ModuleId, recordId: string) => {
    onNavigate?.({ type: 'module', module, recordId })
  }

  return (
    <section className="risk-card risk-compliance-panel" aria-label="Compliance impact">
      <header className="risk-compliance-head">
        <div>
          <h2>Compliance impact</h2>
          <p>
            How organisational risks connect to controls, evidence, and framework or regulatory references in the
            shared demo dataset.
          </p>
        </div>
        <em>
          Showing {visible.length} of {rows.length} risk{rows.length === 1 ? '' : 's'}
        </em>
      </header>

      <div className="risk-compliance-filters">
        <label className="risk-compliance-search">
          <span>Search</span>
          <input
            type="search"
            value={filters.query}
            placeholder="Risk, control, or evidence name / ID"
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          />
        </label>
        <label>
          <span>Risk rating</span>
          <select
            value={filters.residualRating}
            onChange={(event) => setFilters((current) => ({ ...current, residualRating: event.target.value }))}
          >
            <option value="all">All ratings</option>
            {options.ratings.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Framework / requirement</span>
          <select
            value={filters.framework}
            onChange={(event) => setFilters((current) => ({ ...current, framework: event.target.value }))}
          >
            <option value="all">All references</option>
            {options.frameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Evidence status</span>
          <select
            value={filters.evidenceStatus}
            onChange={(event) => setFilters((current) => ({ ...current, evidenceStatus: event.target.value }))}
          >
            <option value="all">All statuses</option>
            {options.evidenceStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Owner</span>
          <select
            value={filters.ownerId}
            onChange={(event) => setFilters((current) => ({ ...current, ownerId: event.target.value }))}
          >
            <option value="all">All owners</option>
            {options.owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="risk-compliance-clear"
          disabled={!active}
          onClick={() => setFilters(defaultComplianceFilters())}
        >
          Clear filters
        </button>
      </div>

      <div className="risk-compliance-table-wrap">
        <table className="risk-compliance-table">
          <thead>
            <tr>
              <th scope="col">Risk</th>
              <th scope="col">Risk rating</th>
              <th scope="col">Related controls</th>
              <th scope="col">Related evidence</th>
              <th scope="col">Framework / requirement</th>
              <th scope="col">Compliance impact</th>
              <th scope="col">Owner</th>
              <th scope="col">Next action and due date</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <ComplianceImpactTableRow
                key={row.riskId}
                row={row}
                onOpenRisk={onOpenRisk}
                onOpenControl={(id) => openModule('controls', id)}
                onOpenEvidence={(id) => openModule('evidence', id)}
              />
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="risk-compliance-empty">No risks match the current compliance filters.</p>
        ) : null}
      </div>
    </section>
  )
}

function ComplianceImpactTableRow({
  row,
  onOpenRisk,
  onOpenControl,
  onOpenEvidence,
}: {
  row: ComplianceImpactRow
  onOpenRisk: (id: string) => void
  onOpenControl: (id: string) => void
  onOpenEvidence: (id: string) => void
}) {
  return (
    <tr>
      <td>
        <button type="button" className="risk-compliance-link" onClick={() => onOpenRisk(row.riskId)}>
          <strong>{row.riskCode}</strong>
          <span>{row.riskTitle}</span>
        </button>
      </td>
      <td>
        <span className="risk-compliance-rating">{row.residualRating}</span>
      </td>
      <td>
        <div className="risk-compliance-stack">
          {row.controls.length ? (
            row.controls.map((item) => (
              <button key={item.id} type="button" className="risk-compliance-chip" onClick={() => onOpenControl(item.id)}>
                <strong>{item.code ?? item.id}</strong>
                <span>{item.title}</span>
              </button>
            ))
          ) : (
            <em>None linked</em>
          )}
        </div>
      </td>
      <td>
        <div className="risk-compliance-stack">
          {row.evidence.length ? (
            row.evidence.map((item) => (
              <button key={item.id} type="button" className="risk-compliance-chip" onClick={() => onOpenEvidence(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.status}</span>
              </button>
            ))
          ) : (
            <em>None linked</em>
          )}
        </div>
      </td>
      <td>
        <span className={`risk-compliance-framework kind-${row.frameworkKind}`}>{row.frameworkLabel}</span>
      </td>
      <td>
        <p className="risk-compliance-impact">{row.impact}</p>
      </td>
      <td>{row.owner}</td>
      <td>
        <div className="risk-compliance-action">
          <span>{row.nextAction}</span>
          <em>Due {row.dueDate}</em>
        </div>
      </td>
    </tr>
  )
}

function Register({
  risks,
  allRisks,
  filters,
  chips,
  drill,
  drillPanel,
  coverageRows,
  frameworkImpact,
  emptyState,
  sortKey,
  sortDirection,
  onFilter,
  onClearChip,
  onClearAll,
  onAskNox,
  onSort,
  onOpenRisk,
  onShowPanel,
}: {
  risks: RiskRecord[]
  allRisks: RiskRecord[]
  filters: RiskFilters
  chips: FilterChip[]
  drill: ReturnType<typeof describeRiskDrill>
  drillPanel: DrillPanel
  coverageRows: ReturnType<typeof coverageRowsFor>
  frameworkImpact: FrameworkImpact | null
  emptyState: ReturnType<typeof emptyStateForFilters>
  sortKey: RiskSortKey
  sortDirection: 'asc' | 'desc'
  onFilter: (patch: Partial<RiskFilters>) => void
  onClearChip: (chip: FilterChip) => void
  onClearAll: () => void
  onAskNox?: (prompt?: string) => void
  onSort: (key: RiskSortKey) => void
  onOpenRisk: (id: string) => void
  onShowPanel: (panel: DrillPanel) => void
}) {
  const units = unique(allRisks.map((item) => item.businessUnit))
  const categories = unique(allRisks.map((item) => item.category))
  const owners = unique(allRisks.map((item) => item.owner))
  const active = hasActiveFilters(filters)

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

      {active ? (
        <div className="risk-filter-context" aria-live="polite">
          <div className="risk-filter-context-copy">
            <strong>Showing risks for:</strong>
            <div className="risk-filter-chips">
              {chips.map((chip) => (
                <button key={`${chip.key}-${chip.valueLabel}`} type="button" onClick={() => onClearChip(chip)}>
                  {chip.label}: {chip.valueLabel} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          </div>
          <div className="risk-filter-context-actions">
            {drill ? (
              <button type="button" className="risk-ghost-btn" onClick={() => onAskNox?.(drill.questions[0] ?? drill.askPrompt)}>
                {drill.askPrompt}
              </button>
            ) : null}
            <button type="button" className="risk-ghost-btn" onClick={onClearAll}>
              Clear all
            </button>
          </div>
        </div>
      ) : null}

      {drillPanel === 'coverage' ? (
        <div className="risk-drill-panel">
          <header>
            <div>
              <h3>Control coverage — priority risks</h3>
              <p>Why coverage is {filters.coverage === 'all' ? 'weak on critical and high risks' : coverageLabel(filters.coverage).toLowerCase()}.</p>
            </div>
            <button type="button" className="risk-ghost-btn" onClick={() => onShowPanel('none')}>
              Hide
            </button>
          </header>
          <div className="risk-drill-table-wrap">
            <table className="risk-drill-table">
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Residual</th>
                  <th>Linked controls</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {(filters.coverage === 'all' ? coverageRows : coverageRows.filter((row) => row.coverage === filters.coverage)).map(
                  (row) => (
                    <tr key={row.risk.id}>
                      <td>
                        <button type="button" onClick={() => onOpenRisk(row.risk.id)}>
                          {row.risk.title}
                        </button>
                      </td>
                      <td>
                        {row.risk.residual.score} · {severityLabel(row.risk.severity)}
                      </td>
                      <td>{row.linkedControls}</td>
                      <td>
                        <Pill className={`coverage-${row.coverage}`}>{coverageLabel(row.coverage)}</Pill>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {drillPanel === 'framework' && frameworkImpact ? (
        <div className="risk-drill-panel">
          <header>
            <div>
              <h3>{frameworkImpact.name}</h3>
              <p>
                {frameworkImpact.linkedRisks.length} linked risks · {frameworkImpact.relatedControlIds.length} related
                controls · {frameworkImpact.obligationsWithGaps} obligations with gaps ·{' '}
                {frameworkImpact.missingEvidenceCount} missing/expired evidence items
              </p>
            </div>
            <button type="button" className="risk-ghost-btn" onClick={() => onAskNox?.(`Ask Nox about ${frameworkImpact.name} exposure`)}>
              Ask Nox about {frameworkImpact.name} exposure
            </button>
          </header>
          <ul className="risk-chain-list">
            {frameworkImpact.chains.map((chain) => (
              <li key={`${chain.riskId}-${chain.obligationId}-${chain.evidenceId}`}>
                <button type="button" onClick={() => onOpenRisk(chain.riskId)}>
                  <span>{chain.riskTitle}</span>
                  <em>→</em>
                  <span>{chain.controlTitle}</span>
                  <em>→</em>
                  <span>{chain.obligationTitle}</span>
                  <em>→</em>
                  <span>
                    {chain.evidenceTitle} — {chain.evidenceStatus}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {drillPanel === 'treatment' ? (
        <div className="risk-drill-panel">
          <header>
            <div>
              <h3>Treatment progress</h3>
              <p>Filter the register by treatment status.</p>
            </div>
            <button type="button" className="risk-ghost-btn" onClick={() => onShowPanel('none')}>
              Hide
            </button>
          </header>
          <div className="risk-treatment-breakdown">
            {(
              [
                ['active', 'Active'],
                ['in-progress', 'In Progress'],
                ['overdue', 'Overdue'],
                ['completed', 'Completed'],
                ['not-started', 'Not Started'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filters.treatment === value ? 'is-active' : undefined}
                onClick={() => onFilter({ ...defaultFilters(), treatment: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
        <select value={filters.businessUnit} onChange={(event) => onFilter({ businessUnit: event.target.value })}>
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
          <option value="active">Active</option>
          <option value="in-progress">In progress</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="not-started">Not started</option>
          <option value="at-risk">At risk</option>
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
        <button type="button" className="risk-ghost-btn" onClick={onClearAll}>
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
        {risks.length === 0 ? (
          <div className="risk-empty-state">
            <strong>{emptyState.title}</strong>
            <p>{emptyState.detail}</p>
            <button type="button" className="risk-ghost-btn" onClick={() => onFilter(emptyState.actionFilters)}>
              {emptyState.actionLabel}
            </button>
          </div>
        ) : null}
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
          <Pill className="neutral">{`Inherent ${risk.inherentLabel}`}</Pill>
          <Pill className="neutral">{`Residual ${risk.residualLabel}`}</Pill>
          <Pill className={`appetite-${risk.appetiteStatus}`}>{risk.appetiteLabel}</Pill>
          <Pill className={`treatment-${risk.treatment.status}`}>{risk.actionStatus}</Pill>
          {risk.demoFocus ? <Pill className="neutral">Demo focus</Pill> : null}
        </div>
        <div className="risk-detail-meta">
          <span>Owner · {risk.owner}</span>
          <span>Business unit · {risk.businessUnit}</span>
          <span>Next review · {formatDate(risk.nextReview)}</span>
          <span>
            Next action · {risk.nextAction} · Due {formatDate(risk.dueDate)}
          </span>
        </div>
        <p className="risk-ai-hint">{riskContextIntro(risk)}</p>
      </header>

      <div className="risk-metric-row">
        <Metric label="Inherent risk" score={risk.inherentLabel} rating={`${risk.inherent.score}`} />
        <Metric label="Residual risk" score={risk.residualLabel} rating={`${risk.residual.score}`} />
        <Metric label="Target risk" score={risk.target.score} rating={risk.target.rating} />
        <Metric label="Appetite" score={risk.appetiteLabel} />
        <Metric label="Control coverage" score={coverageLabel(risk.controlCoverage)} />
        <Metric label="Next action" score={risk.actionStatus} rating={formatDate(risk.dueDate)} />
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
                <h3>What could happen</h3>
                <p>{risk.whatCouldHappen}</p>
              </div>
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
                <dt>Appetite</dt>
                <dd>{risk.appetiteLabel}</dd>
              </div>
              <div>
                <dt>Next action</dt>
                <dd>
                  {risk.nextAction}
                  <small>
                    Due {formatDate(risk.dueDate)} · {risk.actionStatus}
                  </small>
                </dd>
              </div>
              <div>
                <dt>Last assessment</dt>
                <dd>{formatDate(risk.lastAssessment)}</dd>
              </div>
              <div>
                <dt>Next review</dt>
                <dd>{formatDate(risk.nextReview)}</dd>
              </div>
            </dl>
          </section>
          {risk.demoFocus ? (
            <section className="risk-card">
              <header>
                <h2>Connected protections</h2>
                <p>Open controls or evidence without leaving this risk walkthrough.</p>
              </header>
              <p>{controls[0]?.purposeBlurb || risk.contributingGap}</p>
              <ul className="risk-link-list">
                {controls.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => go('controls', item.id)}>
                      <div>
                        <strong>
                          {item.code} · {item.title}
                        </strong>
                        <em>{item.purposeBlurb}</em>
                      </div>
                      <div>
                        <span>{item.effectiveness}</span>
                        <small>{item.evidenceStatus}</small>
                      </div>
                    </button>
                  </li>
                ))}
                {evidence.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => go('evidence', item.id)}>
                      <div>
                        <strong>{item.title}</strong>
                        <em>{item.resultOrGap ?? item.freshness}</em>
                      </div>
                      <span>{item.statusLabel ?? item.freshness}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
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
            <Pill className={`appetite-${risk.appetiteStatus}`}>{risk.appetiteLabel}</Pill>
            <p>
              {risk.appetiteStatus === 'above'
                ? 'Residual exposure is outside the approved appetite and needs active treatment.'
                : risk.appetiteStatus === 'near'
                  ? 'Residual exposure is close to appetite and should remain under close review.'
                  : 'Residual exposure is currently within the approved appetite.'}
            </p>
            <p>
              Next action: {risk.nextAction} · Owner {risk.owner} · Due {formatDate(risk.dueDate)} ·{' '}
              {risk.actionStatus}
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
                      <strong>
                        {item.code} · {item.title}
                      </strong>
                      <em>
                        {item.purposeBlurb || `${item.id} · ${item.owner}`}
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
                        {item.resultOrGap ?? item.id}
                        {item.date ? ` · ${formatDate(item.date)}` : ''}
                      </em>
                    </div>
                    <span>{item.statusLabel ?? item.freshness}</span>
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
