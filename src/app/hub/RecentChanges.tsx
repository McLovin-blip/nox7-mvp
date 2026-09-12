import type { HubFocus } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'

export function RecentChanges({
  selectedId,
  onSelect,
  onOpenSource,
}: {
  selectedId?: string | null
  onSelect: (focus: HubFocus, prompt: string) => void
  onOpenSource: (id: string) => void
}) {
  const { view } = useSession()
  return (
    <section className="changes" aria-label="Recent material changes">
      <header>
        <span>Recent material changes</span>
        <small>What moved this period</small>
      </header>
      <ol>
        {view.hub.changes.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`change-row${selectedId === item.id ? ' on' : ''}`}
              aria-pressed={selectedId === item.id}
              onClick={() => {
                onSelect(
                  {
                    kind: 'change',
                    id: item.id,
                    title: item.title,
                    recordId: item.sourceId.startsWith('act-') ? undefined : item.sourceId,
                  },
                  item.askPrompt,
                )
                if (item.sourceId.startsWith('act-')) onOpenSource(item.sourceId)
              }}
            >
              <time>{item.time}</time>
              <strong>{item.title}</strong>
              <em>{item.detail}</em>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
