import { useEffect, useRef, useState } from 'react'
import { Owl } from '../brand/Brand.tsx'
import type { GapStepId, HubFocus, ModuleId, PositionState } from '../mock/types.ts'
import {
  buildNoxReply,
  contextBanner,
  createUserMessage,
  welcomeText,
  type ChatMessage,
  type ConversationContext,
} from './conversation.ts'
import { buildContextGuidance, type NoxNavigateTarget } from './suggestions.ts'
import './ai.css'

export function NoxAiPanel({
  open,
  onOpen,
  onClose,
  position,
  module,
  selectedId,
  selectedTitle,
  hubFocus,
  gapStep,
  riskDrill,
  pendingPrompt,
  onConsumePrompt,
  onOpenSource,
  onNavigate,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  position: PositionState
  module: ModuleId | 'gap'
  selectedId?: string | null
  selectedTitle?: string
  hubFocus?: HubFocus | null
  gapStep?: GapStepId
  riskDrill?: { label: string; questions: string[] } | null
  pendingPrompt?: string | null
  onConsumePrompt?: () => void
  onOpenSource: (id: string) => void
  onNavigate: (target: NoxNavigateTarget) => void
}) {
  const ctx: ConversationContext = {
    position,
    module,
    selectedId,
    selectedTitle,
    hubFocus,
    gapStep,
    riskDrill,
  }

  const guidance = buildContextGuidance(ctx)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pendingTimer = useRef<number | null>(null)
  const bootstrapped = useRef(false)
  const contextKey = `${module}|${selectedId ?? ''}|${hubFocus?.id ?? ''}|${position}|${riskDrill?.label ?? ''}`

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    setMessages([
      {
        id: 'nox-welcome',
        role: 'nox',
        text: welcomeText(ctx),
        suggestions: guidance.questions.slice(0, 4),
        topic: 'general',
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, thinking, open])

  useEffect(() => {
    return () => {
      if (pendingTimer.current) window.clearTimeout(pendingTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!pendingPrompt) return
    const prompt = pendingPrompt
    onConsumePrompt?.()
    onOpen()
    void send(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 280)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== 'nox-welcome') return current
      return [
        {
          ...current[0],
          text: welcomeText(ctx),
          suggestions: guidance.questions.slice(0, 4),
        },
      ]
    })
    // Refresh opening copy when context changes and chat is still on welcome only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey, open])

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
        const withContext = {
          ...reply,
          suggestions: reply.suggestions?.length ? reply.suggestions : guidance.questions.slice(0, 4),
        }
        return [...current, withContext]
      })
      setThinking(false)
      pendingTimer.current = null
    }, 420 + Math.min(480, text.length * 7))
  }

  // Prefer live page/record context for chips so suggestions stay relevant while chat history persists.
  const askSuggestions = guidance.questions
  const showActions = !thinking

  return (
    <div className={`nox-dock${open ? ' is-open' : ''}`} aria-live="polite">
      <button
        type="button"
        className="nox-fab"
        aria-label="Ask Nox AI"
        aria-expanded={open}
        onClick={onOpen}
      >
        <span className="nox-fab-pulse" aria-hidden="true" />
        <span className="nox-fab-core">
          <Owl className="nox-fab-owl" />
          <span className="nox-fab-label">Ask Nox</span>
        </span>
      </button>

      <section
        className="nox-chat"
        aria-label="Nox AI conversation"
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <header className="nox-chat-head">
          <div className="nox-chat-brand">
            <Owl className="nox-chat-owl" />
            <div>
              <p className="nox-chat-title">
                Nox AI
                <span className="nox-online" title="Available">
                  <i />
                  Online
                </span>
              </p>
              <p className="nox-chat-ctx">{contextBanner(ctx)}</p>
            </div>
          </div>
          <div className="nox-chat-actions">
            <button type="button" className="nox-minimize" onClick={onClose} aria-label="Minimize Nox AI">
              Minimize
            </button>
            <button type="button" className="nox-close" onClick={onClose} aria-label="Close Nox AI">
              Close
            </button>
          </div>
        </header>

        <div className="nox-thread" ref={scrollerRef}>
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

        {showActions ? (
          <div className="nox-guides">
            <div className="nox-actions" aria-label="Suggested actions">
              <p className="nox-guide-label">You may want to</p>
              {guidance.actions.slice(0, 4).map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="nox-action"
                  onClick={() => {
                    onNavigate(action.navigate)
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="nox-asks" aria-label="Ask Nox">
              <p className="nox-guide-label">Ask Nox</p>
              {askSuggestions.slice(0, 4).map((item) => (
                <button key={item} type="button" className="nox-ask" onClick={() => send(item)}>
                  {item}
                </button>
              ))}
            </div>
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
            ref={inputRef}
            rows={2}
            value={draft}
            placeholder="Ask about risks, controls, evidence, assurance…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send(draft)
              }
              if (event.key === 'Escape') onClose()
            }}
          />
          <button type="submit" disabled={!draft.trim() || thinking}>
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
