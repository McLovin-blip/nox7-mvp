import { ModuleFrame } from '../modules/Records.tsx'
import '../modules/modules.css'
import { useSession } from '../state/SessionProvider.tsx'

export function ActivityModule() {
  const { activity, view } = useSession()
  return (
    <ModuleFrame
      kicker="Activity"
      title="Organisation history"
      lede={
        view.position === 'after'
          ? 'Uploads, proposals and the approval now agree with Hub, Evidence, Risks and the Board Summary.'
          : 'Uploads, proposals, approvals and rejections land here. The position does not change until a human approves.'
      }
    >
      <ol className="feed">
        {activity.map((item) => (
          <li key={item.id} className={item.tone}>
            <em>
              {item.time} · {item.actor}
            </em>
            <b>{item.title}</b>
            <small>{item.detail}</small>
          </li>
        ))}
      </ol>
    </ModuleFrame>
  )
}
