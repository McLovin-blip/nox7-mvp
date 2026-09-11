import type { ReactNode } from 'react'
import { Owl } from '../brand/Brand.tsx'
import { personInitials } from '../mock/data.ts'
import type { ModuleId } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
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
  const { view } = useSession()
  return (
    <aside className="rail">
      <div className="rail-brand">
        <Owl className="rail-owl" />
        <span className="rail-word">
          Nox<em>7</em>
        </span>
      </div>
      <nav aria-label="Product">
        {view.nav.map((item) => (
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
        <span className="rail-av">{personInitials(view.currentUser.name)}</span>
        <span>
          <strong>{view.currentUser.name}</strong>
          <em>{view.currentUser.role}</em>
        </span>
      </div>
    </aside>
  )
}

function TopBar({ onToggleAi }: { onToggleAi: () => void }) {
  const { view } = useSession()
  return (
    <header className="top">
      <div className="top-org">
        <strong>{view.organisation.name}</strong>
        <span>
          {view.organisation.uiLabel} · {view.organisation.review.name} · {view.organisation.review.daysRemaining} days
        </span>
      </div>
      <div className="top-meta">
        <span className="top-chip">Reporting period · {view.reportingPeriod}</span>
        <button className="ask" type="button" onClick={onToggleAi}>
          Ask Nox AI
          <kbd>⌘K</kbd>
        </button>
      </div>
    </header>
  )
}
