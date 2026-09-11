export const org = {
  name: 'Meridian International',
  review: 'Governance and compliance review in 14 days',
  user: 'Layla Rahman',
  role: 'Chief Compliance Officer',
}

export const frameworks = [
  { name: 'ISO 27001', coverage: 78 },
  { name: 'NIS2', coverage: 71 },
  { name: 'GDPR', coverage: 69 },
  { name: 'NCA ECC', coverage: 66 },
]

export const position = {
  readinessLabel: 'Needs attention',
  readinessValue: 64,
  changed:
    'Supplier-assurance policy was confirmed current. Critical-supplier assessments were not found in the evidence set.',
  attention:
    'Current assessment evidence is missing for several critical suppliers.',
  evidence:
    'Policy current. Assessments missing. One expired pack. One duplicate. Continuity report expiring.',
  assurance: 'Supplier assurance is partially assured — policy without current assessments.',
  risks: 'Third-party assurance and regulatory exposure are elevated.',
  owner: 'Omar Haddad, Head of Procurement',
  next: 'Upload current critical-supplier assessments for review and approval.',
}

export const activity = [
  { when: 'Yesterday', text: 'Information security policy marked current' },
  { when: '2 days ago', text: 'Internal audit findings recorded the supplier gap' },
  { when: '5 days ago', text: 'Previous regulatory assessment attached' },
]

export const sources = [
  {
    id: 'ev-policy-supplier',
    title: 'Supplier assurance policy',
    kind: 'Policy',
    freshness: 'Current',
    meta: 'Version 3.0 · Omar Haddad',
  },
  {
    id: 'ev-audit-findings',
    title: 'Internal audit findings',
    kind: 'Audit',
    freshness: 'Current',
    meta: '21 Jun 2026 · Layla Rahman',
  },
  {
    id: 'ctl-supplier-assurance',
    title: 'Supplier assurance',
    kind: 'Control',
    freshness: 'Partial',
    meta: 'Supports four international frameworks',
  },
]

export const ai = {
  context: 'Executive Hub · Meridian International',
  question: 'Which gap affects the most frameworks?',
  answer:
    'The highest-impact gap is missing current assessment evidence for several critical suppliers. A supplier-assurance policy exists, but it is counted separately in each framework and is not backed by current assessments.',
  facts: [
    {
      text: 'The supplier-assurance policy is current (version 3.0).',
      citationId: 'ev-policy-supplier',
    },
    {
      text: 'Internal audit findings record that current critical-supplier assessments are missing.',
      citationId: 'ev-audit-findings',
    },
    {
      text: 'The same control supports obligations in ISO 27001, NIS2, GDPR and NCA ECC.',
      citationId: 'ctl-supplier-assurance',
    },
  ],
  interpretation:
    'Because one evidence gap sits under four international frameworks, closing it improves coverage and connected risk more than treating each framework as a separate project.',
  action:
    'Upload current critical-supplier assessments and approve the suggested mappings before the review.',
  connected: {
    obligations: [
      'Supplier relationships — ISO 27001',
      'Supply-chain security — NIS2',
      'Processor due diligence — GDPR',
      'Third-party assurance — NCA ECC',
    ],
    controls: ['Supplier assurance'],
    evidence: ['Supplier assurance policy', 'Internal audit findings'],
    risks: ['Third-party assurance', 'Regulatory exposure'],
  },
  confidence: 'High',
  freshness: 'Policy current · assessments missing · 2023 pack expired',
  owner: 'Omar Haddad',
  approval: 'Human approval required before coverage or risk changes.',
  impact:
    'Coverage rises across the four frameworks. Supplier assurance moves from partial to assured. Third-party and regulatory exposure reduce.',
}

export const nav = [
  'Hub',
  'Regulatory',
  'Controls',
  'Evidence',
  'Risks',
  'Reports',
  'Activity',
] as const
