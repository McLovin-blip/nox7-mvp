import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Owl } from '../brand/Brand.tsx'
import { personInitials } from '../mock/data.ts'
import type { HubNotification } from '../mock/hubModel.ts'
import type { ModuleId, PositionState } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'
import { useTheme } from '../state/ThemeProvider.tsx'
import { GlobalSearch } from './GlobalSearch.tsx'
import type { GlobalSearchResult } from './globalSearch.ts'
import './chrome.css'

const SIDEBAR_STORAGE_KEY = 'nox7.sidebarCollapsed'
const HOVER_OPEN_DELAY_MS = 120
const HOVER_CLOSE_DELAY_MS = 180

function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
}

export function AppShell({
  module,
  onModule,
  onNotification,
  onSearchResult,
  aiOpen = false,
  ai,
  children,
}: {
  module: ModuleId
  onModule: (id: ModuleId) => void
  onNotification: (item: HubNotification) => void
  onSearchResult: (result: { module: ModuleId; id: string; type: GlobalSearchResult['type'] }) => void
  aiOpen?: boolean
  ai?: ReactNode
  children: ReactNode
}) {
  const [collapsedPreferred, setCollapsedPreferred] = useState(() => readSidebarCollapsed())
  const [peeking, setPeeking] = useState(false)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)

  const clearHoverTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current)
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }

  useEffect(() => () => clearHoverTimers(), [])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsedPreferred ? '1' : '0')
  }, [collapsedPreferred])

  const toggleCollapsed = () => {
    clearHoverTimers()
    setPeeking(false)
    setCollapsedPreferred((value) => !value)
  }

  const onRailEnter = () => {
    if (!collapsedPreferred) return
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    openTimer.current = window.setTimeout(() => setPeeking(true), HOVER_OPEN_DELAY_MS)
  }

  const onRailLeave = () => {
    if (!collapsedPreferred) return
    if (openTimer.current) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    closeTimer.current = window.setTimeout(() => setPeeking(false), HOVER_CLOSE_DELAY_MS)
  }

  const shellClass = [
    'shell',
    aiOpen ? 'is-ai-open' : '',
    collapsedPreferred ? 'is-sidebar-collapsed' : '',
    collapsedPreferred && peeking ? 'is-sidebar-peek' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <div className="rail-slot">
        <Sidebar
          module={module}
          onModule={onModule}
          collapsed={collapsedPreferred}
          peeking={peeking}
          onToggle={toggleCollapsed}
          onPointerEnter={onRailEnter}
          onPointerLeave={onRailLeave}
        />
      </div>
      <div className="shell-main">
        <TopBar onNotification={onNotification} onSearchResult={onSearchResult} />
        <MobileNav module={module} onModule={onModule} />
        <div className="shell-body">{children}</div>
      </div>
      {ai}
    </div>
  )
}

function NavIcon({ id }: { id: ModuleId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'hub':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'connect':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="2.4" />
          <circle cx="18" cy="6" r="2.4" />
          <circle cx="18" cy="18" r="2.4" />
          <path d="M8.2 11.2 15.6 7.2" />
          <path d="M8.2 12.8 15.6 16.8" />
        </svg>
      )
    case 'risks':
      return (
        <svg {...common}>
          <path d="M12 3 21 19H3L12 3Z" />
          <path d="M12 10v4" />
          <path d="M12 17h.01" />
        </svg>
      )
    case 'controls':
      return (
        <svg {...common}>
          <path d="M12 3 19 7v5c0 4.4-2.9 7.8-7 9-4.1-1.2-7-4.6-7-9V7l7-4Z" />
          <path d="m9.5 12 1.8 1.8 3.7-3.8" />
        </svg>
      )
    case 'regulatory':
      return (
        <svg {...common}>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2Z" />
          <path d="M10 9h4M10 13h4" />
        </svg>
      )
    case 'evidence':
      return (
        <svg {...common}>
          <path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v4h4M10 12h6M10 16h6" />
        </svg>
      )
    case 'reports':
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-4" />
          <path d="M12 15V8" />
          <path d="M16 15v-7" />
        </svg>
      )
    case 'activity':
      return (
        <svg {...common}>
          <path d="M4 12h3l2.5-6 3 12L16 9h4" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
        </svg>
      )
  }
}

function Sidebar({
  module,
  onModule,
  collapsed,
  peeking,
  onToggle,
  onPointerEnter,
  onPointerLeave,
}: {
  module: ModuleId
  onModule: (id: ModuleId) => void
  collapsed: boolean
  peeking: boolean
  onToggle: () => void
  onPointerEnter: () => void
  onPointerLeave: () => void
}) {
  const { view } = useSession()
  const primary = view.nav.filter((item) => item.id === 'hub' || item.id === 'connect')
  const modules = view.nav.filter((item) => item.id !== 'hub' && item.id !== 'connect')
  const expandedVisual = !collapsed || peeking

  return (
    <aside
      className={`rail${!expandedVisual ? ' is-icon-only' : ''}${peeking ? ' is-peeking' : ''}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="rail-brand">
        <Owl className="rail-owl" />
        <span className="rail-word">
          Nox<em>7</em>
        </span>
        <button
          type="button"
          className="rail-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {collapsed ? (
              <path d="M9 6l6 6-6 6M4 4v16" />
            ) : (
              <path d="M15 6l-6 6 6 6M20 4v16" />
            )}
          </svg>
        </button>
      </div>

      <nav className="rail-nav" aria-label="Product">
        <p className="rail-label">Workspace</p>
        {primary.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rail-item${item.id === 'connect' ? ' rail-item-emphasis' : ''}`}
            aria-current={module === item.id ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={() => onModule(item.id)}
          >
            <span className="rail-ico">
              <NavIcon id={item.id} />
            </span>
            <span className="rail-copy">{item.label}</span>
            {item.badge ? <b>{item.badge}</b> : null}
          </button>
        ))}

        <p className="rail-label">Modules</p>
        {modules.map((item) => (
          <button
            key={item.id}
            type="button"
            className="rail-item"
            aria-current={module === item.id ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={() => onModule(item.id)}
          >
            <span className="rail-ico">
              <NavIcon id={item.id} />
            </span>
            <span className="rail-copy">{item.label}</span>
            {item.badge ? <b>{item.badge}</b> : null}
          </button>
        ))}
      </nav>

      <div className="rail-foot">
        <button type="button" className="rail-item rail-item-quiet" disabled title="Coming soon" aria-label="Settings">
          <span className="rail-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </span>
          <span className="rail-copy">Settings</span>
        </button>
        <button type="button" className="rail-item rail-item-quiet" disabled title="Coming soon" aria-label="Help">
          <span className="rail-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
              <path d="M12 17h.01" />
            </svg>
          </span>
          <span className="rail-copy">Help</span>
        </button>
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
  onSearchResult,
}: {
  onNotification: (item: HubNotification) => void
  onSearchResult: (result: { module: ModuleId; id: string; type: GlobalSearchResult['type'] }) => void
}) {
  const { view, position } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [notesOpen, setNotesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notesRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!notesRef.current?.contains(event.target as Node)) setNotesOpen(false)
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotesOpen(false)
        setProfileOpen(false)
      }
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
      <GlobalSearch
        position={position as PositionState}
        onOpenResult={(result) => {
          setNotesOpen(false)
          setProfileOpen(false)
          onSearchResult(result)
        }}
      />

      <div className="top-meta">
        <span className="top-chip">{view.organisation.name}</span>
        <span className="top-chip subtle">Reporting · {view.reportingPeriod}</span>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>

        <div className="note-wrap" ref={notesRef}>
          <button
            className="note-btn"
            type="button"
            aria-expanded={notesOpen}
            aria-haspopup="true"
            aria-label={`Notifications, ${view.hub.notifications.length} items`}
            onClick={() => {
              setProfileOpen(false)
              setNotesOpen((value) => !value)
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
            <b>{view.hub.notifications.length}</b>
          </button>
          {notesOpen ? (
            <div className="note-menu" role="menu">
              {view.hub.notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setNotesOpen(false)
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

        <span className="top-divider" aria-hidden="true" />

        <div className="profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="profile-btn"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            onClick={() => {
              setNotesOpen(false)
              setProfileOpen((value) => !value)
            }}
          >
            <span className="profile-av">{personInitials(view.currentUser.name)}</span>
            <span className="profile-copy">
              <strong>{view.currentUser.name}</strong>
              <em>{view.currentUser.role}</em>
            </span>
            <span className="profile-caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {profileOpen ? (
            <div className="profile-menu" role="menu">
              <button type="button" role="menuitem" disabled>
                Profile
              </button>
              <button type="button" role="menuitem" disabled>
                Preferences
              </button>
              <button type="button" role="menuitem" disabled>
                Settings
              </button>
              <button type="button" role="menuitem" disabled>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
