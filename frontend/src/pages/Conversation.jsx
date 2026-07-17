import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Layers } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import FloatingOrbs from '../components/landing/FloatingOrbs'
import Loader from '../components/common/Loader'
import PreferencesForm from '../components/chat/PreferencesForm'
import ChatWindow from '../components/chat/ChatWindow'
import CategorySelector from '../components/recommendations/CategorySelector'
import RecommendationGrid from '../components/recommendations/RecommendationGrid'
import MoodCapsuleCard from '../components/capsule/MoodCapsuleCard'
import CapsuleActions from '../components/capsule/CapsuleActions'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useSlowLoadingLabel } from '../hooks/useSlowLoadingLabel'
import { fetchGreeting, submitOnboarding } from '../api/chat'
import { generateCapsule, getRecommendations, saveCapsule, saveRecommendation } from '../api/recommendations'
import { CATEGORIES } from '../utils/constants'

export default function Conversation() {
  const { user, updateLocalUser } = useAuth()
  const {
    sessionId,
    stage,
    setStage,
    selectedCategory,
    setSelectedCategory,
    recommendations,
    setRecommendations,
    moodCapsule,
    setMoodCapsule,
    resetForNewMood,
  } = useChat()

  const [greeting, setGreeting] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [loadingCapsule, setLoadingCapsule] = useState(false)
  const [refining, setRefining] = useState(false)

  // '' for the first ~2s (fast case looks exactly as before); after that,
  // rotates through friendly status text until the request resolves.
  const recsSlowLabel = useSlowLoadingLabel(loadingRecs)
  const capsuleSlowLabel = useSlowLoadingLabel(loadingCapsule)

  useEffect(() => {
    if (user?.onboarding_complete && stage === 'onboarding') {
      setStage('conversation')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (stage === 'conversation' && !greeting) {
      fetchGreeting()
        .then((r) => setGreeting(r.greeting))
        .catch(() => setGreeting(`Hi ${user?.name || 'there'}, how are you feeling right now?`))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  if (!user) return <Navigate to="/start" replace />

  const handlePreferencesComplete = async (data) => {
    setSavingPrefs(true)
    try {
      await submitOnboarding({ name: user.name, age: user.age, region: user.region, preferences: data })
      updateLocalUser({ onboarding_complete: true, preferences: data })
      setStage('conversation')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleSelectCategory = async (category) => {
    setSelectedCategory(category)
    setLoadingRecs(true)
    try {
      const res = await getRecommendations({ sessionId, category })
      setRecommendations(res.result)
      setStage('recommendations')
    } finally {
      setLoadingRecs(false)
    }
  }

  const handleGenerateCapsule = async () => {
    setLoadingCapsule(true)
    try {
      const res = await generateCapsule(sessionId)
      setMoodCapsule(res.mood_capsule)
      setStage('capsule')
    } finally {
      setLoadingCapsule(false)
    }
  }

  const handleRefine = async (refinementId) => {
    setRefining(true)
    try {
      const res = await getRecommendations({ sessionId, category: selectedCategory, refinement: refinementId })
      setRecommendations(res.result)
      const capsuleRes = await generateCapsule(sessionId)
      setMoodCapsule(capsuleRes.mood_capsule)
    } finally {
      setRefining(false)
    }
  }

  const handleSaveCapsule = () => saveCapsule(sessionId)

  const handleSaveRecommendation = (category) => (item) =>
    saveRecommendation({ sessionId, category, recommendation: item })

  const isBuildAll = selectedCategory === 'build_my_capsule'

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-3xl px-5 pt-8 sm:px-8">
          <AnimatePresence mode="wait">
            {stage === 'onboarding' && (
              <motion.div key="prefs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PreferencesForm onComplete={handlePreferencesComplete} submitting={savingPrefs} />
              </motion.div>
            )}

            {stage === 'conversation' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="font-display text-2xl text-mist mb-1">
                  {greeting ? "Let's talk" : 'Getting settled…'}
                </h1>
                <p className="text-sm text-muted mb-6">Tell me what's going on — I'm listening.</p>
                <ChatWindow greeting={greeting} />
              </motion.div>
            )}

            {stage === 'category' && (
              <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => setStage('conversation')}
                  className="mb-5 flex items-center gap-1.5 text-sm text-muted hover:text-mist transition-colors"
                >
                  <ArrowLeft size={14} /> Back to conversation
                </button>
                <h1 className="font-display text-2xl text-mist mb-1">What would help right now?</h1>
                <p className="text-sm text-muted mb-6">Pick a category, or let me bring everything together.</p>
                {loadingRecs ? (
                  <div className="flex justify-center py-16">
                    <Loader label={recsSlowLabel || 'Curating your picks'} />
                  </div>
                ) : (
                  <CategorySelector onSelect={handleSelectCategory} loading={loadingRecs} />
                )}
              </motion.div>
            )}

            {stage === 'recommendations' && (
              <motion.div key="recs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => setStage('category')}
                  className="mb-5 flex items-center gap-1.5 text-sm text-muted hover:text-mist transition-colors"
                >
                  <ArrowLeft size={14} /> Choose a different category
                </button>

                {isBuildAll ? (
                  <div className="space-y-12">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={16} className="text-amber-glow" />
                      <h1 className="font-display text-2xl text-mist">Your full capsule</h1>
                    </div>
                    {CATEGORIES.filter((c) => !c.premium).map((c) => (
                      <RecommendationGrid
                        key={c.id}
                        result={recommendations?.[c.id]}
                        onSave={handleSaveRecommendation(c.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <RecommendationGrid result={recommendations} onSave={handleSaveRecommendation(selectedCategory)} />
                )}

                <div className="mt-12 flex justify-center">
                  <button onClick={handleGenerateCapsule} disabled={loadingCapsule} className="btn-primary">
                    {loadingCapsule ? capsuleSlowLabel || 'Sealing your capsule…' : 'Reveal my Mood Capsule'}
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 'capsule' && (
              <motion.div key="capsule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => setStage('recommendations')}
                  className="mb-6 flex items-center gap-1.5 text-sm text-muted hover:text-mist transition-colors"
                >
                  <ArrowLeft size={14} /> Back to recommendations
                </button>

                <MoodCapsuleCard capsule={moodCapsule} userName={user?.name} />

                <div className="mt-8">
                  <CapsuleActions onRefine={handleRefine} onSave={handleSaveCapsule} refining={refining} />
                </div>

                <div className="mt-14">
                  <p className="label-text mb-3 text-center">Keep talking, I'm here</p>
                  <ChatWindow greeting="" showReadyButton={false} />
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => {
                      resetForNewMood()
                    }}
                    className="btn-secondary"
                  >
                    Start a fresh mood check-in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
