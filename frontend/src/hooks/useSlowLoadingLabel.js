import { useEffect, useRef, useState } from 'react'

const DEFAULT_MESSAGES = [
  'Finding your perfect vibe...',
  'Matching your mood...',
  'Looking through recommendations...',
  'Almost there...',
]

/**
 * Returns a rotating "slow response" status label once `isLoading` has stayed
 * true for longer than `delayMs` (default 2s). Returns '' before that, so
 * fast responses render exactly as they did before this hook existed.
 *
 * Usage: const label = useSlowLoadingLabel(isStreaming)
 */
export function useSlowLoadingLabel(isLoading, options = {}) {
  const { messages = DEFAULT_MESSAGES, delayMs = 2000, rotateMs = 1800 } = options
  const [label, setLabel] = useState('')
  const timers = useRef({ delay: null, rotate: null })

  useEffect(() => {
    const clearTimers = () => {
      clearTimeout(timers.current.delay)
      clearInterval(timers.current.rotate)
      timers.current.delay = null
      timers.current.rotate = null
    }

    if (!isLoading) {
      clearTimers()
      setLabel('')
      return clearTimers
    }

    timers.current.delay = setTimeout(() => {
      let i = 0
      setLabel(messages[0])
      timers.current.rotate = setInterval(() => {
        i = (i + 1) % messages.length
        setLabel(messages[i])
      }, rotateMs)
    }, delayMs)

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  return label
}