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

export type SourceKind = 'Evidence' | 'Control' | 'Obligation' | 'Risk'
