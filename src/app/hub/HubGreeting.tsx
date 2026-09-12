import { useSession } from '../state/SessionProvider.tsx'

export function HubGreeting() {
  const { view } = useSession()
  return (
    <header className="hub-head">
      <p className="hub-kicker">{view.hub.greeting.kicker}</p>
      <h1>
        {hello()}, {view.currentUser.name.split(' ')[0]}.
      </h1>
      <p className="hub-lede">{view.hub.greeting.lede}</p>
    </header>
  )
}

function hello() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}
