/** Client-only progressive reveal helpers for Ask Nox (no streaming API). */

const LABEL_RE =
  /^(Fact|Why it matters|Recommended [Aa]ction|Recommendation|Interpretation|Expected effect|From the records):\s*(.*)$/i

function groupSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (trimmed.includes('\n•') || trimmed.startsWith('•')) {
    const lines = trimmed.split('\n')
    const out: string[] = []
    let buf: string[] = []
    for (const line of lines) {
      if (line.startsWith('•') && buf.length >= 2) {
        out.push(buf.join('\n'))
        buf = [line]
      } else {
        buf.push(line)
      }
    }
    if (buf.length) out.push(buf.join('\n'))
    return out
  }

  const parts = trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [trimmed]
  const groups: string[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const group = parts
      .slice(i, i + 2)
      .join('')
      .trim()
    if (group) groups.push(group)
  }
  return groups.length ? groups : [trimmed]
}

function pieceSeparator(prev: string | undefined, next: string): string {
  if (!prev) return ''
  const prevLine = prev.trim()
  if (/^###\s/.test(prevLine) || /:$/.test(prevLine)) return '\n'
  if (next.startsWith('•')) return '\n'
  return '\n\n'
}

/** Split reply text into reveal pieces (headings, sections, sentence groups). */
export function splitReplyPieces(fullText: string): string[] {
  const trimmed = fullText.trim()
  if (!trimmed) return []

  const blocks = trimmed.split(/\n{2,}/)
  const pieces: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    const head = lines[0] ?? ''

    if (/^###\s+\S/.test(head) && lines.length > 1) {
      pieces.push(head)
      const body = lines.slice(1).join('\n').trim()
      if (body.length > 160) pieces.push(...groupSentences(body))
      else if (body) pieces.push(body)
      continue
    }

    const labeled = head.match(LABEL_RE)
    if (labeled && labeled[2] && (labeled[2].length > 24 || lines.length > 1)) {
      pieces.push(`${labeled[1]}:`)
      const rest = [labeled[2], ...lines.slice(1)].filter(Boolean).join('\n').trim()
      if (rest.length > 160) pieces.push(...groupSentences(rest))
      else if (rest) pieces.push(rest)
      continue
    }

    if (block.length > 200) pieces.push(...groupSentences(block))
    else pieces.push(block)
  }

  return pieces.filter(Boolean)
}

/** Cumulative text snapshots for progressive rendering. */
export function buildRevealSteps(fullText: string): string[] {
  const pieces = splitReplyPieces(fullText)
  if (pieces.length <= 1) return pieces.length ? [fullText.trim()] : []

  const steps: string[] = []
  let acc = ''
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]!
    const sep = pieceSeparator(pieces[i - 1], piece)
    acc = acc ? `${acc}${sep}${piece}` : piece
    steps.push(acc)
  }
  return steps
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Total write duration in ms based on answer length (capped). */
export function writeDurationMs(fullText: string, stepCount: number): number {
  const chars = fullText.length
  const raw = 520 + chars * 1.6 + Math.max(0, stepCount - 1) * 90
  return Math.min(2500, Math.max(500, Math.round(raw)))
}

export function thinkingDelayMs(reduced: boolean): number {
  return reduced ? 120 : 340
}
