import { ModuleFrame, Pill } from '../modules/Records.tsx'
import '../modules/modules.css'
import { useSession } from '../state/SessionProvider.tsx'

export function ReportsModule({
  selectedId,
  onOpenSource,
}: {
  selectedId: string | null
  onOpenSource: (id: string) => void
}) {
  const { view } = useSession()
  const selected = view.reports.find((item) => item.id === selectedId) ?? view.reports[0]
  const board = selected?.primary

  return (
    <ModuleFrame
      kicker="Reports"
      title={selected?.title ?? 'Reports'}
      lede={`${view.reportingPeriod}. Generated from the current organisation position.`}
    >
      <div className="filters">
        {view.reports.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected?.id === item.id}
            onClick={() => onOpenSource(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      {board ? (
        <article className="board">
          <span className="mod-kicker">{view.board.kicker}</span>
          <h2>{view.board.title}</h2>
          <p className="mod-lede">{view.board.lede}</p>
          <ol>
            {view.board.statements.map((item) => (
              <li key={item.citationId}>
                {item.text}{' '}
                <button type="button" className="cite" onClick={() => onOpenSource(item.citationId)}>
                  Source
                </button>
              </li>
            ))}
          </ol>
          <p className="mod-lede">{view.board.watch}</p>
        </article>
      ) : (
        <section className="mod-detail">
          <header>
            <span>Supporting pack</span>
            <Pill tone="partial">Listed</Pill>
          </header>
          <h2>{selected?.title}</h2>
          <p>
            Available for {selected?.period}. The Board Summary is the polished report for this review. This pack uses
            the same organisation position.
          </p>
        </section>
      )}
    </ModuleFrame>
  )
}
