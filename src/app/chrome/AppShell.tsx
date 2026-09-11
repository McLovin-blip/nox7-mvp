import type { ReactNode } from 'react'
import { Owl } from '../brand/Brand.tsx'
import { currentUser, nav, organisation, personInitials, reportingPeriod } from '../mock/store.ts'
import type { ModuleId } from '../mock/types.ts'
import './chrome.css'

export function AppShell({
  module,
  aiOpen,
  onModule,
  onToggleAi,
  children,
}: {
  module: ModuleId
  aiOpen: boolean
  onModule: (id: ModuleId) => void
  onToggleAi: () => void
  children: ReactNode
}) {
  return (
    <div className={`shell${aiOpen ? '' : ' ai-closed'}`}>
      <Sidebar module={module} onModule={onModule} />
      <div className="shell-main">
        <TopBar onToggleAi={onToggleAi} />
        <div className="shell-body">{children}</div>
      </div>
    </div>
  )
}

function Sidebar({
  module,
  onModule,
}: {
  module: ModuleId
  onModule: (id: ModuleId) => void
}) {
  return (
    <aside className="rail">
      <div className="rail-brand">
        <Owl className="rail-owl" />
        <span className="rail-word">
          Nox<em>7</em>
        </span>
      </div>
      <nav aria-label="Product">
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            className="rail-item"
            aria-current={module === item.id ? 'page' : undefined}
            onClick={() => onModule(item.id)}
          >
            <span>{item.label}</span>
            {item.badge ? <b>{item.badge}</b> : null}
          </button>
        ))}
      </nav>
      <div className="rail-user">
        <span className="rail-av">{personInitials(currentUser.name)}</span>
        <span>
          <strong>{currentUser.name}</strong>
          <em>{currentUser.role}</em>
        </span>
      </div>
    </aside>
  )
}

function TopBar({ onToggleAi }: { onToggleAi: () => void }) {
  return (
    <header className="top">
      <div className="top-org">
        <strong>{organisation.name}</strong>
        <span>
          {organisation.uiLabel} · {organisation.review.name} · {organisation.review.daysRemaining} days
        </span>
      </div>
      <div className="top-meta">
        <span className="top-chip">Reporting period · {reportingPeriod}</span>
        <button className="ask" type="button" onClick={onToggleAi}>
          Ask Nox AI
          <kbd>⌘K</kbd>
        </button>
      </div>
    </header>
  )
}
