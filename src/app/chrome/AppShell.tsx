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
  onNotification,
  children,
}: {
  module: ModuleId
  onModule: (id: ModuleId) => void
  onNotification: (item: HubNotification) => void
  children: ReactNode
}) {
  return (
    <div className="shell">
      <Sidebar module={module} onModule={onModule} />
      <div className="shell-main">
        <TopBar onNotification={onNotification} />
        <MobileNav module={module} onModule={onModule} />
        <div className="shell-body">{children}</div>
      </div>
    </div>
  )
}


function NavIcon({ id }: { id: ModuleId }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  if (id === 'connect') {
    return (
      <svg {...common}>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.2 11.2 15.5 7.2" />
        <path d="M8.2 12.8 15.5 16.8" />
      </svg>
    )
  }
  if (id === 'hub') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
    </svg>
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
            <span className="rail-ico"><NavIcon id={item.id} /></span><span>{item.label}</span>
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
  onNotification,
}: {
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
      </div>
    </header>
  )
}
