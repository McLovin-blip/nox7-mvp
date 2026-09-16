import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { ModuleId, PositionState } from '../mock/types.ts'
import { searchEstate, type GlobalSearchResult } from './globalSearch.ts'

export function GlobalSearch({
  position,
  onOpenResult,
}: {
  position: PositionState
  onOpenResult: (result: { module: ModuleId; id: string; type: GlobalSearchResult['type'] }) => void
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query.trim()), 120)
    return () => window.clearTimeout(handle)
  }, [query])

  const results = useMemo(() => searchEstate(debounced, position), [debounced, position])
  const boundedIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const showPanel = open && debounced.length > 0

  const selectResult = (result: GlobalSearchResult) => {
    setOpen(false)
    setQuery('')
    setDebounced('')
    onOpenResult({ module: result.module, id: result.id, type: result.type })
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((value) => Math.min(value + 1, Math.max(results.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((value) => Math.max(value - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const hit = results[boundedIndex]
      if (hit) selectResult(hit)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      if (query) {
        setQuery('')
        setDebounced('')
      } else {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
  }

  return (
    <div className={`top-search${showPanel ? ' is-open' : ''}`} role="search" ref={rootRef}>
      <span className="top-search-ico" aria-hidden="true">
        ⌕
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Search across your GRC estate…"
        aria-label="Search across your GRC estate"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showPanel}
        aria-activedescendant={showPanel && results[boundedIndex] ? `${listId}-${boundedIndex}` : undefined}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {query ? (
        <button
          type="button"
          className="top-search-clear"
          aria-label="Clear search"
          onClick={() => {
            setQuery('')
            setDebounced('')
            inputRef.current?.focus()
          }}
        >
          Clear
        </button>
      ) : (
        <kbd>/</kbd>
      )}

      {showPanel ? (
        <div className="global-search-panel" id={listId} role="listbox" aria-label="Search results">
          {results.length === 0 ? (
            <p className="global-search-empty">No results found for “{debounced}”.</p>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === boundedIndex}
                className={`global-search-item${index === boundedIndex ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectResult(result)}
              >
                <span className="global-search-type">{result.typeLabel}</span>
                <span className="global-search-copy">
                  <strong>{result.name}</strong>
                  {result.code ? <em>{result.code}</em> : null}
                  <small>{result.description}</small>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
