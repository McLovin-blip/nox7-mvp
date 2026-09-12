import { useEffect, useMemo, useState } from 'react'
import { ActivityModule } from './app/activity/ActivityModule.tsx'
import { NoxAiPanel } from './app/ai/NoxAiPanel.tsx'
import { AppShell } from './app/chrome/AppShell.tsx'
import { ControlsModule } from './app/controls/ControlsModule.tsx'
import { EvidenceModule } from './app/evidence/EvidenceModule.tsx'
import { ConnectedGapView } from './app/gap/ConnectedGapView.tsx'
import { ExecutiveHub } from './app/hub/ExecutiveHub.tsx'
import { LoginScreen } from './app/login/LoginScreen.tsx'
import { lookupSource } from './app/mock/data.ts'
import type { AuthenticatedView, GapStepId, MapFilter, MapNodeId, ModuleId } from './app/mock/types.ts'
import { RegulatoryModule } from './app/regulatory/RegulatoryModule.tsx'
import { ReportsModule } from './app/reports/ReportsModule.tsx'
import { RisksModule } from './app/risks/RisksModule.tsx'
import { SessionProvider, useSession } from './app/state/SessionProvider.tsx'

export default function App() {
  return (
    <SessionProvider>
      <AuthenticatedApp />
    </SessionProvider>
  )
}

function AuthenticatedApp() {
  const { position, startUpload, view } = useSession()
  const [signedIn, setSignedIn] = useState(false)
  const [module, setModule] = useState<ModuleId>('hub')
  const [canvas, setCanvas] = useState<AuthenticatedView>('hub')
  const [aiOpen, setAiOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [selectedNode, setSelectedNode] = useState<MapNodeId>('centre')
  const [gapStep, setGapStep] = useState<GapStepId>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  const selectedTitle = useMemo(() => {
    if (!selectedId) return undefined
    return [...view.obligations, ...view.controls, ...view.evidence, ...view.risks, ...view.reports].find(
      (item) => item.id === selectedId,
    )?.title
  }, [selectedId, view])

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
    setAiOpen(true)
    if (prompt) setPendingPrompt(prompt)
  }

  const go = (id: ModuleId, recordId?: string | null) => {
    setModule(id)
    setCanvas('hub')
    setSelectedId(recordId ?? null)
  }

  const openSource = (id: string) => {
    if (id.startsWith('rep-')) {
      go('reports', id)
      return
    }
    const source = lookupSource(id, position)
    if (source) go(source.module, id)
  }

  const openGap = (step: GapStepId = 'overview') => {
    setModule('hub')
    setCanvas('gap')
    setGapStep(step)
  }

  const startEvidenceUpload = () => {
    go('evidence')
    startUpload()
  }

  if (!signedIn) {
    return (
      <LoginScreen
        onShowHub={() => {
          setSignedIn(true)
          go('hub')
        }}
      />
    )
  }

  return (
    <AppShell
      module={module}
      aiOpen={aiOpen}
      onModule={(id) => go(id)}
      onToggleAi={() => setAiOpen((value) => !value)}
    >
      {module === 'hub' && canvas === 'gap' ? (
        <ConnectedGapView
          selectedStep={gapStep}
          onBack={() => go('hub')}
          onSelectStep={(id) => setGapStep(id)}
          onContinue={position === 'after' ? () => go('reports', 'rep-board-summary') : startEvidenceUpload}
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
          onOpenBoard={() => go('reports', 'rep-board-summary')}
          onUpload={startEvidenceUpload}
        />
      ) : module === 'regulatory' ? (
        <RegulatoryModule selectedId={selectedId} onSelect={(id) => go('regulatory', id)} />
      ) : module === 'controls' ? (
        <ControlsModule selectedId={selectedId} onSelect={(id) => go('controls', id)} />
      ) : module === 'evidence' ? (
        <EvidenceModule
          selectedId={selectedId}
          onSelect={(id) => go('evidence', id)}
          onApproved={() => {
            setModule('hub')
            setCanvas('hub')
            setSelectedId(null)
            setAiOpen(true)
            setPendingPrompt('Has our position improved?')
          }}
        />
      ) : module === 'risks' ? (
        <RisksModule selectedId={selectedId} onSelect={(id) => go('risks', id)} />
      ) : module === 'reports' ? (
        <ReportsModule selectedId={selectedId} onOpenSource={openSource} />
      ) : (
        <ActivityModule />
      )}
      {aiOpen ? (
        <NoxAiPanel
          position={position}
          module={canvas === 'gap' ? 'gap' : module}
          selectedId={selectedId}
          selectedTitle={selectedTitle}
          gapStep={gapStep}
          pendingPrompt={pendingPrompt}
          onConsumePrompt={() => setPendingPrompt(null)}
          onOpenSource={openSource}
        />
      ) : null}
    </AppShell>
  )
}
