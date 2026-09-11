import { useState } from 'react'
import { DirectionA } from './DirectionA.tsx'
import { DirectionB } from './DirectionB.tsx'
import { DirectionC } from './DirectionC.tsx'
import './lab.css'
import './a.css'
import './b.css'
import './c.css'

type Direction = 'a' | 'b' | 'c'
type Screen = 'login' | 'hub'
type Theme = 'dark' | 'light'

export function ExploreApp() {
  const [direction, setDirection] = useState<Direction>('a')
  const [screen, setScreen] = useState<Screen>('login')
  const [theme, setTheme] = useState<Theme>('light')
  const [aiOpen, setAiOpen] = useState(true)

  const showHub = () => {
    setScreen('hub')
    setAiOpen(true)
  }

  return (
    <div className="lab">
      <div className="lab-bar">
        <strong>Visual laboratory</strong>
        <div className="lab-group">
          <span>Direction</span>
          <button type="button" aria-pressed={direction === 'a'} onClick={() => setDirection('a')}>
            A Console
          </button>
          <button type="button" aria-pressed={direction === 'b'} onClick={() => setDirection('b')}>
            B Connected
          </button>
          <button type="button" aria-pressed={direction === 'c'} onClick={() => setDirection('c')}>
            C Governance
          </button>
        </div>
        <div className="lab-group">
          <span>Screen</span>
          <button type="button" aria-pressed={screen === 'login'} onClick={() => setScreen('login')}>
            Login
          </button>
          <button
            type="button"
            aria-pressed={screen === 'hub'}
            onClick={() => {
              setScreen('hub')
              setAiOpen(true)
            }}
          >
            Hub
          </button>
        </div>
        {screen === 'hub' ? (
          <div className="lab-group">
            <span>Nox AI</span>
            <button type="button" aria-pressed={aiOpen} onClick={() => setAiOpen((value) => !value)}>
              {aiOpen ? 'Panel open' : 'Panel closed'}
            </button>
          </div>
        ) : null}
        {direction === 'c' ? (
          <div className="lab-group">
            <span>Theme</span>
            <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
              Light
            </button>
            <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
              Dark
            </button>
          </div>
        ) : null}
        <p className="lab-note">Exploration only · same viewport · not production navigation</p>
      </div>
      <div className="lab-stage">
        {direction === 'a' ? (
          <DirectionA
            screen={screen}
            aiOpen={aiOpen}
            onShowHub={showHub}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
        {direction === 'b' ? (
          <DirectionB
            screen={screen}
            aiOpen={aiOpen}
            onShowHub={showHub}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
        {direction === 'c' ? (
          <DirectionC
            screen={screen}
            aiOpen={aiOpen}
            theme={theme}
            onShowHub={showHub}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
      </div>
    </div>
  )
}
