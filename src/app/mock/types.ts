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

export type SourceKind = 'Evidence' | 'Control' | 'Obligation' | 'Risk'

export type AuthenticatedView = 'hub' | 'gap'

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
}
