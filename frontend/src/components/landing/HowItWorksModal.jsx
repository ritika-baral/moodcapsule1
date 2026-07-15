import { AnimatePresence, motion } from 'framer-motion'
import { X, MessageCircleHeart, Wand2, PackageOpen } from 'lucide-react'

const STEPS = [
  {
    icon: MessageCircleHeart,
    title: 'Tell it how you feel',
    body: "Start a real conversation. No forms, no sliders — just talk about your day, your mood, or what you're craving right now.",
  },
  {
    icon: Wand2,
    title: 'It reasons, not matches keywords',
    body: 'Gemini weighs your current emotion alongside your taste, language and age — then reasons through what would genuinely feel right, in that priority order.',
  },
  {
    icon: PackageOpen,
    title: 'Open your capsule',
    body: 'Get recommendations across movies, music, books and more, plus a poetic Mood Capsule that captures today — yours to save and revisit.',
  },
]

export default function HowItWorksModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card relative w-full max-w-lg p-7 sm:p-9"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-muted hover:text-mist hover:bg-white/[0.06] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="font-display text-2xl text-mist mb-1">How Mood Capsule works</h2>
            <p className="text-sm text-muted mb-7">Three steps between how you feel and what you'll love.</p>

            <div className="space-y-6">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-dusk-violet/25 via-ember-rose/25 to-amber-glow/25 border border-white/10 text-mist">
                      <step.icon size={17} />
                    </span>
                    {i < STEPS.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-white/10" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-semibold text-mist mb-1">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn-primary mt-2 w-full">
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
