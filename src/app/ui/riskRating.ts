/** Shared risk rating tone helpers — Critical / High / Medium·Moderate / Low / Unknown. */

export type RiskRatingTone = 'critical' | 'high' | 'medium' | 'low' | 'unknown'

const TONE_BY_TOKEN: Record<string, RiskRatingTone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  moderate: 'medium',
  low: 'low',
  unknown: 'unknown',
  'not assessed': 'unknown',
  'not-assessed': 'unknown',
  none: 'unknown',
}

/** Map any rating / severity label to a shared tone. Medium and Moderate share medium. */
export function riskRatingTone(value: string | null | undefined): RiskRatingTone {
  if (!value) return 'unknown'
  const key = value.trim().toLowerCase()
  return TONE_BY_TOKEN[key] ?? 'unknown'
}

export function riskRatingClass(value: string | null | undefined): string {
  return `risk-rating risk-rating--${riskRatingTone(value)}`
}
