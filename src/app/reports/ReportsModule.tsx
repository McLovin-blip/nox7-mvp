import { useMemo } from 'react'
import { ModuleFrame, Pill } from '../modules/Records.tsx'
import '../modules/modules.css'
import { useSession } from '../state/SessionProvider.tsx'
import { riskRatingClass } from '../ui/riskRating.ts'
import { TablePagination } from '../ui/TablePagination.tsx'
import { usePagination } from '../ui/usePagination.ts'

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function ReportsModule({
  selectedId,
  onOpenSource,
}: {
  selectedId: string | null
  onOpenSource: (id: string) => void
}) {
  const { view } = useSession()
  const selected =
    view.reports.find((item) => item.id === selectedId) ??
    view.reports.find((item) => item.primary) ??
    view.reports[0]
  const showPhishing = selected?.preview === 'phishing' || (selected?.primary && selected?.preview !== 'board')
  const showBoard = selected?.preview === 'board'
  const phishing = view.phishingPreview
  const reportPagination = usePagination(view.reports)
  const controlRows = useMemo(() => phishing?.controls ?? [], [phishing])
  const evidenceRows = useMemo(() => phishing?.evidence ?? [], [phishing])
  const controlPagination = usePagination(controlRows)
  const evidencePagination = usePagination(evidenceRows)

  return (
    <ModuleFrame
      kicker="Reports"
      title="Reports"
      lede={`${view.reportingPeriod}. Generated from the current organisation position.`}
    >
      <section className="mod-detail" aria-label="Report catalogue">
        <header>
          <span>Available reports</span>
        </header>
        <ul className="report-list">
          {reportPagination.pageItems.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <em>
                  {item.period} · {item.status}
                </em>
              </div>
              {item.preview ? (
                <button type="button" className="cite" onClick={() => onOpenSource(item.id)}>
                  View Report
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <TablePagination
          page={reportPagination.page}
          pageSize={reportPagination.pageSize}
          pageCount={reportPagination.pageCount}
          total={reportPagination.total}
          start={reportPagination.start}
          end={reportPagination.end}
          canPrev={reportPagination.canPrev}
          canNext={reportPagination.canNext}
          onPage={reportPagination.setPage}
          onPageSize={reportPagination.setPageSize}
        />
      </section>

      {showPhishing && phishing ? (
        <article className="board">
          <span className="mod-kicker">Phishing Risk Summary · {selected?.period}</span>
          <h2>{selected?.title ?? 'Phishing Risk Summary'}</h2>
          <p className="mod-lede">{selected?.description}</p>

          <section className="report-section">
            <h3>Risk assessment</h3>
            <p>
              <button type="button" className="cite" onClick={() => onOpenSource(phishing.risk.id)}>
                {phishing.risk.code}
              </button>{' '}
              {phishing.risk.title}
            </p>
            <p>{phishing.risk.whatCouldHappen}</p>
            <p>
              Inherent <span className={riskRatingClass(phishing.risk.inherentLabel)}>{phishing.risk.inherentLabel}</span>
              {' · '}
              Residual <span className={riskRatingClass(phishing.risk.residualLabel)}>{phishing.risk.residualLabel}</span>
              {' · '}
              {phishing.risk.appetiteLabel}
            </p>
          </section>

          <section className="report-section">
            <h3>Controls</h3>
            <p>{phishing.controlBlurb}</p>
            <ul>
              {controlPagination.pageItems.map((control) => (
                <li key={control.id}>
                  <button type="button" className="cite" onClick={() => onOpenSource(control.id)}>
                    {control.code}
                  </button>{' '}
                  {control.title} — {control.effectivenessLabel}. {control.purpose}
                </li>
              ))}
            </ul>
            <TablePagination
              page={controlPagination.page}
              pageSize={controlPagination.pageSize}
              pageCount={controlPagination.pageCount}
              total={controlPagination.total}
              start={controlPagination.start}
              end={controlPagination.end}
              canPrev={controlPagination.canPrev}
              canNext={controlPagination.canNext}
              onPage={controlPagination.setPage}
              onPageSize={controlPagination.setPageSize}
            />
          </section>

          <section className="report-section">
            <h3>Evidence status / findings</h3>
            <ul>
              {evidencePagination.pageItems.map((item) => (
                <li key={item.id}>
                  <button type="button" className="cite" onClick={() => onOpenSource(item.id)}>
                    {item.code}
                  </button>{' '}
                  {item.title}: {item.resultOrGap}{' '}
                  <Pill tone="assured">{item.statusLabel}</Pill>
                </li>
              ))}
            </ul>
            <TablePagination
              page={evidencePagination.page}
              pageSize={evidencePagination.pageSize}
              pageCount={evidencePagination.pageCount}
              total={evidencePagination.total}
              start={evidencePagination.start}
              end={evidencePagination.end}
              canPrev={evidencePagination.canPrev}
              canNext={evidencePagination.canNext}
              onPage={evidencePagination.setPage}
              onPageSize={evidencePagination.setPageSize}
            />
          </section>

          <section className="report-section">
            <h3>Next action</h3>
            <p>{phishing.nextAction.title}</p>
            <p>
              Owner: {phishing.nextAction.owner} · Due {formatDate(phishing.nextAction.dueDate)} ·{' '}
              {phishing.nextAction.status}
            </p>
          </section>
        </article>
      ) : null}

      {showBoard ? (
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
      ) : null}

      {!showPhishing && !showBoard ? (
        <section className="mod-detail">
          <header>
            <span>Supporting pack</span>
            <Pill tone="partial">Listed</Pill>
          </header>
          <h2>{selected?.title}</h2>
          <p>
            Available for {selected?.period}. Open a report with a preview to see the walkthrough content for this
            organisation position.
          </p>
        </section>
      ) : null}
    </ModuleFrame>
  )
}
