import { useCallback } from 'react'
import { API_BASE_URL } from '../api/axios'

/**
 * Streams a chat reply from POST /api/chat/message.
 * Backend sends Server-Sent-Event-formatted chunks even though this isn't a
 * GET/EventSource — we parse them manually from the fetch ReadableStream.
 *
 * onDelta(text)   — called for every incremental chunk
 * onSessionId(id) — called once, as soon as the backend confirms the session
 * onDone(fullText)— called when the stream completes
 * onError(err)    — called on failure
 */
export function useStreamChat() {
  const streamMessage = useCallback(async ({ sessionId, message, onDelta, onSessionId, onDone, onError }) => {
    const token = localStorage.getItem('mc_token')

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_id: sessionId, message }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const rawEvents = buffer.split('\n\n')
        buffer = rawEvents.pop() // last (possibly incomplete) chunk stays in buffer

        for (const raw of rawEvents) {
          if (!raw.trim()) continue
          const lines = raw.split('\n')
          let eventName = 'message'
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            if (line.startsWith('data:')) dataLine += line.slice(5).trim()
          }
          if (!dataLine) continue

          let parsed
          try {
            parsed = JSON.parse(dataLine)
          } catch {
            continue
          }

          if (eventName === 'session' && parsed.session_id) {
            onSessionId?.(parsed.session_id)
          } else if (eventName === 'error') {
            onError?.(new Error(parsed.message || 'Stream error'))
          } else if (eventName === 'done') {
            fullText = parsed.full_text ?? fullText
          } else if (parsed.delta) {
            fullText += parsed.delta
            onDelta?.(parsed.delta)
          }
        }
      }

      onDone?.(fullText)
    } catch (err) {
      onError?.(err)
    }
  }, [])

  return { streamMessage }
}
