import { useEffect, useState } from 'react'
import { NoxAiPanel } from './app/ai/NoxAiPanel.tsx'
import { AppShell } from './app/chrome/AppShell.tsx'
import { ConnectedGapView } from './app/gap/ConnectedGapView.tsx'
import { ExecutiveHub } from './app/hub/ExecutiveHub.tsx'
import { LoginScreen } from './app/login/LoginScreen.tsx'
import { gapAi, hubAi, moduleCopy } from './app/mock/store.ts'
import type { AuthenticatedView, GapStepId, MapFilter, MapNodeId, ModuleId } from './app/mock/types.ts'

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [module, setModule] = useState<ModuleId>('hub')
  const [view, setView] = useState<AuthenticatedView>('hub')
  const [aiOpen, setAiOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [selectedNode, setSelectedNode] = useState<MapNodeId>('centre')
  const [gapStep, setGapStep] = useState<GapStepId>('overview')
  const [question, setQuestion] = useState(hubAi.question)

  const aiAnswer = view === 'gap' ? gapAi[gapStep] : hubAi

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

  const openGap = (step: GapStepId = 'overview') => {
    setModule('hub')
    setView('gap')
    setGapStep(step)
    setQuestion(gapAi[step].question)
    setAiOpen(true)
  }

  const backToHub = () => {
    setModule('hub')
    setView('hub')
    setQuestion(hubAi.question)
  }

  if (!signedIn) {
    return (
      <LoginScreen
        onShowHub={() => {
          setSignedIn(true)
          setModule('hub')
          setView('hub')
          setAiOpen(true)
        }}
      />
    )
  }

  return (
    <AppShell
      module={module}
      aiOpen={aiOpen}
      onModule={(id) => {
        setModule(id)
        setView('hub')
        setQuestion(hubAi.question)
      }}
      onToggleAi={() => setAiOpen((value) => !value)}
    >
      {module === 'hub' && view === 'gap' ? (
        <ConnectedGapView
          selectedStep={gapStep}
          onBack={backToHub}
          onSelectStep={(id) => {
            setGapStep(id)
            setQuestion(gapAi[id].question)
            setAiOpen(true)
          }}
        />
      ) : module === 'hub' ? (
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
          onOpenGap={(step) => openGap(step ?? 'overview')}
        />
      ) : (
        <section className="hub placeholder">
          <h1>{moduleCopy[module].title}</h1>
          <p>{moduleCopy[module].body}</p>
        </section>
      )}
      {aiOpen ? (
        <NoxAiPanel
          key={`${aiAnswer.context}:${aiAnswer.question}`}
          answer={aiAnswer}
          question={question}
        />
      ) : null}
    </AppShell>
  )
}
