import { useEffect, useMemo, useState } from 'react'
import { useSession } from '../state/SessionProvider.tsx'
import { ControlDetail, Pill } from './ControlDetail.tsx'
import {
  activeFilterChips,
  assuranceLabel,
  assuranceTone,
  attentionControls,
  buildBriefing,
  buildCategorySummaries,
  buildControlRecords,
  buildIndicators,
  categoryById,
  clearFilterChip,
  controlCategories,
  createDraftControl,
  defaultFilters,
  describeControlDrill,
  directionLabel,
  emptyStateForFilters,
  evidenceDependencies,
  filterControls,
  formatDate,
  frameworkOptions,
  hasActiveFilters,
  healthLabel,
  leverageRows,
  peopleOptions,
  periodLabel,
  previousRecords,
  priorityRisks,
  protectionLabel,
  riskOptions,
  type ControlFilters,
  type ControlFrequency,
  type ControlNavigateTarget,
  type ControlRecord,
  type ControlType,
  type EvidenceHealth,
  type ExecutionMethod,
  uniqueValues,
} from './controlModel.ts'
import { data, frameworkName, organisation, titleOf } from '../mock/data.ts'
import './controls.css'

type Overlay =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'owner'; personId: string }
  | { kind: 'evidence'; health?: EvidenceHealth | 'no-owner'; controlId?: string }
  | { kind: 'risks'; controlId?: string }
  | { kind: 'obligations'; controlId?: string }
  | { kind: 'frameworks'; frameworkId?: string; controlId?: string }
  | { kind: 'action'; controlId: string }
  | { kind: 'risk-chain'; riskId: string }

function scrollToInventory() {
  window.requestAnimationFrame(() => {
    document.getElementById('control-inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

export function ControlsModule({
  selectedId,
  onSelect,
  onNavigate,
  onAskNox,
  onDrillContextChange,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNavigate?: (target: ControlNavigateTarget) => void
  onAskNox?: (prompt?: string) => void
  onDrillContextChange?: (context: { label: string; questions: string[] } | null) => void
}) {
  const { position } = useSession()
  const [filters, setFilters] = useState<ControlFilters>(defaultFilters())
  const [drafts, setDrafts] = useState<ControlRecord[]>([])
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' })
  const [loading, setLoading] = useState(true)

  const controls = useMemo(() => buildControlRecords(position, drafts), [position, drafts])
  const previous = useMemo(() => previousRecords(position, drafts), [position, drafts])
  const categories = useMemo(() => buildCategorySummaries(controls, previous), [controls, previous])
  const visible = useMemo(() => filterControls(controls, filters), [controls, filters])
  const scoped = useMemo(
    () =>
      filterControls(controls, {
        ...defaultFilters(),
        categoryId: filters.categoryId,
        query: filters.query,
        frameworkId: filters.frameworkId,
        businessUnit: filters.businessUnit,
      }),
    [controls, filters.categoryId, filters.query, filters.frameworkId, filters.businessUnit],
  )
  const indicators = useMemo(
    () =>
      buildIndicators(
        scoped,
        filterControls(previous, {
          ...defaultFilters(),
          categoryId: filters.categoryId,
          frameworkId: filters.frameworkId,
          businessUnit: filters.businessUnit,
        }),
      ),
    [scoped, previous, filters.categoryId, filters.frameworkId, filters.businessUnit],
  )
  const briefing = useMemo(() => buildBriefing(controls, filters, position), [controls, filters, position])
  const attention = useMemo(() => attentionControls(visible), [visible])
  const risks = useMemo(() => priorityRisks(controls), [controls])
  const visibleRisks = useMemo(
    () => (filters.categoryId === 'all' ? risks : risks.filter((item) => item.controlIds.some((id) => visible.some((control) => control.id === id)))),
    [risks, filters.categoryId, visible],
  )
  const leverage = useMemo(() => leverageRows(visible), [visible])
  const evidenceRows = useMemo(() => evidenceDependencies(visible, position), [visible, position])
  const chips = useMemo(() => activeFilterChips(filters), [filters])
  const drill = useMemo(() => describeControlDrill(filters), [filters])
  const empty = useMemo(() => emptyStateForFilters(filters, controls.length), [filters, controls.length])
  const selected = selectedId ? controls.find((item) => item.id === selectedId) ?? null : null

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    onDrillContextChange?.(drill)
  }, [drill, onDrillContextChange])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (overlay.kind !== 'none') {
        event.preventDefault()
        setOverlay({ kind: 'none' })
        return
      }
      if (selectedId) {
        event.preventDefault()
        onSelect(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay, selectedId, onSelect])

  useEffect(() => {
    const onPop = () => {
      if (overlay.kind !== 'none') {
        setOverlay({ kind: 'none' })
        return
      }
      if (selectedId) onSelect(null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [overlay, selectedId, onSelect])

  const patchFilters = (patch: Partial<ControlFilters>, scroll = false) => {
    setFilters((current) => ({ ...current, ...patch }))
    onSelect(null)
    if (scroll) scrollToInventory()
  }

  const openOverlay = (next: Overlay) => {
    history.pushState({ nox7: 'control-overlay' }, '')
    setOverlay(next)
  }

  const closeOverlay = () => setOverlay({ kind: 'none' })

  const openControl = (id: string) => {
    history.pushState({ nox7: 'control-detail' }, '')
    onSelect(id)
  }

  const go = (target: ControlNavigateTarget) => {
    if (target.type === 'control') {
      if (target.controlId) openControl(target.controlId)
      else onSelect(null)
      return
    }
    onNavigate?.(target)
  }

  if (selected) {
    return (
      <>
        <ControlDetail
          control={selected}
          onBack={() => onSelect(null)}
          onAskNox={(prompt) => onAskNox?.(prompt)}
          onNavigate={go}
          onOwner={(personId) => openOverlay({ kind: 'owner', personId })}
          onEvidence={() => openOverlay({ kind: 'evidence', controlId: selected.id, health: selected.evidenceHealth })}
          onRisks={() => openOverlay({ kind: 'risks', controlId: selected.id })}
          onObligations={() => openOverlay({ kind: 'obligations', controlId: selected.id })}
          onFramework={(frameworkId) => openOverlay({ kind: 'frameworks', frameworkId, controlId: selected.id })}
          onAction={() => openOverlay({ kind: 'action', controlId: selected.id })}
          onOpenControl={openControl}
        />
        <ControlOverlay
          overlay={overlay}
          controls={controls}
          evidenceRows={evidenceRows}
          risks={risks}
          onClose={closeOverlay}
          onAskNox={(prompt) => onAskNox?.(prompt)}
          onNavigate={go}
          onFilter={(patch) => {
            closeOverlay()
            patchFilters(patch, true)
          }}
          onCreate={(record) => {
            setDrafts((current) => [record, ...current])
            closeOverlay()
            openControl(record.id)
          }}
        />
      </>
    )
  }

  return (
    <div className="ctl-page">
      <header className="ctl-page-head">
        <p className="ctl-kicker">Controls</p>
        <h1>Know which controls you can rely on.</h1>
        <p className="ctl-lede">
          Distinguish a control that exists from one that is designed, operating, evidenced, and actually assured.
        </p>
        <div className="ctl-meta">
          <span>{organisation.name}</span>
          <span>{filters.businessUnit === 'all' ? 'All business units' : filters.businessUnit}</span>
          <span>{periodLabel}</span>
        </div>
        <div className="ctl-toolbar">
          <input
            className="ctl-search"
            value={filters.query}
            onChange={(event) => patchFilters({ query: event.target.value }, true)}
            placeholder="Search controls, owners, frameworks…"
            aria-label="Search controls"
          />
          <select
            value={filters.frameworkId}
            aria-label="Framework filter"
            onChange={(event) => patchFilters({ frameworkId: event.target.value }, true)}
          >
            <option value="all">All frameworks</option>
            {frameworkOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={filters.categoryId}
            aria-label="Control-category filter"
            onChange={(event) => patchFilters({ categoryId: event.target.value }, true)}
          >
            <option value="all">All categories</option>
            {controlCategories().map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="button" className="ctl-btn" onClick={() => onAskNox?.(drill.questions[0])}>
            Ask Nox
          </button>
          <button type="button" className="ctl-btn primary" onClick={() => openOverlay({ kind: 'add' })}>
            Add control
          </button>
        </div>
      </header>

      <section aria-label="Executive assurance indicators">
        <div className="ctl-kpis">
          {indicators.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ctl-kpi${item.id === 'unverifiable' ? ' is-warn' : ''}${item.id === 'effective' && filters.assurance === 'effective' ? ' is-active' : ''}${
                (item.id === 'partial' && filters.assurance === 'partially-assured') ||
                (item.id === 'unverifiable' && filters.assurance === 'unverifiable') ||
                (item.id === 'coverage' && filters.evidenceHealth === 'current')
                  ? ' is-active'
                  : ''
              }`}
              aria-pressed={
                (item.id === 'effective' && filters.assurance === 'effective') ||
                (item.id === 'partial' && filters.assurance === 'partially-assured') ||
                (item.id === 'unverifiable' && filters.assurance === 'unverifiable') ||
                (item.id === 'coverage' && filters.evidenceHealth === 'current')
              }
              onClick={() => patchFilters({ ...defaultFilters(), categoryId: filters.categoryId, ...item.filter }, true)}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <em>{item.context}</em>
              <em>
                {directionLabel(item.direction)} · {item.change}
              </em>
            </button>
          ))}
        </div>
      </section>

      <section className="ctl-card" aria-label="Control assurance by category">
        <header className="ctl-section-head">
          <h2>Control assurance by category</h2>
          <p>Select a category to filter every section on this page, including Nox AI context.</p>
        </header>
        <div className="ctl-tabs" role="tablist" aria-label="Control categories">
          <button
            type="button"
            className={`ctl-tab${filters.categoryId === 'all' ? ' is-active' : ''}`}
            aria-selected={filters.categoryId === 'all'}
            onClick={() => patchFilters({ categoryId: 'all' })}
          >
            Overview
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ctl-tab${filters.categoryId === item.id ? ' is-active' : ''}`}
              aria-selected={filters.categoryId === item.id}
              onClick={() => patchFilters({ categoryId: item.id })}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
        <div className="ctl-cat-grid">
          {(filters.categoryId === 'all' ? categories : categories.filter((item) => item.id === filters.categoryId)).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ctl-cat${filters.categoryId === item.id ? ' is-active' : ''}`}
              onClick={() => patchFilters({ categoryId: item.id })}
            >
              <header>
                <h3>{item.name}</h3>
                <p>
                  {item.accountableFunction} · {item.accountableExecutive.split(',')[0]}
                </p>
              </header>
              <div className="ctl-dist" aria-hidden="true">
                <i className="ok" style={{ flex: Math.max(item.effective, 0.0001) }} />
                <i className="watch" style={{ flex: Math.max(item.partiallyAssured + item.unverifiable, 0.0001) }} />
                <i className="bad" style={{ flex: Math.max(item.ineffective, 0.0001) }} />
              </div>
              <div className="ctl-cat-meta">
                <span>{item.controlCount} controls</span>
                <span>{item.effective} effective</span>
                <span>{item.partiallyAssured} partial</span>
                <span>{item.unverifiable} unverifiable</span>
                <span>{item.ineffective} ineffective</span>
                <span>{item.evidenceCoverage}% evidence coverage</span>
                <span>{item.connectedRisks} risks</span>
                <span>{item.connectedObligations} obligations</span>
                <span>{directionLabel(item.direction)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="ctl-briefing" aria-label="Nox AI control briefing">
        <header className="ctl-section-head">
          <div>
            <p className="ctl-kicker">Nox AI control briefing</p>
            <h2>{briefing.title}</h2>
            <p>{briefing.attention}</p>
          </div>
          <div className="ctl-meta">
            <span>Confidence · {briefing.confidence}</span>
            <span>Freshness · {briefing.freshness}</span>
          </div>
        </header>
        <div className="ctl-briefing-grid">
          <div>
            <h3>Verified facts</h3>
            <ul className="ctl-facts">
              {briefing.facts.map((fact) => (
                <li key={fact.id}>
                  <button type="button" onClick={() => go({ type: 'module', module: fact.citationId.startsWith('ev-') ? 'evidence' : fact.citationId.startsWith('risk-') ? 'risks' : 'controls', recordId: fact.citationId })}>
                    {fact.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Nox AI interpretation</h3>
            <button type="button" className="ctl-interpret" onClick={() => onAskNox?.(briefing.askPrompt)}>
              {briefing.interpretation}
            </button>
            <h3>Recommended action</h3>
            <p className="ctl-lede">{briefing.recommendedAction}</p>
            <p className="ctl-muted">
              {briefing.owner} · due {briefing.due} · {briefing.approval}
            </p>
            <div className="ctl-toolbar">
              <button type="button" className="ctl-btn primary" onClick={() => openOverlay({ kind: 'action', controlId: attention[0]?.id ?? 'ctl-005' })}>
                Open recommended action
              </button>
              <button type="button" className="ctl-btn" onClick={() => onAskNox?.(briefing.askPrompt)}>
                Ask Nox
              </button>
            </div>
          </div>
        </div>
        <div className="ctl-toolbar" aria-label="Supporting sources">
          {briefing.sources.map((source) => (
            <button
              key={source.id}
              type="button"
              className="ctl-source"
              onClick={() =>
                go({
                  type: 'module',
                  module: source.kind === 'Evidence' ? 'evidence' : source.kind === 'Risk' ? 'risks' : source.kind === 'Obligation' ? 'regulatory' : 'controls',
                  recordId: source.id,
                })
              }
            >
              <span className="ctl-label">{source.kind}</span> {source.title}
            </button>
          ))}
        </div>
      </section>

      <section className="ctl-card">
        <header>
          <h2>Controls requiring attention</h2>
          <p>Maximum three priorities. Selecting a card opens the control workspace.</p>
        </header>
        {attention.length ? (
          <div className="ctl-attention-grid">
            {attention.map((item) => (
              <article key={item.id} className="ctl-attention">
                <button type="button" className="ctl-interpret" onClick={() => openControl(item.id)}>
                  <h3>{item.title}</h3>
                </button>
                <div className="ctl-pills">
                  <button type="button" onClick={() => patchFilters({ assurance: item.overall }, true)}>
                    <Pill tone={assuranceTone(item.overall)}>{assuranceLabel(item.overall)}</Pill>
                  </button>
                  <button type="button" className="ctl-chip" onClick={() => patchFilters({ categoryId: item.categoryId })}>
                    {item.categoryShort}
                  </button>
                </div>
                <dl className="ctl-dl">
                  <dt>Unit</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => patchFilters({ businessUnit: item.businessUnit }, true)}>
                      {item.businessUnit}
                    </button>
                  </dd>
                  <dt>Owner</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => openOverlay({ kind: 'owner', personId: item.ownerId })}>
                      {item.owner}
                    </button>
                  </dd>
                  <dt>Design</dt>
                  <dd>{item.design}</dd>
                  <dt>Operation</dt>
                  <dd>{item.operating}</dd>
                  <dt>Evidence</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => openOverlay({ kind: 'evidence', health: item.evidenceHealth, controlId: item.id })}>
                      {healthLabel(item.evidenceHealth)}
                    </button>
                  </dd>
                  <dt>Risks</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => openOverlay({ kind: 'risks', controlId: item.id })}>
                      {item.riskIds.length}
                    </button>
                  </dd>
                  <dt>Obligations</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => openOverlay({ kind: 'obligations', controlId: item.id })}>
                      {item.obligationIds.length}
                    </button>
                  </dd>
                  <dt>Frameworks</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => openOverlay({ kind: 'frameworks', controlId: item.id, frameworkId: item.frameworkIds[0] })}>
                      {item.mappingLabels.slice(0, 3).join(', ')}
                    </button>
                  </dd>
                  <dt>Last assessed</dt>
                  <dd>{formatDate(item.lastAssessed)}</dd>
                  <dt>Next action</dt>
                  <dd>
                    <button type="button" className="ctl-linkish" onClick={() => openOverlay({ kind: 'action', controlId: item.id })}>
                      {item.nextAction}
                    </button>
                  </dd>
                  <dt>Due</dt>
                  <dd>{formatDate(item.dueDate)}</dd>
                </dl>
                <button type="button" className="ctl-btn" onClick={() => openControl(item.id)}>
                  Open control
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="ctl-empty">
            <strong>No controls currently require attention in this view.</strong>
            <p className="ctl-lede">Effective controls remain in the inventory below.</p>
          </div>
        )}
      </section>

      <section className="ctl-card">
        <header>
          <h2>Priority-risk protection</h2>
          <p>Whether the most important organisational risks are actually controlled.</p>
        </header>
        <ul className="ctl-list">
          {visibleRisks.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => openOverlay({ kind: 'risk-chain', riskId: item.id })}>
                <span>
                  {item.title}
                  <em className="ctl-muted">
                    {' '}
                    · {item.severity} · {item.businessUnit} · {item.owner}
                  </em>
                </span>
                <Pill tone={item.protection === 'adequate' ? 'ok' : item.protection === 'insufficient' ? 'bad' : 'watch'}>
                  {protectionLabel(item.protection)}
                </Pill>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="ctl-card">
        <header>
          <h2>Controls with the greatest assurance leverage</h2>
          <p>Controls that support multiple requirements and frameworks.</p>
        </header>
        <ul className="ctl-list">
          {leverage.map((item) => (
            <li key={item.control.id}>
              <button type="button" onClick={() => openControl(item.control.id)}>
                <span>
                  {item.control.title}
                  <em className="ctl-muted">
                    {' '}
                    · {item.frameworkCount} frameworks · {item.obligationCount} obligations · {item.impact}
                  </em>
                </span>
                <Pill tone={assuranceTone(item.control.overall)}>{assuranceLabel(item.control.overall)}</Pill>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="ctl-card">
        <header>
          <h2>Evidence dependencies</h2>
          <p>Missing, expiring, conflicting, awaiting approval, or without an owner.</p>
        </header>
        <div className="ctl-toolbar">
          {(['missing', 'expiring', 'conflicting', 'awaiting-approval'] as const).map((health) => (
            <button key={health} type="button" className="ctl-chip" onClick={() => openOverlay({ kind: 'evidence', health })}>
              {healthLabel(health)} ({evidenceRows.filter((row) => row.health === health).length})
            </button>
          ))}
          <button type="button" className="ctl-chip" onClick={() => openOverlay({ kind: 'evidence', health: 'no-owner' })}>
            No evidence owner ({evidenceRows.filter((row) => row.health === 'no-owner').length})
          </button>
        </div>
        <ul className="ctl-list">
          {evidenceRows.slice(0, 6).map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => openOverlay({ kind: 'evidence', health: item.health, controlId: item.controlId })}>
                <span>
                  {item.controlTitle}
                  <em className="ctl-muted">
                    {' '}
                    · {item.evidenceTitle} · {item.detail}
                  </em>
                </span>
                <Pill tone={item.health === 'missing' || item.health === 'conflicting' ? 'bad' : 'watch'}>{healthLabel(item.health)}</Pill>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="ctl-card" id="control-inventory">
        <header className="ctl-section-head">
          <div>
            <h2>Control inventory</h2>
            <p>
              Showing {visible.length} of {controls.length}
              {filters.categoryId !== 'all' ? ` · ${categoryById(filters.categoryId)?.name}` : ''}
            </p>
          </div>
          {hasActiveFilters(filters) ? (
            <button type="button" className="ctl-ghost" onClick={() => patchFilters(defaultFilters())}>
              Clear filters
            </button>
          ) : null}
        </header>

        {chips.length ? (
          <div className="ctl-chip-row">
            {chips.map((chip) => (
              <button key={`${chip.key}-${chip.valueLabel}`} type="button" className="ctl-chip is-active" onClick={() => patchFilters(clearFilterChip(filters, chip.key))}>
                {chip.label}: {chip.valueLabel} ×
              </button>
            ))}
          </div>
        ) : null}

        <div className="ctl-toolbar">
          <select value={filters.assurance} onChange={(event) => patchFilters({ assurance: event.target.value as ControlFilters['assurance'] })} aria-label="Assurance status">
            <option value="all">All assurance</option>
            <option value="effective">Effective</option>
            <option value="partially-assured">Partially assured</option>
            <option value="unverifiable">Unverifiable</option>
            <option value="ineffective">Ineffective</option>
            <option value="not-assessed">Not assessed</option>
          </select>
          <select value={filters.businessUnit} onChange={(event) => patchFilters({ businessUnit: event.target.value })} aria-label="Business unit">
            <option value="all">All business units</option>
            {uniqueValues(controls.map((item) => item.businessUnit)).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={filters.riskId} onChange={(event) => patchFilters({ riskId: event.target.value })} aria-label="Risk">
            <option value="all">All risks</option>
            {riskOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <select value={filters.evidenceHealth} onChange={(event) => patchFilters({ evidenceHealth: event.target.value as ControlFilters['evidenceHealth'] })} aria-label="Evidence condition">
            <option value="all">All evidence conditions</option>
            <option value="current">Current</option>
            <option value="expiring">Expiring</option>
            <option value="missing">Missing</option>
            <option value="conflicting">Conflicting</option>
            <option value="awaiting-approval">Awaiting approval</option>
            <option value="no-owner">No evidence owner</option>
          </select>
          <select value={filters.ownerId} onChange={(event) => patchFilters({ ownerId: event.target.value })} aria-label="Owner">
            <option value="all">All owners</option>
            {peopleOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={filters.type} onChange={(event) => patchFilters({ type: event.target.value as ControlFilters['type'] })} aria-label="Control type">
            <option value="all">All types</option>
            <option value="preventive">Preventive</option>
            <option value="detective">Detective</option>
            <option value="corrective">Corrective</option>
            <option value="directive">Directive</option>
          </select>
          <select value={filters.execution} onChange={(event) => patchFilters({ execution: event.target.value as ControlFilters['execution'] })} aria-label="Execution method">
            <option value="all">All execution methods</option>
            <option value="manual">Manual</option>
            <option value="automated">Automated</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select value={filters.assessed} onChange={(event) => patchFilters({ assessed: event.target.value as ControlFilters['assessed'] })} aria-label="Assessment date">
            <option value="all">Any assessment date</option>
            <option value="last-90">Assessed in last 90 days</option>
            <option value="older-90">Assessed over 90 days ago</option>
            <option value="overdue">Next assessment overdue</option>
          </select>
        </div>

        {loading ? (
          <div className="ctl-empty">
            <strong>Loading control inventory…</strong>
            <p className="ctl-lede">Preparing assurance, evidence and mapping relationships.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="ctl-empty">
            <strong>{empty.title}</strong>
            <p className="ctl-lede">{empty.body}</p>
            <button
              type="button"
              className="ctl-btn"
              onClick={() => {
                if (empty.action === 'Add control') openOverlay({ kind: 'add' })
                else patchFilters(defaultFilters())
              }}
            >
              {empty.action}
            </button>
          </div>
        ) : (
          <div className="ctl-table-wrap">
            <table className="ctl-table">
              <thead>
                <tr>
                  <th>Control</th>
                  <th>Category</th>
                  <th>Overall</th>
                  <th>Design</th>
                  <th>Operation</th>
                  <th>Evidence</th>
                  <th>Risks</th>
                  <th>Obligations</th>
                  <th>Owner</th>
                  <th>Last assessed</th>
                  <th>Next assessment</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className={selectedId === item.id ? 'is-active' : undefined}>
                    <td>
                      <button type="button" onClick={() => openControl(item.id)}>
                        {item.title}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => patchFilters({ categoryId: item.categoryId })}>
                        {item.categoryShort}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => patchFilters({ assurance: item.overall }, true)}>
                        <Pill tone={assuranceTone(item.overall)}>{assuranceLabel(item.overall)}</Pill>
                      </button>
                    </td>
                    <td>{item.design}</td>
                    <td>{item.operating}</td>
                    <td>
                      <button type="button" onClick={() => openOverlay({ kind: 'evidence', health: item.evidenceHealth, controlId: item.id })}>
                        {healthLabel(item.evidenceHealth)}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => openOverlay({ kind: 'risks', controlId: item.id })}>
                        {item.riskIds.length}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => openOverlay({ kind: 'obligations', controlId: item.id })}>
                        {item.obligationIds.length}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => openOverlay({ kind: 'owner', personId: item.ownerId })}>
                        {item.owner}
                      </button>
                    </td>
                    <td>{formatDate(item.lastAssessed)}</td>
                    <td>{formatDate(item.nextAssessment)}</td>
                    <td>
                      <button type="button" onClick={() => openOverlay({ kind: 'action', controlId: item.id })}>
                        {item.nextAction}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ControlOverlay
        overlay={overlay}
        controls={controls}
        evidenceRows={evidenceRows}
        risks={risks}
        onClose={closeOverlay}
        onAskNox={(prompt) => onAskNox?.(prompt)}
        onNavigate={go}
        onFilter={(patch) => {
          closeOverlay()
          patchFilters(patch, true)
        }}
        onCreate={(record) => {
          setDrafts((current) => [record, ...current])
          closeOverlay()
          openControl(record.id)
        }}
      />
    </div>
  )
}

function ControlOverlay({
  overlay,
  controls,
  evidenceRows,
  risks,
  onClose,
  onAskNox,
  onNavigate,
  onFilter,
  onCreate,
}: {
  overlay: Overlay
  controls: ControlRecord[]
  evidenceRows: ReturnType<typeof evidenceDependencies>
  risks: ReturnType<typeof priorityRisks>
  onClose: () => void
  onAskNox: (prompt?: string) => void
  onNavigate: (target: ControlNavigateTarget) => void
  onFilter: (patch: Partial<ControlFilters>) => void
  onCreate: (record: ControlRecord) => void
}) {
  if (overlay.kind === 'none') return null
  const control = 'controlId' in overlay && overlay.controlId ? controls.find((item) => item.id === overlay.controlId) : null

  return (
    <div className="ctl-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ctl-drawer" onClick={(event) => event.stopPropagation()}>
        <header className="ctl-drawer-head">
          <div>
            <p className="ctl-kicker">{overlayTitle(overlay)}</p>
            <h2>{overlayHeading(overlay, control)}</h2>
          </div>
          <button type="button" className="ctl-ghost" onClick={onClose}>
            Close
          </button>
        </header>
        {overlay.kind === 'add' ? <AddControlForm onCancel={onClose} onCreate={onCreate} /> : null}
        {overlay.kind === 'owner' ? <OwnerPanel personId={overlay.personId} onFilter={onFilter} onAskNox={onAskNox} /> : null}
        {overlay.kind === 'evidence' ? (
          <EvidencePanel
            rows={evidenceRows.filter((row) => {
              if (overlay.controlId && row.controlId !== overlay.controlId) return false
              if (overlay.health && row.health !== overlay.health) return false
              return true
            })}
            health={overlay.health}
            onNavigate={onNavigate}
            onFilter={onFilter}
            onAskNox={onAskNox}
          />
        ) : null}
        {overlay.kind === 'risks' && control ? (
          <MappingPanel
            title="Connected risks"
            items={control.riskIds.map((id) => ({
              id,
              title: titleOf(data.risks, id),
              meta: 'Open risk',
            }))}
            onOpen={(id) => onNavigate({ type: 'module', module: 'risks', recordId: id })}
            empty="No connected risks for this control."
          />
        ) : null}
        {overlay.kind === 'obligations' && control ? (
          <MappingPanel
            title="Mapped obligations"
            items={control.obligationIds.map((id) => ({
              id,
              title: titleOf(data.obligations, id),
              meta: 'Open obligation',
            }))}
            onOpen={(id) => onNavigate({ type: 'module', module: 'regulatory', recordId: id })}
            empty="No mapped obligations for this control."
          />
        ) : null}
        {overlay.kind === 'frameworks' ? (
          <FrameworkPanel
            frameworkId={overlay.frameworkId}
            control={control}
            controls={controls}
            onFilter={onFilter}
            onOpenControl={(id) => onNavigate({ type: 'control', controlId: id })}
            onAskNox={onAskNox}
          />
        ) : null}
        {overlay.kind === 'action' && control ? (
          <ActionPanel control={control} onAskNox={onAskNox} onNavigate={onNavigate} onClose={onClose} />
        ) : null}
        {overlay.kind === 'risk-chain' ? (
            <RiskChainPanel
              riskId={overlay.riskId}
              risks={risks}
              controls={controls}
              onNavigate={onNavigate}
              onAskNox={onAskNox}
              onFilter={onFilter}
            />
        ) : null}
      </div>
    </div>
  )
}

function overlayTitle(overlay: Overlay) {
  if (overlay.kind === 'add') return 'Add control'
  if (overlay.kind === 'owner') return 'Accountability'
  if (overlay.kind === 'evidence') return 'Evidence'
  if (overlay.kind === 'risks') return 'Connected risks'
  if (overlay.kind === 'obligations') return 'Mapped obligations'
  if (overlay.kind === 'frameworks') return 'Framework mapping'
  if (overlay.kind === 'action') return 'Review workflow'
  if (overlay.kind === 'risk-chain') return 'Risk protection'
  return 'Controls'
}

function overlayHeading(overlay: Overlay, control: ControlRecord | null | undefined) {
  if (overlay.kind === 'add') return 'Create a control for this session'
  if (control) return control.title
  if (overlay.kind === 'frameworks' && overlay.frameworkId) return frameworkName(overlay.frameworkId)
  if (overlay.kind === 'owner') return peopleOptions.find((item) => item.id === overlay.personId)?.name ?? 'Owner'
  return 'Details'
}

function AddControlForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (record: ControlRecord) => void
}) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(controlCategories()[0]?.id ?? '')
  const [businessUnit, setBusinessUnit] = useState('Group')
  const [ownerId, setOwnerId] = useState(peopleOptions[0]?.id ?? '')
  const [type, setType] = useState<ControlType>('preventive')
  const [execution, setExecution] = useState<ExecutionMethod>('hybrid')
  const [frequency, setFrequency] = useState<ControlFrequency>('monthly')
  const [error, setError] = useState('')

  return (
    <form
      className="ctl-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim()) {
          setError('Enter a control name.')
          return
        }
        onCreate(
          createDraftControl({
            title: title.trim(),
            categoryId,
            businessUnit,
            ownerId,
            type,
            execution,
            frequency,
          }),
        )
      }}
    >
      <label className="ctl-field">
        <span>Control name</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Vendor invoice matching" />
      </label>
      <label className="ctl-field">
        <span>Category</span>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {controlCategories().map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="ctl-field">
        <span>Business unit</span>
        <input value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)} />
      </label>
      <label className="ctl-field">
        <span>Owner</span>
        <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
          {peopleOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="ctl-field">
        <span>Type</span>
        <select value={type} onChange={(event) => setType(event.target.value as ControlType)}>
          <option value="preventive">Preventive</option>
          <option value="detective">Detective</option>
          <option value="corrective">Corrective</option>
          <option value="directive">Directive</option>
        </select>
      </label>
      <label className="ctl-field">
        <span>Execution</span>
        <select value={execution} onChange={(event) => setExecution(event.target.value as ExecutionMethod)}>
          <option value="manual">Manual</option>
          <option value="automated">Automated</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label className="ctl-field">
        <span>Frequency</span>
        <select value={frequency} onChange={(event) => setFrequency(event.target.value as ControlFrequency)}>
          <option value="continuous">Continuous</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
          <option value="event-driven">Event-driven</option>
        </select>
      </label>
      {error ? <p className="ctl-muted">{error}</p> : <p className="ctl-lede">Saved controls stay in this session only. They are not assessed until evidence exists.</p>}
      <div className="ctl-toolbar">
        <button type="submit" className="ctl-btn primary">
          Save control
        </button>
        <button type="button" className="ctl-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function OwnerPanel({
  personId,
  onFilter,
  onAskNox,
}: {
  personId: string
  onFilter: (patch: Partial<ControlFilters>) => void
  onAskNox: (prompt?: string) => void
}) {
  const person = peopleOptions.find((item) => item.id === personId)
  return (
    <div className="ctl-blocks">
      <p className="ctl-lede">
        {person ? `${person.name} is ${person.role}. Filtering the inventory shows every control they own.` : 'This owner is not in the organisation directory.'}
      </p>
      <div className="ctl-toolbar">
        <button type="button" className="ctl-btn primary" onClick={() => onFilter({ ownerId: personId })}>
          Show controls they own
        </button>
        <button type="button" className="ctl-btn" onClick={() => onAskNox(`What should ${person?.name ?? 'the owner'} do next?`)}>
          Ask Nox about this owner
        </button>
      </div>
    </div>
  )
}

function EvidencePanel({
  rows,
  health,
  onNavigate,
  onFilter,
  onAskNox,
}: {
  rows: ReturnType<typeof evidenceDependencies>
  health?: EvidenceHealth | 'no-owner'
  onNavigate: (target: ControlNavigateTarget) => void
  onFilter: (patch: Partial<ControlFilters>) => void
  onAskNox: (prompt?: string) => void
}) {
  return (
    <div className="ctl-blocks">
      <p className="ctl-lede">
        {health ? `${healthLabel(health)} evidence in this view.` : 'Evidence linked to the selected control.'} Opening a row takes you to the evidence record, or to upload if the pack is still missing.
      </p>
      <ul className="ctl-list">
        {rows.length ? (
          rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => {
                  if (!row.evidenceId) {
                    onNavigate({ type: 'upload' })
                    return
                  }
                  onNavigate({ type: 'module', module: 'evidence', recordId: row.evidenceId })
                }}
              >
                <span>
                  {row.evidenceTitle}
                  <em className="ctl-muted">
                    {' '}
                    · {row.controlTitle} · {row.owner}
                  </em>
                </span>
                <b>{row.evidenceId ? 'Open' : 'Upload'}</b>
              </button>
            </li>
          ))
        ) : (
          <li>
            <button type="button" onClick={() => onFilter({ evidenceHealth: 'all' })}>
              No evidence in this condition. Show the full inventory.
            </button>
          </li>
        )}
      </ul>
      <div className="ctl-toolbar">
        {health ? (
          <button type="button" className="ctl-btn" onClick={() => onFilter({ evidenceHealth: health })}>
            Filter inventory to {healthLabel(health).toLowerCase()}
          </button>
        ) : null}
        <button type="button" className="ctl-btn" onClick={() => onAskNox('What evidence is missing, expiring or conflicting?')}>
          Ask Nox about evidence
        </button>
      </div>
    </div>
  )
}

function MappingPanel({
  title,
  items,
  onOpen,
  empty,
}: {
  title: string
  items: { id: string; title: string; meta: string }[]
  onOpen: (id: string) => void
  empty: string
}) {
  return (
    <div className="ctl-blocks">
      <p className="ctl-lede">{title}</p>
      {items.length ? (
        <ul className="ctl-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onOpen(item.id)}>
                <span>{item.title}</span>
                <b>{item.meta}</b>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ctl-empty">
          <strong>{empty}</strong>
        </div>
      )}
    </div>
  )
}

function FrameworkPanel({
  frameworkId,
  control,
  controls,
  onFilter,
  onOpenControl,
  onAskNox,
}: {
  frameworkId?: string
  control: ControlRecord | null | undefined
  controls: ControlRecord[]
  onFilter: (patch: Partial<ControlFilters>) => void
  onOpenControl: (id: string) => void
  onAskNox: (prompt?: string) => void
}) {
  const id = frameworkId ?? control?.frameworkIds[0]
  const name = id ? frameworkName(id) : 'Frameworks'
  const mapped = id ? controls.filter((item) => item.frameworkIds.includes(id)) : []
  return (
    <div className="ctl-blocks">
      <p className="ctl-lede">
        {name} is supported by {mapped.length} control{mapped.length === 1 ? '' : 's'} in this inventory.
      </p>
      <ul className="ctl-list">
        {mapped.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpenControl(item.id)}>
              <span>
                {item.title}
                <em className="ctl-muted"> · {assuranceLabel(item.overall)}</em>
              </span>
              <b>Open</b>
            </button>
          </li>
        ))}
      </ul>
      <div className="ctl-toolbar">
        {id ? (
          <button type="button" className="ctl-btn primary" onClick={() => onFilter({ frameworkId: id })}>
            Filter page to {name}
          </button>
        ) : null}
        <button type="button" className="ctl-btn" onClick={() => onAskNox(`Which controls have the greatest effect on ${name} assurance?`)}>
          Ask Nox
        </button>
      </div>
    </div>
  )
}

function ActionPanel({
  control,
  onAskNox,
  onNavigate,
  onClose,
}: {
  control: ControlRecord
  onAskNox: (prompt?: string) => void
  onNavigate: (target: ControlNavigateTarget) => void
  onClose: () => void
}) {
  const action = control.openActions[0]
  const needsUpload = control.id === 'ctl-005' && control.overall === 'unverifiable'
  return (
    <div className="ctl-blocks">
      <p className="ctl-lede">{control.nextAction}</p>
      <dl className="ctl-dl">
        <dt>Owner</dt>
        <dd>{action?.owner ?? control.owner}</dd>
        <dt>Due</dt>
        <dd>{formatDate(action?.dueDate ?? control.dueDate)}</dd>
        <dt>Status</dt>
        <dd>{action?.status ?? 'open'}</dd>
      </dl>
      <p className="ctl-muted">Human approval is required before this action can change the organisation position.</p>
      <div className="ctl-toolbar">
        {needsUpload ? (
          <button type="button" className="ctl-btn primary" onClick={() => onNavigate({ type: 'upload' })}>
            Upload current assessments
          </button>
        ) : (
          <button type="button" className="ctl-btn primary" onClick={() => onNavigate({ type: 'module', module: 'evidence', recordId: control.evidenceIds[0] ?? null })}>
            Open supporting evidence
          </button>
        )}
        <button type="button" className="ctl-btn" onClick={() => onAskNox(`What should the owner do next for ${control.title}?`)}>
          Ask Nox
        </button>
        <button type="button" className="ctl-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

function RiskChainPanel({
  riskId,
  risks,
  controls,
  onNavigate,
  onAskNox,
  onFilter,
}: {
  riskId: string
  risks: ReturnType<typeof priorityRisks>
  controls: ControlRecord[]
  onNavigate: (target: ControlNavigateTarget) => void
  onAskNox: (prompt?: string) => void
  onFilter: (patch: Partial<ControlFilters>) => void
}) {
  const risk = risks.find((item) => item.id === riskId)
  if (!risk) {
    return (
      <div className="ctl-empty">
        <strong>Risk not found in this view.</strong>
        <button type="button" className="ctl-btn" onClick={() => onNavigate({ type: 'module', module: 'risks' })}>
          Open Risks
        </button>
      </div>
    )
  }
  const linked = controls.filter((item) => risk.controlIds.includes(item.id))
  return (
    <div className="ctl-blocks">
      <p className="ctl-lede">
        {risk.title} is {protectionLabel(risk.protection).toLowerCase()}. Follow risk → mitigating controls → evidence → obligations → frameworks.
      </p>
      <div className="ctl-chain">
        <button type="button" onClick={() => onNavigate({ type: 'module', module: 'risks', recordId: risk.id })}>
          {risk.title}
        </button>
        <em>→</em>
        <button type="button" onClick={() => onNavigate({ type: 'control', controlId: linked[0]?.id ?? null })}>
          {linked.length} controls
        </button>
        <em>→</em>
        <button type="button" onClick={() => onNavigate({ type: 'module', module: 'evidence', recordId: risk.evidenceIds[0] ?? null })}>
          Evidence
        </button>
        <em>→</em>
        <button type="button" onClick={() => onNavigate({ type: 'module', module: 'regulatory', recordId: risk.obligationIds[0] ?? null })}>
          Obligations
        </button>
        <em>→</em>
        <button
          type="button"
          onClick={() => {
            if (risk.frameworkIds[0]) onFilter({ frameworkId: risk.frameworkIds[0] })
            else onNavigate({ type: 'module', module: 'regulatory' })
          }}
        >
          {risk.frameworkIds.map((id) => frameworkName(id)).join(', ') || 'Frameworks'}
        </button>
      </div>
      <ul className="ctl-list">
        {linked.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onNavigate({ type: 'control', controlId: item.id })}>
              <span>
                {item.title}
                <em className="ctl-muted"> · {assuranceLabel(item.overall)} · {healthLabel(item.evidenceHealth)}</em>
              </span>
              <b>Open</b>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="ctl-btn" onClick={() => onAskNox(`Which controls are insufficient for ${risk.title}?`)}>
        Ask Nox about this risk
      </button>
    </div>
  )
}

