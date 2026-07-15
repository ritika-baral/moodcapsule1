import { motion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

const SECTIONS = [
  { key: 'todays_vibe', label: "Today's Vibe" },
  { key: 'what_youre_looking_for', label: 'What You\u2019re Looking For' },
  { key: 'emotional_weather', label: 'Your Emotional Weather' },
  { key: 'todays_ai_thought', label: "Today's AI Thought" },
]

export default function MoodCapsuleCard({ capsule, userName }) {
  const [copied, setCopied] = useState(false)
  if (!capsule) return null

  const palette = capsule.palette?.length ? capsule.palette : ['#7C6FEF', '#E8768F', '#F3B559']
  const gradient = `linear-gradient(155deg, ${palette[0]}E6 0%, ${palette[1] || palette[0]}CC 50%, ${
    palette[2] || palette[1] || palette[0]
  }B3 100%)`

  const handleCopy = async () => {
    const text = SECTIONS.map((s) => `${s.label}: ${capsule[s.key]}`).join('\n')
    try {
      await navigator.clipboard.writeText(`✨ ${userName ? `${userName}'s` : 'My'} Mood Capsule\n\n${text}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available — silently ignore */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto w-full max-w-md"
    >
      <div
        className="relative overflow-hidden rounded-capsule border border-white/15 p-9 shadow-[0_20px_80px_rgba(0,0,0,0.45)] animate-breathe sm:p-11"
        style={{ background: gradient }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -right-8 h-44 w-44 rounded-full bg-black/10 blur-2xl" />

        <p className="relative mb-7 text-center text-xs font-semibold uppercase tracking-[0.2em] text-void/70">
          {userName ? `${userName}'s Mood Capsule` : 'Your Mood Capsule'}
        </p>

        <div className="relative space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.key} className="text-center">
              <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-void/60">{s.label}</p>
              <p className="font-display text-lg italic leading-snug text-void sm:text-xl">{capsule[s.key]}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="btn-secondary mx-auto mt-5 flex !w-fit text-xs"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied to clipboard' : 'Copy capsule as text'}
      </button>
    </motion.div>
  )
}
