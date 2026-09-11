import { useState } from 'react'
import { DirectionA } from './DirectionA.tsx'
import { DirectionB } from './DirectionB.tsx'
import { DirectionC } from './DirectionC.tsx'
import { DirectionMix } from './DirectionMix.tsx'
import { ReferenceLogin } from './ReferenceLogin.tsx'
import './lab.css'
import './login.css'
import './a.css'
import './b.css'
import './c.css'
import './mix.css'

type Direction = 'a' | 'b' | 'c' | 'mix'
type Screen = 'login' | 'hub'
type Theme = 'dark' | 'light'

export function ExploreApp() {
  const [direction, setDirection] = useState<Direction>('mix')
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
          <button type="button" aria-pressed={direction === 'mix'} onClick={() => setDirection('mix')}>
            A+B Mix
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
        {screen === 'hub' && direction === 'c' ? (
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
        {screen === 'login' ? (
          <ReferenceLogin onShowHub={showHub} />
        ) : null}
        {screen === 'hub' && direction === 'a' ? (
          <DirectionA
            aiOpen={aiOpen}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
        {screen === 'hub' && direction === 'b' ? (
          <DirectionB
            aiOpen={aiOpen}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
        {screen === 'hub' && direction === 'c' ? (
          <DirectionC
            aiOpen={aiOpen}
            theme={theme}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
        {screen === 'hub' && direction === 'mix' ? (
          <DirectionMix
            aiOpen={aiOpen}
            onToggleAi={() => setAiOpen((value) => !value)}
          />
        ) : null}
      </div>
    </div>
  )
}
