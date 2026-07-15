import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { CATEGORIES } from '../../utils/constants'

export default function CategorySelector({ onSelect, loading }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CATEGORIES.map((cat, i) => {
        const Icon = Icons[cat.icon] || Icons.Sparkles
        return (
          <motion.button
            key={cat.id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(cat.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className={`group flex flex-col items-start gap-3 rounded-xl2 p-5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              cat.premium
                ? 'bg-gradient-to-br from-dusk-violet/20 via-ember-rose/15 to-amber-glow/15 border border-white/15 hover:brightness-110 col-span-2 sm:col-span-3'
                : 'glass hover:bg-white/[0.07] hover:border-dusk-violet/40'
            }`}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-full transition-transform group-hover:scale-105 ${
                cat.premium
                  ? 'bg-gradient-to-br from-dusk-violet via-ember-rose to-amber-glow text-void'
                  : 'bg-white/[0.06] text-mist'
              }`}
            >
              <Icon size={18} />
            </span>
            <div>
              <p className={`font-semibold ${cat.premium ? 'font-display text-lg text-mist' : 'text-mist'}`}>
                {cat.premium ? '✨ Build My Capsule' : cat.label}
              </p>
              {cat.premium && (
                <p className="mt-1 text-sm text-muted">One perfectly curated set, across every category, tuned to today.</p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
