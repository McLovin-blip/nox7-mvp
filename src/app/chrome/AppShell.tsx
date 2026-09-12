import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Owl } from '../brand/Brand.tsx'
import { personInitials } from '../mock/data.ts'
import type { HubNotification } from '../mock/hubModel.ts'
import type { ModuleId } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import './chrome.css'

export function AppShell({
  module,
  onModule,
  onToggleAi,
  onNotification,
  children,
}: {
  module: ModuleId
  onModule: (id: ModuleId) => void
  onToggleAi: () => void
  onNotification: (item: HubNotification) => void
  children: ReactNode
}) {
  return (
    <div className="shell">
      <Sidebar module={module} onModule={onModule} />
      <div className="shell-main">
        <TopBar onToggleAi={onToggleAi} onNotification={onNotification} />
        <MobileNav module={module} onModule={onModule} />
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

function MobileNav({
  module,
  onModule,
}: {
  module: ModuleId
  onModule: (id: ModuleId) => void
}) {
  const { view } = useSession()
  return (
    <nav className="mobile-nav" aria-label="Product">
      {view.nav.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={module === item.id ? 'page' : undefined}
          onClick={() => onModule(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function TopBar({
  onToggleAi,
  onNotification,
}: {
  onToggleAi: () => void
  onNotification: (item: HubNotification) => void
}) {
  const { view } = useSession()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="top">
      <div className="top-org">
        <strong>{view.organisation.name}</strong>
        <span>
          {view.currentUser.name}, {view.currentUser.role} · {view.hub.reviewLine}
        </span>
      </div>
      <div className="top-meta">
        <span className="top-chip">Reporting period · {view.reportingPeriod}</span>
        <div className="note-wrap" ref={wrap}>
          <button
            className="note-btn"
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={`Notifications, ${view.hub.notifications.length} items`}
            onClick={() => setOpen((value) => !value)}
          >
            Notifications
            <b>{view.hub.notifications.length}</b>
          </button>
          {open ? (
            <div className="note-menu" role="menu">
              {view.hub.notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onNotification(item)
                  }}
                >
                  <strong>{item.title}</strong>
                  <em>{item.body}</em>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button className="ask" type="button" onClick={onToggleAi}>
          Ask Nox AI
          <kbd>⌘K</kbd>
        </button>
      </div>
    </header>
  )
}
