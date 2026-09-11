import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { data, frameworkName, titleOf, uploadFixtures } from '../mock/data.ts'
import type { ActivityItem, PositionState, UploadItem, UploadOutcome, UploadPhase } from '../mock/types.ts'
import { buildAppView, seedActivity } from '../mock/viewModel.ts'

type Session = {
  position: PositionState
  phase: UploadPhase
  uploads: UploadItem[]
  activity: ActivityItem[]
  startUpload: () => void
  setMetadata: (id: string, field: 'owner' | 'reviewDate', value: string) => void
  toggleInclude: (id: string) => void
  approve: () => void
  reject: () => void
  view: ReturnType<typeof buildAppView>
}

const SessionContext = createContext<Session | null>(null)

function fixtureItems(): UploadItem[] {
  return uploadFixtures.demoFiles.map((file, index) => {
    const controlTitles = (file.suggestedControlIds ?? []).map((id) => titleOf(data.controls, id))
    const obligationTitles = (file.suggestedObligationIds ?? []).map((id) => {
      const obligation = data.obligations.find((item) => item.id === id)
      return obligation ? `${frameworkName(obligation.frameworkId)} · ${obligation.title}` : id
    })
    const duplicateTitle = file.duplicateOf ? titleOf(data.evidence, file.duplicateOf) : undefined
    return {
      id: `upl-${index}`,
      filename: file.filename,
      outcome: file.outcome as UploadOutcome,
      progress: 0,
      stage: 'Queued',
      classification: file.suggestedClassification,
      controlTitles,
      obligationTitles,
      duplicateOfTitle: duplicateTitle,
      missingFields: file.missingFields ?? [],
      owner: '',
      reviewDate: '',
      included: file.outcome === 'success',
    }
  })
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<PositionState>('before')
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>(seedActivity)
  const view = useMemo(() => buildAppView(position), [position])
  const busy = useRef(false)

  const startUpload = useCallback(() => {
    if (busy.current) return
    busy.current = true
    const items = fixtureItems()
    setUploads(items)
    setPhase('processing')
    setActivity((current) => [
      {
        id: `act-upl-${Date.now()}`,
        time: 'Just now',
        actor: 'Omar Haddad',
        title: 'Current assessments uploaded',
        detail: `${items.length} files received and processing.`,
        tone: 'wait',
      },
      ...current,
    ])

    const started = Date.now()
    const tick = () => {
      const elapsed = Date.now() - started
      setUploads((current) =>
        current.map((item, index) => {
          const delay = index * 280
          const local = Math.min(100, Math.max(0, ((elapsed - delay) / 1400) * 100))
          const stage =
            local < 15 ? 'Uploading' : local < 55 ? 'Processing' : local < 100 ? 'Indexing' : labelFor(item)
          return { ...item, progress: Math.round(local), stage }
        }),
      )
      if (elapsed < 1400 + 280 * 3 + 80) {
        window.setTimeout(tick, 80)
      } else {
        setUploads((current) => current.map((item) => ({ ...item, progress: 100, stage: labelFor(item) })))
        setPhase('review')
        setActivity((current) => [
          {
            id: `act-rev-${Date.now()}`,
            time: 'Just now',
            actor: 'Omar Haddad',
            title: 'Waiting for approval',
            detail: 'Suggested mappings are ready. Coverage and risk will not change until Layla Rahman approves.',
            tone: 'wait',
          },
          ...current,
        ])
      }
    }
    window.setTimeout(tick, 80)
  }, [])

  const setMetadata = useCallback((id: string, field: 'owner' | 'reviewDate', value: string) => {
    setUploads((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const next = { ...item, [field]: value }
        const complete = next.owner.trim() && next.reviewDate.trim()
        return { ...next, included: complete ? true : item.included }
      }),
    )
  }, [])

  const toggleInclude = useCallback((id: string) => {
    setUploads((current) => current.map((item) => (item.id === id ? { ...item, included: !item.included } : item)))
  }, [])

  const approve = useCallback(() => {
    busy.current = false
    setPosition('after')
    setPhase('idle')
    setActivity((current) => [
      {
        id: `act-appr-${Date.now()}`,
        time: 'Just now',
        actor: 'Layla Rahman',
        title: 'Current assessments approved',
        detail: 'Supplier assurance is assured. Four frameworks, two risks and the Board Summary now cite the 2026 pack.',
        tone: 'ok',
      },
      ...current.map((item) =>
        item.title === 'Remediation opened' ? { ...item, tone: 'ok' as const, detail: 'Completed.' } : item,
      ),
    ])
  }, [])

  const reject = useCallback(() => {
    busy.current = false
    setPosition('before')
    setPhase('idle')
    setUploads([])
    setActivity((current) => [
      {
        id: `act-rej-${Date.now()}`,
        time: 'Just now',
        actor: 'Layla Rahman',
        title: 'Assessments rejected',
        detail: 'The organisation position is unchanged. Current assessments remain missing.',
        tone: 'warn',
      },
      ...current,
    ])
  }, [])

  const value = useMemo(
    () => ({
      position,
      phase,
      uploads,
      activity,
      startUpload,
      setMetadata,
      toggleInclude,
      approve,
      reject,
      view,
    }),
    [position, phase, uploads, activity, startUpload, setMetadata, toggleInclude, approve, reject, view],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

function labelFor(item: UploadItem) {
  if (item.outcome === 'duplicate') return 'Duplicate found'
  if (item.outcome === 'missing_metadata') return 'Missing metadata'
  return 'Indexed'
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}
