import { PAGE_SIZE_OPTIONS, type PageSize } from './usePagination.ts'
import './pagination.css'

export function TablePagination({
  page,
  pageSize,
  pageCount,
  total,
  start,
  end,
  canPrev,
  canNext,
  onPage,
  onPageSize,
  label = 'Rows per page',
}: {
  page: number
  pageSize: PageSize
  pageCount: number
  total: number
  start: number
  end: number
  canPrev: boolean
  canNext: boolean
  onPage: (page: number) => void
  onPageSize: (size: PageSize) => void
  label?: string
}) {
  if (total === 0) return null

  return (
    <div className="table-pagination" role="navigation" aria-label="Table pagination">
      <label className="table-pagination-size">
        <span>{label}</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value) as PageSize)}
          aria-label={label}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <p className="table-pagination-count">
        Showing {start}–{end} of {total}.
      </p>

      <div className="table-pagination-controls">
        <button type="button" disabled={!canPrev} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="table-pagination-page" aria-live="polite">
          Page {page} of {pageCount}
        </span>
        <button type="button" disabled={!canNext} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
