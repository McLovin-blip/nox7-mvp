import type { HubFocus } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'

export function PositionStrip({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null
  onSelect: (focus: HubFocus, prompt: string) => void
}) {
  const { view } = useSession()
  return (
    <section className="strip" aria-label="Current position">
      {view.hub.indicators.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`strip-card tone-${item.tone}${selectedId === item.id ? ' on' : ''}`}
          aria-pressed={selectedId === item.id}
          aria-label={`${item.label}: ${item.value}. ${item.directionLabel}. ${item.why}`}
          onClick={() =>
            onSelect(
              {
                kind: 'indicator',
                id: item.id,
                title: item.label,
                recordId: item.id === 'gaps' ? 'ctl-supplier-assurance' : undefined,
              },
              item.askPrompt,
            )
          }
        >
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <em className={`dir dir-${item.direction}`}>{item.directionLabel}</em>
          <p>{item.why}</p>
        </button>
      ))}
    </section>
  )
}
