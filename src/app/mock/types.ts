export type ModuleId =
  | 'hub'
  | 'regulatory'
  | 'controls'
  | 'evidence'
  | 'risks'
  | 'reports'
  | 'activity'

export type MapFilter = 'all' | 'frameworks' | 'evidence' | 'risks'

export type MapNodeId = 'centre' | 'frameworks' | 'controls' | 'evidence' | 'risks' | 'owners'

export type GapStepId = 'overview' | 'policy' | 'obligations' | 'control' | 'evidence' | 'risks'

export type SourceKind = 'Evidence' | 'Control' | 'Obligation' | 'Risk' | 'Report'

export type AuthenticatedView = 'hub' | 'gap' | 'upload'

export type PositionState = 'before' | 'after'

export type UploadPhase = 'idle' | 'processing' | 'review'

export type UploadOutcome = 'success' | 'duplicate' | 'missing_metadata'

export type AiPanelModel = {
  context: string
  question: string
  executiveAnswer: string
  facts: { text: string; citationId: string }[]
  interpretation: string
  recommendedAction: string
  connected: string[]
  freshness: string
  confidence: string
  owner: string
  approval: string
  expectedImpact: string
  prompts: string[]
}

export type Tone = 'assured' | 'partial' | 'attention'

export type RecordRow = {
  id: string
  kind: SourceKind
  title: string
  status: string
  tone: Tone
  owner: string
  summary: string
  meta: string
  neighbours: { label: string; title: string }[]
}

export type UploadItem = {
  id: string
  filename: string
  outcome: UploadOutcome
  progress: number
  stage: string
  classification?: string
  controlTitles: string[]
  obligationTitles: string[]
  duplicateOfTitle?: string
  missingFields: string[]
  owner: string
  reviewDate: string
  included: boolean
}

export type ActivityItem = {
  id: string
  time: string
  actor: string
  title: string
  detail: string
  tone: 'info' | 'wait' | 'ok' | 'warn'
}
