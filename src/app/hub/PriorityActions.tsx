import type { HubAction } from '../mock/hubModel.ts'
import type { HubFocus } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'

export function PriorityActions({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null
  onSelect: (action: HubAction, focus: HubFocus) => void
}) {
  const { view } = useSession()
  return (
    <section className="actions" aria-label="Priority actions">
      <header>
        <span>Priority actions</span>
        <small>Maximum three · accountable owners</small>
      </header>
      <ol>
        {view.hub.actions.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={`action-open${item.primary ? ' primary-action' : ''}${selectedId === item.id ? ' on' : ''}`}
              aria-pressed={selectedId === item.id}
              onClick={() =>
                onSelect(item, {
                  kind: 'action',
                  id: item.id,
                  title: item.title,
                  recordId: item.recordId,
                })
              }
            >
              <b>{String(index + 1).padStart(2, '0')}</b>
              <div>
                <strong>{item.title}</strong>
                <em>
                  {item.owner}, {item.ownerRole}
                </em>
                <span className="action-meta">
                  {item.due} · {item.approvalStatus}
                </span>
              </div>
              <small>{item.primary ? 'High impact' : 'Watch'}</small>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
