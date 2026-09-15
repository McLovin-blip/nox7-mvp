import { useEffect, useMemo, useState } from 'react'
import { useSession } from '../state/SessionProvider.tsx'
import { organisation, titleOf, data, frameworkName } from '../mock/data.ts'
import {
  attentionObligations,
  buildObligationBriefing,
  buildObligationRecords,
  clearObligationChip,
  controlOptions,
  defaultObligationFilters,
  describeObligationDrill,
  filterObligations,
  formatDate,
  frameworkOptions,
  frameworkSummaries,
  hasObligationFilters,
  healthLabel,
  obligationChips,
  obligationIndicators,
  overlapRows,
  peopleOptions,
  periodLabel,
  previousObligations,
  statusLabel,
  toneOf,
  uniqueValues,
  type ObligationFilters,
  type ObligationRecord,
  type WorkspaceNavigate,
} from './regulatoryModel.ts'
import '../workspace.css'

type Overlay =
  | { kind: 'none' }
  | { kind: 'owner'; personId: string }
  | { kind: 'controls'; obligationId: string }
  | { kind: 'evidence'; obligationId: string }
  | { kind: 'risks'; obligationId: string }
  | { kind: 'action'; obligationId: string }

function Pill({ tone, children }: { tone: 'ok' | 'watch' | 'bad'; children: string }) {
  return <span className={`wx-pill ${tone}`}>{children}</span>
}

export function RegulatoryModule({
  selectedId,
  onSelect,
  onNavigate,
  onAskNox,
  onDrillContextChange,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNavigate?: (target: WorkspaceNavigate) => void
  onAskNox?: (prompt?: string) => void
  onDrillContextChange?: (context: { label: string; questions: string[] } | null) => void
}) {
  const { position } = useSession()
  const [filters, setFilters] = useState<ObligationFilters>(defaultObligationFilters())
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' })

  const records = useMemo(() => buildObligationRecords(position), [position])
  const previous = useMemo(() => previousObligations(position), [position])
  const visible = useMemo(() => filterObligations(records, filters), [records, filters])
  const scoped = useMemo(
    () => filterObligations(records, { ...defaultObligationFilters(), frameworkId: filters.frameworkId, query: filters.query }),
    [records, filters.frameworkId, filters.query],
  )
  const indicators = useMemo(
    () => obligationIndicators(scoped, filterObligations(previous, { ...defaultObligationFilters(), frameworkId: filters.frameworkId })),
    [scoped, previous, filters.frameworkId],
  )
  const frameworks = useMemo(() => frameworkSummaries(records, previous), [records, previous])
  const briefing = useMemo(() => buildObligationBriefing(visible, filters, position), [visible, filters, position])
  const attention = useMemo(() => attentionObligations(visible), [visible])
  const overlap = useMemo(() => overlapRows(visible), [visible])
  const chips = useMemo(() => obligationChips(filters), [filters])
  const drill = useMemo(() => describeObligationDrill(filters), [filters])
  const selected = selectedId ? records.find((item) => item.id === selectedId) ?? null : null

  useEffect(() => {
    onDrillContextChange?.(drill)
  }, [drill, onDrillContextChange])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (overlay.kind !== 'none') {
        setOverlay({ kind: 'none' })
        return
      }
      if (selectedId) onSelect(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay, selectedId, onSelect])

  const patch = (next: Partial<ObligationFilters>, scroll = false) => {
    setFilters((current) => ({ ...current, ...next }))
    onSelect(null)
    if (scroll) {
      window.requestAnimationFrame(() => document.getElementById('obligation-inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const go = (target: WorkspaceNavigate) => {
    if (target.type === 'obligation') {
      onSelect(target.obligationId)
      return
    }
    onNavigate?.(target)
  }

  if (selected) {
    return (
      <>
        <ObligationDetail
          item={selected}
          onBack={() => onSelect(null)}
          onAskNox={(prompt) => onAskNox?.(prompt)}
          onNavigate={go}
          onOwner={() => setOverlay({ kind: 'owner', personId: selected.ownerId })}
          onControls={() => setOverlay({ kind: 'controls', obligationId: selected.id })}
          onEvidence={() => setOverlay({ kind: 'evidence', obligationId: selected.id })}
          onRisks={() => setOverlay({ kind: 'risks', obligationId: selected.id })}
          onAction={() => setOverlay({ kind: 'action', obligationId: selected.id })}
          onFramework={() => patch({ frameworkId: selected.frameworkId }, true)}
        />
        <OverlayPanel overlay={overlay} records={records} onClose={() => setOverlay({ kind: 'none' })} onNavigate={go} onAskNox={(prompt) => onAskNox?.(prompt)} onFilter={(next) => { setOverlay({ kind: 'none' }); patch(next, true) }} />
      </>
    )
  }

  return (
    <div className="wx-page">
      <header className="wx-page-head">
        <p className="wx-kicker">Regulatory</p>
        <h1>Know which obligations are actually supported.</h1>
        <p className="wx-lede">A current policy is not coverage. This page separates a requirement existing from it being supported by current evidence.</p>
        <div className="wx-meta">
          <span>{organisation.name}</span>
          <span>{periodLabel}</span>
          <span>{filters.frameworkId === 'all' ? 'All frameworks' : frameworkName(filters.frameworkId)}</span>
        </div>
        <div className="wx-toolbar">
          <input className="wx-search" value={filters.query} onChange={(event) => patch({ query: event.target.value }, true)} placeholder="Search obligations, owners, codes…" aria-label="Search obligations" />
          <select value={filters.frameworkId} aria-label="Framework filter" onChange={(event) => patch({ frameworkId: event.target.value }, true)}>
            <option value="all">All frameworks</option>
            {frameworkOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <button type="button" className="wx-btn" onClick={() => onAskNox?.(drill.questions[0])}>Ask Nox</button>
        </div>
      </header>

      <div className="wx-kpis">
        {indicators.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`wx-kpi${item.id === 'unverifiable' ? ' is-warn' : ''}${item.id === 'unsupported' ? ' is-bad' : ''}${item.filter.status !== 'all' && filters.status === item.filter.status ? ' is-active' : ''}`}
            onClick={() => patch({ ...defaultObligationFilters(), frameworkId: filters.frameworkId, ...item.filter }, true)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.context}</em>
            <em>{item.change}</em>
          </button>
        ))}
      </div>

      <section className="wx-card">
        <header>
          <h2>Obligation support by framework</h2>
          <p>Selecting a framework filters every section, including Nox AI context.</p>
        </header>
        <div className="wx-tabs" role="tablist">
          <button type="button" className={`wx-tab${filters.frameworkId === 'all' ? ' is-active' : ''}`} onClick={() => patch({ frameworkId: 'all' })}>Overview</button>
          {frameworks.map((item) => (
            <button key={item.id} type="button" className={`wx-tab${filters.frameworkId === item.id ? ' is-active' : ''}`} onClick={() => patch({ frameworkId: item.id })}>
              {item.shortLabel}
            </button>
          ))}
        </div>
        <div className="wx-cat-grid">
          {(filters.frameworkId === 'all' ? frameworks : frameworks.filter((item) => item.id === filters.frameworkId)).map((item) => (
            <button key={item.id} type="button" className={`wx-cat${filters.frameworkId === item.id ? ' is-active' : ''}`} onClick={() => patch({ frameworkId: item.id })}>
              <header>
                <h3>{item.name}</h3>
                <p>{item.coverage}% coverage · {item.count} obligations</p>
              </header>
              <div className="wx-dist" aria-hidden="true">
                <i className="ok" style={{ flex: Math.max(item.supported, 0.0001) }} />
                <i className="watch" style={{ flex: Math.max(item.partial + item.unverifiable, 0.0001) }} />
                <i className="bad" style={{ flex: Math.max(item.unsupported, 0.0001) }} />
              </div>
              <div className="wx-cat-meta">
                <span>{item.supported} supported</span>
                <span>{item.partial} partial</span>
                <span>{item.unverifiable} unverifiable</span>
                <span>{item.unsupported} unsupported</span>
                <span>{item.controlCount} controls</span>
                <span>{item.evidenceCoverage}% current evidence</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="wx-briefing">
        <header className="wx-section-head">
          <div>
            <p className="wx-kicker">Nox AI regulatory briefing</p>
            <h2>{briefing.title}</h2>
            <p>{briefing.attention}</p>
          </div>
          <div className="wx-meta">
            <span>Confidence · {briefing.confidence}</span>
            <span>Freshness · {briefing.freshness}</span>
          </div>
        </header>
        <div className="wx-briefing-grid">
          <div>
            <h3>Verified facts</h3>
            <ul className="wx-facts">
              {briefing.facts.map((fact) => (
                <li key={fact.id}>
                  <button type="button" onClick={() => go({ type: 'obligation', obligationId: fact.citationId })}>{fact.text}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Nox AI interpretation</h3>
            <button type="button" className="wx-interpret" onClick={() => onAskNox?.(briefing.askPrompt)}>{briefing.interpretation}</button>
            <h3>Recommended action</h3>
            <p className="wx-lede">{briefing.recommendedAction}</p>
            <p className="wx-muted">{briefing.owner} · due {briefing.due} · {briefing.approval}</p>
            <div className="wx-toolbar">
              <button type="button" className="wx-btn primary" onClick={() => setOverlay({ kind: 'action', obligationId: attention[0]?.id ?? 'obl-iso-a532' })}>Open recommended action</button>
              <button type="button" className="wx-btn" onClick={() => onAskNox?.(briefing.askPrompt)}>Ask Nox</button>
            </div>
          </div>
        </div>
        <div className="wx-toolbar">
          {briefing.sources.map((source) => (
            <button key={source.id} type="button" className="wx-source" onClick={() => go({ type: 'module', module: source.kind === 'Control' ? 'controls' : source.kind === 'Risk' ? 'risks' : 'regulatory', recordId: source.id })}>
              {source.kind} · {source.title}
            </button>
          ))}
        </div>
      </section>

      <section className="wx-card">
        <header>
          <h2>Obligations requiring attention</h2>
          <p>Maximum three. Unverifiable means evidence is insufficient — not that the requirement has failed.</p>
        </header>
        {attention.length ? (
          <div className="wx-attention-grid">
            {attention.map((item) => (
              <article key={item.id} className="wx-attention">
                <button type="button" className="wx-interpret" onClick={() => onSelect(item.id)}><h3>{item.title}</h3></button>
                <div className="wx-pills">
                  <Pill tone={toneOf(item.overall)}>{statusLabel(item.overall)}</Pill>
                  <button type="button" className="wx-chip" onClick={() => patch({ frameworkId: item.frameworkId })}>{item.framework}</button>
                </div>
                <dl className="wx-dl">
                  <dt>Code</dt><dd>{item.code}</dd>
                  <dt>Owner</dt>
                  <dd><button type="button" className="wx-linkish" onClick={() => setOverlay({ kind: 'owner', personId: item.ownerId })}>{item.owner}</button></dd>
                  <dt>Evidence</dt>
                  <dd><button type="button" className="wx-linkish" onClick={() => setOverlay({ kind: 'evidence', obligationId: item.id })}>{healthLabel(item.evidenceHealth)}</button></dd>
                  <dt>Controls</dt>
                  <dd><button type="button" className="wx-linkish" onClick={() => setOverlay({ kind: 'controls', obligationId: item.id })}>{item.controlIds.length}</button></dd>
                  <dt>Risks</dt>
                  <dd><button type="button" className="wx-linkish" onClick={() => setOverlay({ kind: 'risks', obligationId: item.id })}>{item.riskIds.length}</button></dd>
                  <dt>Next action</dt>
                  <dd><button type="button" className="wx-linkish" onClick={() => setOverlay({ kind: 'action', obligationId: item.id })}>{item.nextAction}</button></dd>
                </dl>
                <button type="button" className="wx-btn" onClick={() => onSelect(item.id)}>Open obligation</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="wx-empty"><strong>No obligations require attention in this view.</strong></div>
        )}
      </section>

      <section className="wx-card">
        <header>
          <h2>Controls with the greatest regulatory leverage</h2>
          <p>Where one control supports more than one requirement or framework.</p>
        </header>
        {overlap.length ? (
          <ul className="wx-list">
            {overlap.map((item) => (
              <li key={item.controlId}>
                <button type="button" onClick={() => go({ type: 'module', module: 'controls', recordId: item.controlId })}>
                  <span>{item.controlTitle}<em className="wx-muted"> · {item.frameworks.join(', ')} · {item.impact}</em></span>
                  <b>{item.obligationCount}</b>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="wx-empty"><strong>No overlapping controls in this view.</strong></div>
        )}
      </section>

      <section className="wx-card" id="obligation-inventory">
        <header className="wx-section-head">
          <div>
            <h2>Obligation inventory</h2>
            <p>Showing {visible.length} of {records.length}</p>
          </div>
          {hasObligationFilters(filters) ? <button type="button" className="wx-ghost" onClick={() => patch(defaultObligationFilters())}>Clear filters</button> : null}
        </header>
        {chips.length ? (
          <div className="wx-chip-row">
            {chips.map((chip) => (
              <button key={`${chip.key}-${chip.valueLabel}`} type="button" className="wx-chip is-active" onClick={() => patch(clearObligationChip(filters, chip.key))}>
                {chip.label}: {chip.valueLabel} ×
              </button>
            ))}
          </div>
        ) : null}
        <div className="wx-toolbar">
          <select value={filters.status} onChange={(event) => patch({ status: event.target.value as ObligationFilters['status'] })} aria-label="Support status">
            <option value="all">All support states</option>
            <option value="supported">Supported</option>
            <option value="partial">Partially supported</option>
            <option value="unverifiable">Unverifiable</option>
            <option value="unsupported">Unsupported</option>
          </select>
          <select value={filters.theme} onChange={(event) => patch({ theme: event.target.value })} aria-label="Theme">
            <option value="all">All themes</option>
            {uniqueValues(records.map((item) => item.theme)).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={filters.ownerId} onChange={(event) => patch({ ownerId: event.target.value })} aria-label="Owner">
            <option value="all">All owners</option>
            {peopleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={filters.evidenceHealth} onChange={(event) => patch({ evidenceHealth: event.target.value as ObligationFilters['evidenceHealth'] })} aria-label="Evidence health">
            <option value="all">All evidence conditions</option>
            <option value="current">Current</option>
            <option value="expiring">Expiring</option>
            <option value="missing">Missing</option>
            <option value="conflicting">Conflicting</option>
            <option value="awaiting-approval">Awaiting approval</option>
          </select>
          <select value={filters.controlId} onChange={(event) => patch({ controlId: event.target.value })} aria-label="Control">
            <option value="all">All controls</option>
            {controlOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
        {visible.length === 0 ? (
          <div className="wx-empty">
            <strong>No obligations match these filters</strong>
            <button type="button" className="wx-btn" onClick={() => patch(defaultObligationFilters())}>Clear filters</button>
          </div>
        ) : (
          <div className="wx-table-wrap">
            <table className="wx-table">
              <thead>
                <tr>
                  <th>Obligation</th>
                  <th>Framework</th>
                  <th>Support</th>
                  <th>Evidence</th>
                  <th>Controls</th>
                  <th>Risks</th>
                  <th>Owner</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td><button type="button" onClick={() => onSelect(item.id)}>{item.title}</button></td>
                    <td><button type="button" onClick={() => patch({ frameworkId: item.frameworkId })}>{item.framework}</button></td>
                    <td><button type="button" onClick={() => patch({ status: item.overall }, true)}><Pill tone={toneOf(item.overall)}>{statusLabel(item.overall)}</Pill></button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'evidence', obligationId: item.id })}>{healthLabel(item.evidenceHealth)}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'controls', obligationId: item.id })}>{item.controlIds.length}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'risks', obligationId: item.id })}>{item.riskIds.length}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'owner', personId: item.ownerId })}>{item.owner}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'action', obligationId: item.id })}>{item.nextAction}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OverlayPanel overlay={overlay} records={records} onClose={() => setOverlay({ kind: 'none' })} onNavigate={go} onAskNox={(prompt) => onAskNox?.(prompt)} onFilter={(next) => { setOverlay({ kind: 'none' }); patch(next, true) }} />
    </div>
  )
}

function ObligationDetail({
  item,
  onBack,
  onAskNox,
  onNavigate,
  onOwner,
  onControls,
  onEvidence,
  onRisks,
  onAction,
  onFramework,
}: {
  item: ObligationRecord
  onBack: () => void
  onAskNox: (prompt?: string) => void
  onNavigate: (target: WorkspaceNavigate) => void
  onOwner: () => void
  onControls: () => void
  onEvidence: () => void
  onRisks: () => void
  onAction: () => void
  onFramework: () => void
}) {
  return (
    <div className="wx-detail">
      <div className="wx-crumb">
        <button type="button" onClick={onBack}>Regulatory</button>
        <span>/</span>
        <button type="button" onClick={onFramework}>{item.framework}</button>
        <span>/</span>
        <strong>{item.title}</strong>
      </div>
      <header className="wx-detail-head">
        <p className="wx-kicker">{item.code}</p>
        <h1>{item.title}</h1>
        <p className="wx-lede">{item.why}</p>
        <div className="wx-meta">
          <span>{item.framework}</span>
          <span>{item.theme}</span>
          <Pill tone={toneOf(item.overall)}>{statusLabel(item.overall)}</Pill>
        </div>
        <div className="wx-toolbar">
          <button type="button" className="wx-ghost" onClick={onBack}>Back</button>
          <button type="button" className="wx-btn" onClick={() => onAskNox(`Where are we only counting a policy for ${item.title}?`)}>Ask Nox</button>
          <button type="button" className="wx-btn primary" onClick={onAction}>Review next action</button>
        </div>
      </header>
      <section className="wx-card">
        <header><h2>Relationship</h2><p>Framework → obligation → control → evidence → risks</p></header>
        <div className="wx-chain">
          <button type="button" onClick={onFramework}>{item.framework}</button>
          <em>→</em>
          <strong>{item.title}</strong>
          <em>→</em>
          <button type="button" onClick={onControls}>{item.controlIds.length} controls</button>
          <em>→</em>
          <button type="button" onClick={onEvidence}>{healthLabel(item.evidenceHealth)} evidence</button>
          <em>→</em>
          <button type="button" onClick={onRisks}>{item.riskIds.length} risks</button>
        </div>
      </section>
      <div className="wx-split two">
        <section className="wx-card"><header><h2>Why this conclusion</h2></header><p className="wx-lede">{item.why}</p></section>
        <section className="wx-card"><header><h2>What changed</h2></header><p className="wx-lede">{item.whatChanged}</p></section>
      </div>
      <div className="wx-split two">
        <section className="wx-card">
          <header><h2>Supporting controls</h2></header>
          <ul className="wx-list">
            {item.controlIds.length ? item.controlIds.map((id) => (
              <li key={id}><button type="button" onClick={() => onNavigate({ type: 'module', module: 'controls', recordId: id })}><span>{titleOf(data.controls, id)}</span><b>Open</b></button></li>
            )) : (
              <li><button type="button" onClick={() => onNavigate({ type: 'module', module: 'controls' })}><span>No supporting control mapped yet</span><b>Open controls</b></button></li>
            )}
          </ul>
        </section>
        <section className="wx-card">
          <header><h2>Connected risks</h2></header>
          <ul className="wx-list">
            {item.riskIds.length ? item.riskIds.map((id) => (
              <li key={id}><button type="button" onClick={() => onNavigate({ type: 'module', module: 'risks', recordId: id })}><span>{titleOf(data.risks, id)}</span><b>Open</b></button></li>
            )) : (
              <li><button type="button" onClick={() => onNavigate({ type: 'module', module: 'risks' })}><span>No connected risk mapped yet</span><b>Open risks</b></button></li>
            )}
          </ul>
        </section>
      </div>
      <section className="wx-card">
        <header><h2>Evidence and accountability</h2></header>
        <dl className="wx-dl">
          <dt>Evidence</dt>
          <dd><button type="button" className="wx-linkish" onClick={onEvidence}>{healthLabel(item.evidenceHealth)}</button></dd>
          <dt>Owner</dt>
          <dd><button type="button" className="wx-linkish" onClick={onOwner}>{item.owner}, {item.ownerRole}</button></dd>
          <dt>Last assessed</dt><dd>{formatDate(item.lastAssessed)}</dd>
          <dt>Next review</dt><dd>{formatDate(item.nextReview)}</dd>
        </dl>
        <button type="button" className="wx-btn primary" onClick={onAction}>{item.nextAction}</button>
      </section>
    </div>
  )
}

function OverlayPanel({
  overlay,
  records,
  onClose,
  onNavigate,
  onAskNox,
  onFilter,
}: {
  overlay: Overlay
  records: ObligationRecord[]
  onClose: () => void
  onNavigate: (target: WorkspaceNavigate) => void
  onAskNox: (prompt?: string) => void
  onFilter: (next: Partial<ObligationFilters>) => void
}) {
  if (overlay.kind === 'none') return null
  const item = 'obligationId' in overlay ? records.find((row) => itemMatch(row, overlay)) : null
  const person = overlay.kind === 'owner' ? peopleOptions.find((row) => row.id === overlay.personId) : null
  return (
    <div className="wx-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="wx-drawer" onClick={(event) => event.stopPropagation()}>
        <header className="wx-drawer-head">
          <div>
            <p className="wx-kicker">{overlay.kind}</p>
            <h2>{item?.title ?? person?.name ?? 'Details'}</h2>
          </div>
          <button type="button" className="wx-ghost" onClick={onClose}>Close</button>
        </header>
        {overlay.kind === 'owner' && person ? (
          <div className="wx-blocks">
            <p className="wx-lede">{person.name} is {person.role}.</p>
            <button type="button" className="wx-btn primary" onClick={() => onFilter({ ownerId: person.id })}>Show their obligations</button>
            <button type="button" className="wx-btn" onClick={() => onAskNox(`What should ${person.name} do next?`)}>Ask Nox</button>
          </div>
        ) : null}
        {overlay.kind === 'controls' && item ? (
          <ListNav
            items={item.controlIds.map((id) => ({ id, title: titleOf(data.controls, id) }))}
            empty="No supporting control is mapped yet."
            onOpen={(id) => onNavigate({ type: 'module', module: 'controls', recordId: id })}
            onEmpty={() => onNavigate({ type: 'module', module: 'controls' })}
          />
        ) : null}
        {overlay.kind === 'evidence' && item ? (
          <ListNav
            items={item.evidenceIds.length ? item.evidenceIds.map((id) => ({ id, title: titleOf(data.evidence, id) })) : [{ id: 'missing', title: 'Current operating evidence is missing' }]}
            empty="Current operating evidence is missing."
            onOpen={(id) => {
              if (id === 'missing') onNavigate({ type: 'upload' })
              else onNavigate({ type: 'module', module: 'evidence', recordId: id })
            }}
            onEmpty={() => onNavigate({ type: 'upload' })}
          />
        ) : null}
        {overlay.kind === 'risks' && item ? (
          <ListNav
            items={item.riskIds.map((id) => ({ id, title: titleOf(data.risks, id) }))}
            empty="No connected risk is mapped yet."
            onOpen={(id) => onNavigate({ type: 'module', module: 'risks', recordId: id })}
            onEmpty={() => onNavigate({ type: 'module', module: 'risks' })}
          />
        ) : null}
        {overlay.kind === 'action' && item ? (
          <div className="wx-blocks">
            <p className="wx-lede">{item.nextAction}</p>
            <p className="wx-muted">{item.owner} · due {formatDate(item.dueDate)}</p>
            <div className="wx-toolbar">
              {item.overall === 'unverifiable' && item.id.startsWith('obl-') && item.controlIds.includes('ctl-005') ? (
                <button type="button" className="wx-btn primary" onClick={() => onNavigate({ type: 'upload' })}>Upload current assessments</button>
              ) : (
                <button type="button" className="wx-btn primary" onClick={() => onNavigate({ type: 'module', module: 'evidence', recordId: item.evidenceIds[0] ?? null })}>Open evidence</button>
              )}
              <button type="button" className="wx-btn" onClick={() => onAskNox(`What should the owner do next for ${item.title}?`)}>Ask Nox</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function itemMatch(row: ObligationRecord, overlay: Overlay) {
  return 'obligationId' in overlay && row.id === overlay.obligationId
}

function ListNav({
  items,
  onOpen,
  empty,
  onEmpty,
}: {
  items: { id: string; title: string }[]
  onOpen: (id: string) => void
  empty: string
  onEmpty: () => void
}) {
  if (!items.length) {
    return (
      <div className="wx-empty">
        <strong>{empty}</strong>
        <button type="button" className="wx-btn" onClick={onEmpty}>Open related records</button>
      </div>
    )
  }
  return (
    <ul className="wx-list">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" onClick={() => onOpen(item.id)}><span>{item.title}</span><b>Open</b></button>
        </li>
      ))}
    </ul>
  )
}
