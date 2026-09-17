import { useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

const STORAGE_KEY = 'nox7.tablePageSize'

function readStoredPageSize(): PageSize {
  if (typeof window === 'undefined') return 10
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const n = Number(raw)
  if (PAGE_SIZE_OPTIONS.includes(n as PageSize)) return n as PageSize
  return 10
}

function itemsSignature(items: readonly unknown[]): string {
  return items
    .map((item) => {
      if (item && typeof item === 'object' && 'id' in item) return String((item as { id: string }).id)
      if (item && typeof item === 'object' && 'riskId' in item) return String((item as { riskId: string }).riskId)
      return ''
    })
    .join('|')
}

export function usePagination<T>(items: readonly T[]) {
  const [pageSize, setPageSizeState] = useState<PageSize>(() => readStoredPageSize())
  const [page, setPage] = useState(1)
  const signature = useMemo(() => itemsSignature(items), [items])
  const [itemKey, setItemKey] = useState(signature)

  if (itemKey !== signature) {
    setItemKey(signature)
    setPage(1)
  }

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(itemKey === signature ? page : 1, 1), pageCount)

  if (page !== safePage) {
    setPage(safePage)
  }

  const setPageSize = (next: PageSize) => {
    setPageSizeState(next)
    setPage(1)
    window.localStorage.setItem(STORAGE_KEY, String(next))
  }

  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)

  const pageItems = useMemo(() => {
    const from = (safePage - 1) * pageSize
    return items.slice(from, from + pageSize)
  }, [items, safePage, pageSize])

  return {
    pageItems,
    page: safePage,
    pageSize,
    pageCount,
    total,
    start,
    end,
    setPage,
    setPageSize,
    canPrev: safePage > 1,
    canNext: safePage < pageCount,
  }
}
