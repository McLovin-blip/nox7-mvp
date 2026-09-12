import { useEffect, useRef, useState } from 'react'
import type { GapStepId, ModuleId, PositionState } from '../mock/types.ts'
import {
  EMPTY_SUGGESTIONS,
  buildNoxReply,
  contextBanner,
  createUserMessage,
  welcomeText,
  type ChatMessage,
  type ConversationContext,
} from './conversation.ts'
import './ai.css'

export function NoxAiPanel({
  position,
  module,
  selectedId,
  selectedTitle,
  gapStep,
  pendingPrompt,
  onConsumePrompt,
  onOpenSource,
}: {
  position: PositionState
  module: ModuleId | 'gap'
  selectedId?: string | null
  selectedTitle?: string
  gapStep?: GapStepId
  pendingPrompt?: string | null
  onConsumePrompt?: () => void
  onOpenSource: (id: string) => void
}) {
  const ctx: ConversationContext = {
    position,
    module,
    selectedId,
    selectedTitle,
    gapStep,
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pendingTimer = useRef<number | null>(null)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    setMessages([
      {
        id: 'nox-welcome',
        role: 'nox',
        text: welcomeText(ctx),
        suggestions: EMPTY_SUGGESTIONS,
        topic: 'general',
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, thinking])

  useEffect(() => {
    return () => {
      if (pendingTimer.current) window.clearTimeout(pendingTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!pendingPrompt) return
    const prompt = pendingPrompt
    onConsumePrompt?.()
    void send(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt])

  function send(raw: string) {
    const text = raw.trim()
    if (!text || thinking) return

    const user = createUserMessage(text)
    setMessages((current) => [...current, user])
    setDraft('')
    setThinking(true)

    if (pendingTimer.current) window.clearTimeout(pendingTimer.current)
    pendingTimer.current = window.setTimeout(() => {
      setMessages((current) => {
        const reply = buildNoxReply(text, ctx, current)
        return [...current, reply]
      })
      setThinking(false)
      pendingTimer.current = null
    }, 450 + Math.min(500, text.length * 8))
  }

  const latestSuggestions =
    [...messages].reverse().find((item) => item.role === 'nox' && item.suggestions?.length)?.suggestions ??
    EMPTY_SUGGESTIONS

  return (
    <aside className="ai-panel" aria-label="Nox AI">
      <header className="ai-head">
        <div>
          <p className="ai-kicker">Nox</p>
          <h2>GRC copilot</h2>
        </div>
        <p className="ai-ctx">{contextBanner(ctx)}</p>
      </header>

      <div className="ai-thread" ref={scrollerRef}>
        {messages.map((message) => (
          <article key={message.id} className={`ai-msg ${message.role}`}>
            <div className="ai-bubble">
              <p className="ai-role">{message.role === 'nox' ? 'Nox' : 'You'}</p>
              <div className="ai-text">
                {message.text.split('\n').map((line, index) =>
                  line ? <p key={`${message.id}-${index}`}>{line}</p> : <br key={`${message.id}-br-${index}`} />,
                )}
              </div>
              {message.citations && message.citations.length > 0 ? (
                <div className="ai-cites">
                  {message.citations.map((cite) => (
                    <button key={cite.id} type="button" onClick={() => onOpenSource(cite.id)}>
                      <span>{cite.kind}</span>
                      {cite.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {thinking ? (
          <article className="ai-msg nox">
            <div className="ai-bubble thinking">
              <p className="ai-role">Nox</p>
              <p className="ai-thinking">Reviewing organisation records…</p>
            </div>
          </article>
        ) : null}
      </div>

      {!thinking ? (
        <div className="ai-suggestions" aria-label="Suggested questions">
          {latestSuggestions.slice(0, 4).map((item) => (
            <button key={item} type="button" onClick={() => send(item)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="ai-composer"
        onSubmit={(event) => {
          event.preventDefault()
          send(draft)
        }}
      >
        <label className="sr-only" htmlFor="nox-input">
          Message Nox
        </label>
        <textarea
          id="nox-input"
          rows={2}
          value={draft}
          placeholder="Ask about risks, controls, evidence, assurance…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send(draft)
            }
          }}
        />
        <button type="submit" disabled={!draft.trim() || thinking}>
          Send
        </button>
      </form>
    </aside>
  )
}
