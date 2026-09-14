import { useEffect, useMemo, useRef, useState } from 'react'
import { data } from '../mock/data.ts'
import { ModuleFrame, Pill as LegacyPill } from '../modules/Records.tsx'
import '../modules/modules.css'
import { useSession } from '../state/SessionProvider.tsx'
import {
  attentionEvidence,
  buildEvidenceBriefing,
  buildEvidenceRecords,
  clearEvidenceChip,
  controlOptions,
  defaultEvidenceFilters,
  describeEvidenceDrill,
  evidenceChips,
  evidenceIndicators,
  filterEvidence,
  formatDate,
  hasEvidenceFilters,
  peopleOptions,
  periodLabel,
  reuseRows,
  statusLabel,
  toneOf,
  type EvidenceFilters,
  type EvidenceNavigate,
  type EvidenceRecord,
} from './evidenceModel.ts'
import '../workspace.css'
import { organisation, titleOf } from '../mock/data.ts'

type Overlay =
  | { kind: 'none' }
  | { kind: 'owner'; personId: string }
  | { kind: 'controls'; evidenceId: string }
  | { kind: 'obligations'; evidenceId: string }
  | { kind: 'risks'; evidenceId: string }

function Pill({ tone, children }: { tone: 'ok' | 'watch' | 'bad'; children: string }) {
  return <span className={`wx-pill ${tone}`}>{children}</span>
}

export function EvidenceModule({
  selectedId,
  onSelect,
  onApproved,
  onNavigate,
  onAskNox,
  onDrillContextChange,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onApproved: () => void
  onNavigate?: (target: EvidenceNavigate) => void
  onAskNox?: (prompt?: string) => void
  onDrillContextChange?: (context: { label: string; questions: string[] } | null) => void
}) {
  const { view, phase, uploads, startUpload, setMetadata, approve, reject, position } = useSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<EvidenceFilters>(defaultEvidenceFilters())
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' })

  const records = useMemo(() => buildEvidenceRecords(position), [position])
  const visible = useMemo(() => filterEvidence(records, filters), [records, filters])
  const indicators = useMemo(() => evidenceIndicators(records), [records])
  const briefing = useMemo(() => buildEvidenceBriefing(records, position), [records, position])
  const attention = useMemo(() => attentionEvidence(visible.length ? visible : records), [visible, records])
  const reuse = useMemo(() => reuseRows(visible), [visible])
  const chips = useMemo(() => evidenceChips(filters), [filters])
  const drill = useMemo(() => describeEvidenceDrill(filters), [filters])
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

  const patch = (next: Partial<EvidenceFilters>, scroll = false) => {
    setFilters((current) => ({ ...current, ...next }))
    onSelect(null)
    if (scroll) window.requestAnimationFrame(() => document.getElementById('evidence-inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const go = (target: EvidenceNavigate) => {
    if (target.type === 'evidence') {
      onSelect(target.evidenceId)
      return
    }
    if (target.type === 'upload') {
      fileRef.current?.click()
      return
    }
    onNavigate?.(target)
  }

  if (phase === 'processing' || phase === 'review') {
    return (
      <ModuleFrame
        kicker="Evidence"
        title={phase === 'processing' ? 'Processing assessments' : 'Review suggested mappings'}
        lede={
          phase === 'processing'
            ? 'Files are being uploaded, processed and indexed. Nothing in the organisation position changes yet.'
            : 'Nox AI has proposed classification and mappings. Approve to update Hub, Regulatory, Controls, Risks, Reports and Activity. Reject leaves the position unchanged.'
        }
      >
        <div className="mod" style={{ padding: 0, gap: 10 }}>
          {uploads.map((item) => (
            <article key={item.id} className="file">
              <header>
                <div>
                  <strong>{item.filename}</strong>
                  <em style={{ display: 'block', color: 'var(--text-2)', fontStyle: 'normal', fontSize: 12 }}>{item.stage}</em>
                </div>
                <LegacyPill tone={item.outcome === 'success' ? 'assured' : item.outcome === 'duplicate' ? 'partial' : 'attention'}>
                  {item.outcome === 'success' ? 'Ready' : item.outcome === 'duplicate' ? 'Duplicate' : 'Metadata'}
                </LegacyPill>
              </header>
              {phase === 'processing' ? (
                <i className="bar">
                  <b style={{ width: `${item.progress}%` }} />
                </i>
              ) : null}
              {phase === 'review' && item.outcome === 'success' ? (
                <>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Suggested classification · {item.classification}</p>
                  <div className="chips">
                    {item.controlTitles.map((title) => (
                      <span key={title}>{title}</span>
                    ))}
                    {item.obligationTitles.map((title) => (
                      <span key={title}>{title}</span>
                    ))}
                  </div>
                </>
              ) : null}
              {phase === 'review' && item.outcome === 'duplicate' ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Duplicate of {item.duplicateOfTitle}. Not used to close the gap.</p>
              ) : null}
              {phase === 'review' && item.outcome === 'missing_metadata' ? (
                <>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Owner and review date are missing. Complete them to include this note, or leave it out of the approval.</p>
                  <div className="meta-fields">
                    <label>
                      Owner
                      <select value={item.owner} onChange={(event) => setMetadata(item.id, 'owner', event.target.value)}>
                        <option value="">Select</option>
                        {data.people.map((person) => (
                          <option key={person.id} value={person.name}>{person.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Review date
                      <input type="date" value={item.reviewDate} onChange={(event) => setMetadata(item.id, 'reviewDate', event.target.value)} />
                    </label>
                  </div>
                </>
              ) : null}
            </article>
          ))}
          {phase === 'review' ? (
            <div className="row-actions">
              <button className="primary" type="button" onClick={() => { approve(); onApproved() }}>Approve mappings</button>
              <button className="danger" type="button" onClick={reject}>Reject</button>
            </div>
          ) : null}
        </div>
      </ModuleFrame>
    )
  }

  if (selected) {
    return (
      <>
        <EvidenceDetail
          item={selected}
          onBack={() => onSelect(null)}
          onAskNox={(prompt) => onAskNox?.(prompt)}
          onNavigate={go}
          onOwner={() => setOverlay({ kind: 'owner', personId: selected.ownerId })}
          onUpload={() => fileRef.current?.click()}
        />
        <input ref={fileRef} type="file" multiple accept=".pdf,.zip,.docx,.doc" hidden onChange={(event) => { if (event.target.files && event.target.files.length > 0) startUpload(); event.target.value = '' }} />
        <EvidenceOverlay overlay={overlay} records={records} onClose={() => setOverlay({ kind: 'none' })} onNavigate={go} onFilter={(next) => { setOverlay({ kind: 'none' }); patch(next, true) }} onAskNox={(prompt) => onAskNox?.(prompt)} />
      </>
    )
  }

  return (
    <div className="wx-page">
      <header className="wx-page-head">
        <p className="wx-kicker">Evidence</p>
        <h1>Know which evidence you can rely on.</h1>
        <p className="wx-lede">Current, missing, expiring and conflicting packs are different problems. A policy on file does not replace operating evidence.</p>
        <div className="wx-meta">
          <span>{organisation.name}</span>
          <span>{periodLabel}</span>
          <span>{view.position === 'after' ? 'Assessments approved' : 'Assessments still missing'}</span>
        </div>
        <div className="wx-toolbar">
          <input className="wx-search" value={filters.query} onChange={(event) => patch({ query: event.target.value }, true)} placeholder="Search evidence, owners, files…" aria-label="Search evidence" />
          <button type="button" className="wx-btn" onClick={() => onAskNox?.(drill.questions[0])}>Ask Nox</button>
          {position === 'before' ? (
            <button type="button" className="wx-btn primary" onClick={() => fileRef.current?.click()}>Upload assessments</button>
          ) : null}
        </div>
      </header>
      <input ref={fileRef} type="file" multiple accept=".pdf,.zip,.docx,.doc" hidden onChange={(event) => { if (event.target.files && event.target.files.length > 0) startUpload(); event.target.value = '' }} />

      <div className="wx-kpis">
        {indicators.map((item) => (
          <button key={item.id} type="button" className={`wx-kpi${item.id === 'missing' ? ' is-bad' : ''}${item.id === 'attention' ? ' is-warn' : ''}${(item.id === 'attention' && filters.attentionOnly) || (item.filter.status && item.filter.status !== 'all' && filters.status === item.filter.status) ? ' is-active' : ''}`} onClick={() => patch({ ...defaultEvidenceFilters(), ...item.filter }, true)}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.context}</em>
          </button>
        ))}
      </div>

      <section className="wx-briefing">
        <header className="wx-section-head">
          <div>
            <p className="wx-kicker">Nox AI evidence briefing</p>
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
                  <button type="button" onClick={() => {
                    if (fact.citationId === 'ev-missing-supplier-2026') go({ type: 'upload' })
                    else go({ type: 'evidence', evidenceId: fact.citationId })
                  }}>{fact.text}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Nox AI interpretation</h3>
            <button type="button" className="wx-interpret" onClick={() => onAskNox?.(briefing.askPrompt)}>{briefing.interpretation}</button>
            <h3>Recommended action</h3>
            <p className="wx-lede">{briefing.recommendedAction}</p>
            <p className="wx-muted">{briefing.owner} · {briefing.approval}</p>
            <div className="wx-toolbar">
              {position === 'before' ? (
                <button type="button" className="wx-btn primary" onClick={() => fileRef.current?.click()}>Upload current assessments</button>
              ) : (
                <button type="button" className="wx-btn primary" onClick={() => onSelect(attention[0]?.id ?? 'ev-bc-test')}>Open priority evidence</button>
              )}
              <button type="button" className="wx-btn" onClick={() => onAskNox?.(briefing.askPrompt)}>Ask Nox</button>
            </div>
          </div>
        </div>
      </section>

      <section className="wx-card">
        <header>
          <h2>Evidence requiring attention</h2>
          <p>Missing is not the same as expired, conflicting or unowned.</p>
        </header>
        {attention.length ? (
          <ul className="wx-list">
            {attention.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => (item.synthetic ? go({ type: 'upload' }) : onSelect(item.id))}>
                  <span>{item.title}<em className="wx-muted"> · {item.summary}</em></span>
                  <Pill tone={toneOf(item.status)}>{statusLabel(item.status)}</Pill>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="wx-empty"><strong>No evidence requires attention in this view.</strong></div>
        )}
      </section>

      <section className="wx-card">
        <header>
          <h2>Most reused evidence</h2>
          <p>Packs mapped to more than one control or obligation.</p>
        </header>
        {reuse.length ? (
          <ul className="wx-list">
            {reuse.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onSelect(item.id)}>
                  <span>{item.title}<em className="wx-muted"> · {item.controlIds.length} controls · {item.obligationIds.length} obligations</em></span>
                  <b>Open</b>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="wx-empty"><strong>No reused packs in this view.</strong></div>
        )}
      </section>

      <section className="wx-card" id="evidence-inventory">
        <header className="wx-section-head">
          <div>
            <h2>Evidence catalogue</h2>
            <p>Showing {visible.length} of {records.length}</p>
          </div>
          {hasEvidenceFilters(filters) ? <button type="button" className="wx-ghost" onClick={() => patch(defaultEvidenceFilters())}>Clear filters</button> : null}
        </header>
        {chips.length ? (
          <div className="wx-chip-row">
            {chips.map((chip) => (
              <button key={`${chip.key}-${chip.valueLabel}`} type="button" className="wx-chip is-active" onClick={() => patch(clearEvidenceChip(filters, chip.key))}>
                {chip.label}: {chip.valueLabel} ×
              </button>
            ))}
          </div>
        ) : null}
        <div className="wx-toolbar">
          <select value={filters.status} onChange={(event) => patch({ status: event.target.value as EvidenceFilters['status'] })} aria-label="Evidence status">
            <option value="all">All conditions</option>
            <option value="current">Current</option>
            <option value="missing">Missing</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
            <option value="conflicting">Conflicting</option>
            <option value="awaiting-approval">Awaiting approval</option>
            <option value="duplicate">Duplicate</option>
            <option value="no-owner">No owner</option>
            <option value="superseded">Superseded</option>
          </select>
          <select value={filters.ownerId} onChange={(event) => patch({ ownerId: event.target.value })} aria-label="Owner">
            <option value="all">All owners</option>
            {peopleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={filters.controlId} onChange={(event) => patch({ controlId: event.target.value })} aria-label="Control">
            <option value="all">All controls</option>
            {controlOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <select value={filters.usedBy} onChange={(event) => patch({ usedBy: event.target.value as EvidenceFilters['usedBy'] })} aria-label="Used by">
            <option value="all">Used by anything</option>
            <option value="controls">Used by controls</option>
            <option value="obligations">Used by obligations</option>
            <option value="risks">Used by risks</option>
            <option value="unused">Unused</option>
          </select>
        </div>
        {visible.length === 0 ? (
          <div className="wx-empty">
            <strong>No evidence matches these filters</strong>
            <button type="button" className="wx-btn" onClick={() => patch(defaultEvidenceFilters())}>Clear filters</button>
          </div>
        ) : (
          <div className="wx-table-wrap">
            <table className="wx-table">
              <thead>
                <tr>
                  <th>Evidence</th>
                  <th>Health</th>
                  <th>Owner</th>
                  <th>Controls</th>
                  <th>Obligations</th>
                  <th>Risks</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td><button type="button" onClick={() => (item.synthetic ? go({ type: 'upload' }) : onSelect(item.id))}>{item.title}</button></td>
                    <td><button type="button" onClick={() => patch({ status: item.status }, true)}><Pill tone={toneOf(item.status)}>{statusLabel(item.status)}</Pill></button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'owner', personId: item.ownerId })}>{item.owner}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'controls', evidenceId: item.id })}>{item.controlIds.length}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'obligations', evidenceId: item.id })}>{item.obligationIds.length}</button></td>
                    <td><button type="button" onClick={() => setOverlay({ kind: 'risks', evidenceId: item.id })}>{item.riskIds.length}</button></td>
                    <td>{item.date ? formatDate(item.date) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <EvidenceOverlay overlay={overlay} records={records} onClose={() => setOverlay({ kind: 'none' })} onNavigate={go} onFilter={(next) => { setOverlay({ kind: 'none' }); patch(next, true) }} onAskNox={(prompt) => onAskNox?.(prompt)} />
    </div>
  )
}

function EvidenceDetail({
  item,
  onBack,
  onAskNox,
  onNavigate,
  onOwner,
  onUpload,
}: {
  item: EvidenceRecord
  onBack: () => void
  onAskNox: (prompt?: string) => void
  onNavigate: (target: EvidenceNavigate) => void
  onOwner: () => void
  onUpload: () => void
}) {
  return (
    <div className="wx-detail">
      <div className="wx-crumb">
        <button type="button" onClick={onBack}>Evidence</button>
        <span>/</span>
        <strong>{item.title}</strong>
      </div>
      <header className="wx-detail-head">
        <p className="wx-kicker">{item.fileType} · {item.version}</p>
        <h1>{item.title}</h1>
        <p className="wx-lede">{item.summary}</p>
        <div className="wx-meta">
          <Pill tone={toneOf(item.status)}>{statusLabel(item.status)}</Pill>
          <span>{item.owner}</span>
        </div>
        <div className="wx-toolbar">
          <button type="button" className="wx-ghost" onClick={onBack}>Back</button>
          <button type="button" className="wx-btn" onClick={() => onAskNox(`Why does ${item.title} matter?`)}>Ask Nox</button>
          {item.synthetic ? <button type="button" className="wx-btn primary" onClick={onUpload}>Upload this pack</button> : null}
        </div>
      </header>
      <section className="wx-card">
        <header><h2>Where this evidence is used</h2></header>
        <div className="wx-chain">
          <button type="button" onClick={() => onNavigate({ type: 'module', module: 'controls', recordId: item.controlIds[0] ?? null })}>{item.controlIds.length} controls</button>
          <em>→</em>
          <button type="button" onClick={() => onNavigate({ type: 'module', module: 'regulatory', recordId: item.obligationIds[0] ?? null })}>{item.obligationIds.length} obligations</button>
          <em>→</em>
          <button type="button" onClick={() => onNavigate({ type: 'module', module: 'risks', recordId: item.riskIds[0] ?? null })}>{item.riskIds.length} risks</button>
        </div>
      </section>
      <div className="wx-split two">
        <section className="wx-card">
          <header><h2>Controls</h2></header>
          <ul className="wx-list">
            {item.controlIds.length ? item.controlIds.map((id) => (
              <li key={id}><button type="button" onClick={() => onNavigate({ type: 'module', module: 'controls', recordId: id })}><span>{titleOf(data.controls, id)}</span><b>Open</b></button></li>
            )) : <li><button type="button" onClick={() => onNavigate({ type: 'module', module: 'controls' })}><span>Not mapped to a control</span><b>Open controls</b></button></li>}
          </ul>
        </section>
        <section className="wx-card">
          <header><h2>Obligations</h2></header>
          <ul className="wx-list">
            {item.obligationIds.length ? item.obligationIds.map((id) => (
              <li key={id}><button type="button" onClick={() => onNavigate({ type: 'module', module: 'regulatory', recordId: id })}><span>{titleOf(data.obligations, id)}</span><b>Open</b></button></li>
            )) : <li><button type="button" onClick={() => onNavigate({ type: 'module', module: 'regulatory' })}><span>Not mapped to an obligation</span><b>Open regulatory</b></button></li>}
          </ul>
        </section>
      </div>
      <section className="wx-card">
        <header><h2>Accountability</h2></header>
        <dl className="wx-dl">
          <dt>Owner</dt>
          <dd><button type="button" className="wx-linkish" onClick={onOwner}>{item.owner}{item.ownerRole ? `, ${item.ownerRole}` : ''}</button></dd>
          <dt>Date</dt><dd>{item.date ? formatDate(item.date) : '—'}</dd>
          <dt>Type</dt><dd>{item.fileType}</dd>
        </dl>
      </section>
    </div>
  )
}

function EvidenceOverlay({
  overlay,
  records,
  onClose,
  onNavigate,
  onFilter,
  onAskNox,
}: {
  overlay: Overlay
  records: EvidenceRecord[]
  onClose: () => void
  onNavigate: (target: EvidenceNavigate) => void
  onFilter: (next: Partial<EvidenceFilters>) => void
  onAskNox: (prompt?: string) => void
}) {
  if (overlay.kind === 'none') return null
  const item = 'evidenceId' in overlay ? records.find((row) => row.id === overlay.evidenceId) : null
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
            <p className="wx-lede">Filter the catalogue to evidence owned by {person.name}.</p>
            <button type="button" className="wx-btn primary" onClick={() => onFilter({ ownerId: person.id })}>Show their evidence</button>
            <button type="button" className="wx-btn" onClick={() => onAskNox(`What should ${person.name} do next?`)}>Ask Nox</button>
          </div>
        ) : null}
        {overlay.kind === 'controls' && item ? (
          <MappedList
            items={item.controlIds.map((id) => ({ id, title: titleOf(data.controls, id) }))}
            empty="This pack is not mapped to a control."
            onOpen={(id) => onNavigate({ type: 'module', module: 'controls', recordId: id })}
            onEmpty={() => onNavigate({ type: 'module', module: 'controls' })}
          />
        ) : null}
        {overlay.kind === 'obligations' && item ? (
          <MappedList
            items={item.obligationIds.map((id) => ({ id, title: titleOf(data.obligations, id) }))}
            empty="This pack is not mapped to an obligation."
            onOpen={(id) => onNavigate({ type: 'module', module: 'regulatory', recordId: id })}
            onEmpty={() => onNavigate({ type: 'module', module: 'regulatory' })}
          />
        ) : null}
        {overlay.kind === 'risks' && item ? (
          <MappedList
            items={item.riskIds.map((id) => ({ id, title: titleOf(data.risks, id) }))}
            empty="This pack is not mapped to a risk."
            onOpen={(id) => onNavigate({ type: 'module', module: 'risks', recordId: id })}
            onEmpty={() => onNavigate({ type: 'module', module: 'risks' })}
          />
        ) : null}
      </div>
    </div>
  )
}

function MappedList({
  items,
  empty,
  onOpen,
  onEmpty,
}: {
  items: { id: string; title: string }[]
  empty: string
  onOpen: (id: string) => void
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
        <li key={item.id}><button type="button" onClick={() => onOpen(item.id)}><span>{item.title}</span><b>Open</b></button></li>
      ))}
    </ul>
  )
}
