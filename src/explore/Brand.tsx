export function Owl({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src="/brand/nox7-owl-mark.png"
      alt="Nox7 owl mark"
    />
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src="/brand/nox7-wordmark.png"
      alt="Nox7"
    />
  )
}

const NODES = ['Frameworks', 'Controls', 'Evidence', 'Risks'] as const

export function Orbit({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <span className="ring r1" />
      <span className="ring r2" />
      <span className="ring r3" />
      <Owl className="orbit-owl" />
      {NODES.map((node) => (
        <span key={node} className={`sat sat-${node.toLowerCase()}`}>
          {node}
        </span>
      ))}
    </div>
  )
}
