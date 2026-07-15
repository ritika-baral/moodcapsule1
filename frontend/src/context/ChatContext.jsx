import { createContext, useCallback, useContext, useState } from 'react'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', content }
  const [stage, setStage] = useState('onboarding') // 'onboarding' | 'conversation' | 'category' | 'recommendations' | 'capsule'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [recommendations, setRecommendations] = useState(null) // { category, label, mood_read, primary, explore, has_explore_section } OR full-capsule dict
  const [moodCapsule, setMoodCapsule] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const updateLastAssistantMessage = useCallback((content) => {
    setMessages((prev) => {
      const next = [...prev]
      const lastIdx = next.length - 1
      if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
        next[lastIdx] = { ...next[lastIdx], content }
      }
      return next
    })
  }, [])

  const resetSession = useCallback(() => {
    setSessionId(null)
    setMessages([])
    setStage('onboarding')
    setSelectedCategory(null)
    setRecommendations(null)
    setMoodCapsule(null)
    setIsStreaming(false)
  }, [])

  const resetForNewMood = useCallback(() => {
    setStage('conversation')
    setSelectedCategory(null)
    setRecommendations(null)
    setMoodCapsule(null)
  }, [])

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        setSessionId,
        messages,
        setMessages,
        appendMessage,
        updateLastAssistantMessage,
        stage,
        setStage,
        selectedCategory,
        setSelectedCategory,
        recommendations,
        setRecommendations,
        moodCapsule,
        setMoodCapsule,
        isStreaming,
        setIsStreaming,
        resetSession,
        resetForNewMood,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
