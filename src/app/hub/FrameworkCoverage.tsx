import type { HubFocus } from '../mock/types.ts'
import { useSession } from '../state/SessionProvider.tsx'

export function FrameworkCoverage({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null
  onSelect: (focus: HubFocus, prompt: string) => void
}) {
  const { view } = useSession()
  return (
    <section className="coverage" aria-label="Framework coverage">
      <header>
        <span>Framework coverage</span>
        <small>International obligations in this review</small>
      </header>
      <div className="coverage-grid">
        {view.hub.frameworks.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`coverage-card${selectedId === item.id ? ' on' : ''}`}
            aria-pressed={selectedId === item.id}
            aria-label={`${item.name}: ${item.coverage} percent. ${item.supported} of ${item.total} obligations supported. ${item.directionLabel}. ${item.materialGap}.`}
            onClick={() =>
              onSelect(
                {
                  kind: 'framework',
                  id: item.id,
                  title: item.name,
                  recordId: item.obligationId,
                },
                item.askPrompt,
              )
            }
          >
            <span>{item.name}</span>
            <strong>{item.coverage}%</strong>
            <em className={`dir dir-${item.direction}`}>{item.directionLabel}</em>
            <p>
              {item.supported}/{item.total} obligations supported
            </p>
            <small>{item.materialGap}</small>
            <i className="bar" aria-hidden="true">
              <b style={{ width: `${item.coverage}%` }} />
            </i>
          </button>
        ))}
      </div>
    </section>
  )
}
