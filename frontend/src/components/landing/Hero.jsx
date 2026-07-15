import { motion } from 'framer-motion'
import { ArrowRight, CircleHelp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import FloatingOrbs from './FloatingOrbs'
import HowItWorksModal from './HowItWorksModal'

export default function Hero() {
  const navigate = useNavigate()
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-6">
      <FloatingOrbs />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-capsule glass px-4 py-1.5 text-xs font-medium tracking-wide text-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-teal-quiet animate-pulse" />
          Powered by Google Gemini &middot; understands mood, not just history
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-6xl leading-[1.05] text-mist sm:text-7xl md:text-8xl"
        >
          Mood Capsule
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-6 max-w-lg font-display italic text-xl text-muted sm:text-2xl"
        >
          Built around your mood. Refined by your taste.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button onClick={() => navigate('/start')} className="btn-primary group w-full sm:w-auto">
            Start Conversation
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => setHowItWorksOpen(true)} className="btn-secondary w-full sm:w-auto">
            <CircleHelp size={16} />
            How It Works
          </button>
        </motion.div>
      </div>

      <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
    </section>
  )
}
