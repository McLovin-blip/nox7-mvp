import { ModuleFrame, RecordList } from '../modules/Records.tsx'
import { useSession } from '../state/SessionProvider.tsx'

export function ControlsModule({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { view } = useSession()
  return (
    <ModuleFrame
      kicker="Controls"
      title="Control library"
      lede={
        view.position === 'after'
          ? 'Supplier assurance is assured. Other controls remain supported by current evidence.'
          : 'Supplier assurance is partially assured because current assessments are missing. Other controls in this library are assured.'
      }
    >
      <RecordList rows={view.controls} selectedId={selectedId} onSelect={onSelect} />
    </ModuleFrame>
  )
}
