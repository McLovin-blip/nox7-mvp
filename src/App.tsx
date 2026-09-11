import './App.css'

const STACK = ['React', 'TypeScript', 'Vite'] as const

function App() {
  return (
    <main className="shell">
      <header className="brand">
        <img
          className="owl"
          src="/brand/nox7-owl-mark.png"
          alt="Nox7 owl mark"
          width={72}
          height={72}
        />
        <img
          className="wordmark"
          src="/brand/nox7-wordmark.png"
          alt="Nox7"
          width={180}
          height={40}
        />
      </header>

      <section className="panel">
        <p className="eyebrow">Visual MVP foundation</p>
        <h1>Project scaffold is ready.</h1>
        <p className="lede">
          This starter page confirms the React + TypeScript + Vite app loads.
          Approved product screens stay in <code>reference/</code> and have not
          been redesigned or migrated yet.
        </p>

        <ul className="stack" aria-label="Application stack">
          {STACK.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
