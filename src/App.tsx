import { useEffect, useState } from 'react'
import { NoxAiPanel } from './app/ai/NoxAiPanel.tsx'
import { AppShell } from './app/chrome/AppShell.tsx'
import { ExecutiveHub } from './app/hub/ExecutiveHub.tsx'
import { LoginScreen } from './app/login/LoginScreen.tsx'
import { hubAi, moduleCopy } from './app/mock/store.ts'
import type { MapFilter, MapNodeId, ModuleId } from './app/mock/types.ts'

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [module, setModule] = useState<ModuleId>('hub')
  const [aiOpen, setAiOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [selectedNode, setSelectedNode] = useState<MapNodeId>('centre')
  const [question, setQuestion] = useState(hubAi.question)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setAiOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openAi = (prompt?: string) => {
    setQuestion(prompt || hubAi.question)
    setAiOpen(true)
  }

  if (!signedIn) {
    return (
      <LoginScreen
        onShowHub={() => {
          setSignedIn(true)
          setModule('hub')
          setAiOpen(true)
        }}
      />
    )
  }

  return (
    <AppShell
      module={module}
      aiOpen={aiOpen}
      onModule={setModule}
      onToggleAi={() => setAiOpen((value) => !value)}
    >
      {module === 'hub' ? (
        <ExecutiveHub
          mapOpen={mapOpen}
          mapFilter={mapFilter}
          selectedNode={selectedNode}
          onToggleMap={() => setMapOpen((value) => !value)}
          onFilter={setMapFilter}
          onSelectNode={(id) => {
            setSelectedNode(id)
            setAiOpen(true)
          }}
          onAsk={openAi}
        />
      ) : (
        <section className="hub placeholder">
          <h1>{moduleCopy[module].title}</h1>
          <p>{moduleCopy[module].body}</p>
        </section>
      )}
      {aiOpen ? <NoxAiPanel question={question} /> : null}
    </AppShell>
  )
}
