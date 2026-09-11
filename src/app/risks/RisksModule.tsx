import { ModuleFrame, RecordList } from '../modules/Records.tsx'
import { useSession } from '../state/SessionProvider.tsx'

export function RisksModule({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { view } = useSession()
  return (
    <ModuleFrame
      kicker="Risks"
      title="Connected risks"
      lede={
        view.position === 'after'
          ? 'Third-party and regulatory exposure are reduced. Continuity evidence remains a watch item.'
          : 'Third-party assurance and regulatory exposure are elevated by the same missing assessments. Continuity evidence is a watch item, not the primary action.'
      }
    >
      <RecordList rows={view.risks} selectedId={selectedId} onSelect={onSelect} />
    </ModuleFrame>
  )
}
