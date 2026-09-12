import { ModuleFrame, RecordList } from '../modules/Records.tsx'
import { useSession } from '../state/SessionProvider.tsx'

export function RegulatoryModule({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { view } = useSession()
  const partial = view.obligations.filter((item) => item.tone === 'partial').length
  return (
    <ModuleFrame
      kicker="Regulatory"
      title="Obligations"
      lede={
        view.position === 'after'
          ? 'Supplier-related obligations across ISO 27001, NIS2, GDPR and NCA ECC are supported by the same current assessments.'
          : `${partial} obligations are only partially supported. They share the supplier-assurance policy and the same missing assessments.`
      }
    >
      <RecordList rows={view.obligations} selectedId={selectedId} onSelect={onSelect} />
    </ModuleFrame>
  )
}
