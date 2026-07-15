import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookmarkX } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import FloatingOrbs from '../components/landing/FloatingOrbs'
import Loader from '../components/common/Loader'
import MoodCapsuleCard from '../components/capsule/MoodCapsuleCard'
import RecommendationCard from '../components/recommendations/RecommendationCard'
import { listSavedCapsules, listSavedRecommendations } from '../api/recommendations'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function SavedCapsules() {
  const { user } = useAuth()
  const [capsules, setCapsules] = useState(null)
  const [recs, setRecs] = useState(null)

  useEffect(() => {
    if (!user) return
    listSavedCapsules().then((r) => setCapsules(r.items))
    listSavedRecommendations().then((r) => setRecs(r.items))
  }, [user])

  if (!user) return <Navigate to="/start" replace />

  const loading = capsules === null || recs === null

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />
        <div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8">
          <h1 className="font-display text-3xl text-mist mb-1">Your saved moments</h1>
          <p className="text-sm text-muted mb-10">Capsules and picks you've kept for later.</p>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader label="Gathering your saves" />
            </div>
          ) : (
            <>
              <section className="mb-16">
                <h2 className="font-display text-xl text-mist mb-5">Saved Capsules</h2>
                {capsules.length === 0 ? (
                  <EmptyState label="No saved capsules yet — generate one from a conversation and tap Save." />
                ) : (
                  <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                    {capsules.map((s, i) => (
                      <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <MoodCapsuleCard capsule={s.mood_capsule} userName={user.name} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl text-mist mb-5">Saved Recommendations</h2>
                {recs.length === 0 ? (
                  <EmptyState label="Nothing saved yet — tap the bookmark icon on any recommendation." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recs.map((r, i) => (
                      <RecommendationCard
                        key={r._id}
                        item={r.recommendation}
                        category={r.category}
                        onSave={() => {}}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 py-12 text-center">
      <BookmarkX size={22} className="text-muted" />
      <p className="max-w-xs text-sm text-muted">{label}</p>
    </div>
  )
}
