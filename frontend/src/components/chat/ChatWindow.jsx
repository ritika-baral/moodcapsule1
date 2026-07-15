import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, SendHorizontal } from 'lucide-react'
import { useChat } from '../../context/ChatContext'
import { useStreamChat } from '../../hooks/useStreamChat'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import SuggestionChips from './SuggestionChips'
import GlassCard from '../common/GlassCard'

export default function ChatWindow({ greeting, showReadyButton = true }) {
  const {
    sessionId,
    setSessionId,
    messages,
    appendMessage,
    updateLastAssistantMessage,
    isStreaming,
    setIsStreaming,
    setStage,
  } = useChat()
  const { streamMessage } = useStreamChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const send = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    appendMessage({ role: 'user', content: trimmed })
    appendMessage({ role: 'assistant', content: '' })
    setInput('')
    setIsStreaming(true)

    let streamedText = ''
    await streamMessage({
      sessionId,
      message: trimmed,
      onSessionId: (id) => {
        if (!sessionId) setSessionId(id)
      },
      onDelta: (delta) => {
        streamedText += delta
        updateLastAssistantMessage(streamedText)
      },
      onDone: () => setIsStreaming(false),
      onError: () => {
        updateLastAssistantMessage("I'm having trouble connecting right now — mind trying again?")
        setIsStreaming(false)
      },
    })
  }

  const userTurns = messages.filter((m) => m.role === 'user').length
  const readyForRecommendations = showReadyButton && userTurns >= 1 && !isStreaming

  return (
    <div className="flex flex-col gap-5">
      <GlassCard className="flex max-h-[58vh] min-h-[320px] flex-col overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          {greeting && messages.length === 0 && <MessageBubble role="assistant" content={greeting} />}
          {messages.map((m, i) =>
            m.role === 'assistant' && m.content === '' && isStreaming && i === messages.length - 1 ? (
              <TypingIndicator key={i} />
            ) : (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ),
          )}
          <div ref={scrollRef} />
        </div>
      </GlassCard>

      {messages.length === 0 && (
        <div>
          <p className="label-text mb-2.5">Not sure what to say?</p>
          <SuggestionChips onPick={send} disabled={isStreaming} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-center gap-2.5"
      >
        <input
          className="input-field"
          placeholder="Tell me how you're feeling…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-dusk-violet via-ember-rose to-amber-glow text-void transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Send"
        >
          <SendHorizontal size={17} />
        </button>
      </form>

      {readyForRecommendations && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setStage('category')}
          className="btn-secondary self-center group"
        >
          I'm ready — show me what fits
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      )}
    </div>
  )
}
