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
import type { HubAction } from './app/mock/hubModel.ts'
import type { AuthenticatedView, GapStepId, HubFocus, MapFilter, MapNodeId, ModuleId } from './app/mock/types.ts'
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
  const [hubFocus, setHubFocus] = useState<HubFocus | null>(null)
  const [openAction, setOpenAction] = useState<HubAction | null>(null)

  const selectedTitle = useMemo(() => {
    if (hubFocus?.title) return hubFocus.title
    if (!selectedId) return undefined
    return [...view.obligations, ...view.controls, ...view.evidence, ...view.risks, ...view.reports].find(
      (item) => item.id === selectedId,
    )?.title
  }, [hubFocus, selectedId, view])

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
    if (id !== 'hub') {
      setOpenAction(null)
    }
  }

  const applyFocus = (focus: HubFocus, prompt: string) => {
    setHubFocus(focus)
    setSelectedId(focus.recordId ?? null)
    openAi(prompt)
  }

  const openSource = (id: string) => {
    const action = view.hub.actions.find((item) => item.id === id)
    if (action) {
      setModule('hub')
      setCanvas('hub')
      setOpenAction(action)
      applyFocus(
        { kind: 'action', id: action.id, title: action.title, recordId: action.recordId },
        action.askPrompt,
      )
      return
    }
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
    setOpenAction(null)
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
      onNotification={(item) => {
        if (item.target === 'gap') openGap('overview')
        else if (item.target === 'board') go('reports', 'rep-board-summary')
        else if (item.target === 'evidence') go('evidence', item.recordId)
        else go('hub')
      }}
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
          hubFocus={hubFocus}
          openAction={openAction}
          onToggleMap={() => setMapOpen((value) => !value)}
          onFilter={setMapFilter}
          onSelectNode={(id, focus, prompt) => {
            setSelectedNode(id)
            applyFocus(focus, prompt)
          }}
          onFocus={applyFocus}
          onAsk={openAi}
          onOpenGap={(step) => openGap(step ?? 'overview')}
          onOpenBoard={() => go('reports', 'rep-board-summary')}
          onUpload={startEvidenceUpload}
          onOpenSource={openSource}
          onOpenAction={setOpenAction}
          onCloseAction={() => setOpenAction(null)}
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
            setHubFocus(null)
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
          hubFocus={hubFocus}
          gapStep={gapStep}
          pendingPrompt={pendingPrompt}
          onConsumePrompt={() => setPendingPrompt(null)}
          onOpenSource={openSource}
        />
      ) : null}
    </AppShell>
  )
}
