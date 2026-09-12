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
import {
  buildRevealSteps,
  prefersReducedMotion,
  thinkingDelayMs,
  writeDurationMs,
} from './progressive.ts'
import { buildContextGuidance, type NoxNavigateTarget } from './suggestions.ts'
import './ai.css'

type Phase = 'idle' | 'thinking' | 'writing'

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
  const [phase, setPhase] = useState<Phase>('idle')
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottom = useRef(true)
  const bootstrapped = useRef(false)
  const streamTimers = useRef<number[]>([])
  const pendingFull = useRef<ChatMessage | null>(null)
  const activeStreamId = useRef<string | null>(null)
  const contextKey = `${module}|${selectedId ?? ''}|${hubFocus?.id ?? ''}|${position}|${riskDrill?.label ?? ''}`

  const busy = phase !== 'idle'

  function clearStreamTimers() {
    for (const id of streamTimers.current) window.clearTimeout(id)
    streamTimers.current = []
  }

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    streamTimers.current.push(id)
    return id
  }

  function finishReply(full: ChatMessage) {
    clearStreamTimers()
    activeStreamId.current = null
    pendingFull.current = null
    setStreamingId(null)
    setMessages((current) =>
      current.map((item) =>
        item.id === full.id
          ? {
              ...full,
              text: full.text,
              suggestions: full.suggestions?.length ? full.suggestions : guidance.questions.slice(0, 4),
            }
          : item,
      ),
    )
    setPhase('idle')
  }

  function startProgressiveReveal(full: ChatMessage) {
    pendingFull.current = full
    activeStreamId.current = full.id
    setStreamingId(full.id)

    const reduced = prefersReducedMotion()
    const steps = buildRevealSteps(full.text)
    const instant = reduced || steps.length <= 1

    setMessages((current) => [
      ...current,
      {
        id: full.id,
        role: 'nox',
        text: instant ? full.text : '',
        topic: full.topic,
      },
    ])

    if (instant) {
      setPhase('writing')
      schedule(() => finishReply(full), reduced ? 0 : 140)
      return
    }

    setPhase('writing')
    const total = writeDurationMs(full.text, steps.length)
    const stepMs = Math.max(70, Math.round(total / steps.length))

    steps.forEach((snapshot, index) => {
      schedule(() => {
        if (activeStreamId.current !== full.id) return
        setMessages((current) =>
          current.map((item) => (item.id === full.id ? { ...item, text: snapshot } : item)),
        )
        if (index === steps.length - 1) finishReply(full)
      }, stepMs * (index + 1))
    })
  }

  function skipGeneration() {
    if (phase === 'thinking') {
      clearStreamTimers()
      setMessages((current) => {
        const lastUser = [...current].reverse().find((item) => item.role === 'user')
        if (!lastUser) {
          setPhase('idle')
          return current
        }
        const reply = buildNoxReply(lastUser.text, ctx, current)
        const withContext: ChatMessage = {
          ...reply,
          suggestions: reply.suggestions?.length ? reply.suggestions : guidance.questions.slice(0, 4),
        }
        return [...current, withContext]
      })
      activeStreamId.current = null
      pendingFull.current = null
      setStreamingId(null)
      setPhase('idle')
      return
    }

    const full = pendingFull.current
    if (!full) {
      setPhase('idle')
      setStreamingId(null)
      return
    }
    finishReply(full)
  }

  function send(raw: string) {
    const text = raw.trim()
    if (!text || busy) return

    const user = createUserMessage(text)
    setMessages((current) => [...current, user])
    setDraft('')
    setPhase('thinking')
    stickToBottom.current = true
    clearStreamTimers()
    pendingFull.current = null
    activeStreamId.current = null
    setStreamingId(null)

    const thinkMs = thinkingDelayMs(prefersReducedMotion())
    schedule(() => {
      setMessages((current) => {
        const reply = buildNoxReply(text, ctx, current)
        const withContext: ChatMessage = {
          ...reply,
          suggestions: reply.suggestions?.length ? reply.suggestions : guidance.questions.slice(0, 4),
        }
        schedule(() => startProgressiveReveal(withContext), 0)
        return current
      })
    }, thinkMs)
  }

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
    if (!node || !stickToBottom.current) return
    node.scrollTop = node.scrollHeight
  }, [messages, phase, open])

  useEffect(() => {
    return () => clearStreamTimers()
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
    if (!open || busy) return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey, open])

  const askSuggestions = guidance.questions
  const showActions = !busy

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
            {busy ? (
              <button type="button" className="nox-skip" onClick={skipGeneration} aria-label="Show full answer">
                Show full
              </button>
            ) : null}
            <button type="button" className="nox-minimize" onClick={onClose} aria-label="Minimize Nox AI">
              Minimize
            </button>
            <button type="button" className="nox-close" onClick={onClose} aria-label="Close Nox AI">
              Close
            </button>
          </div>
        </header>

        <div
          className="nox-thread"
          ref={scrollerRef}
          onScroll={() => {
            const node = scrollerRef.current
            if (!node) return
            stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 96
          }}
        >
          {messages.map((message) => {
            const streaming = message.id === streamingId && phase === 'writing'
            const showCites =
              Boolean(message.citations?.length) && message.role === 'nox' && message.id !== streamingId

            return (
              <article key={message.id} className={`ai-msg ${message.role}`}>
                <div className={`ai-bubble${streaming ? ' is-streaming' : ''}`}>
                  <p className="ai-role">{message.role === 'nox' ? 'Nox' : 'You'}</p>
                  <div className="ai-text">
                    {message.text.split('\n').map((line, index) =>
                      line ? (
                        <p key={`${message.id}-${index}`}>{line}</p>
                      ) : (
                        <br key={`${message.id}-br-${index}`} />
                      ),
                    )}
                  </div>
                  {showCites ? (
                    <div className="ai-cites">
                      {message.citations!.map((cite) => (
                        <button key={cite.id} type="button" onClick={() => onOpenSource(cite.id)}>
                          <span>{cite.kind}</span>
                          {cite.title}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
          {phase === 'thinking' ? (
            <article className="ai-msg nox">
              <div className="ai-bubble thinking">
                <p className="ai-role">Nox</p>
                <p className="ai-thinking">
                  Nox is thinking
                  <span className="ai-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </p>
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
                <button key={item} type="button" className="nox-ask" onClick={() => send(item)} disabled={busy}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="nox-guides is-generating" aria-live="polite">
            <p className="nox-generating-label">Generating response…</p>
          </div>
        )}

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
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send(draft)
              }
              if (event.key === 'Escape') onClose()
            }}
          />
          <button type="submit" disabled={!draft.trim() || busy}>
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
