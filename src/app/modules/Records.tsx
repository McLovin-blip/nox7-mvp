import type { ReactNode } from 'react'
import type { RecordRow, Tone } from '../mock/types.ts'
import './modules.css'

export function ModuleFrame({
  kicker,
  title,
  lede,
  actions,
  children,
}: {
  kicker: string
  title: string
  lede: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mod">
      <header className="mod-head">
        <div>
          <p className="mod-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="mod-lede">{lede}</p>
        </div>
        {actions}
      </header>
      {children}
    </div>
  )
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <i className={`pill ${tone}`}>{children}</i>
}

export function RecordList({
  rows,
  selectedId,
  onSelect,
}: {
  rows: RecordRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selected = rows.find((item) => item.id === selectedId) ?? rows[0]
  return (
    <div className="mod-split">
      <div className="mod-list">
        {rows.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mod-row${selected?.id === item.id ? ' on' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span>
              <strong>{item.title}</strong>
              <em>{item.summary}</em>
              <small>{item.owner}</small>
            </span>
            <Pill tone={item.tone}>{item.status}</Pill>
          </button>
        ))}
      </div>
      {selected ? (
        <section className="mod-detail">
          <header>
            <span>{selected.kind}</span>
            <Pill tone={selected.tone}>{selected.status}</Pill>
          </header>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
          <p>{selected.owner}</p>
          <small>Record id is secondary metadata · {selected.id}</small>
          <ul className="mod-n">
            {selected.neighbours.map((item) => (
              <li key={`${item.label}-${item.title}`}>
                <em>{item.label}</em>
                <strong>{item.title}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
