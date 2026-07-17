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
            className={`group flex flex-col items-start gap-3 rounded-xl2 p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${
              cat.premium
                ? 'bg-secondary-bg border border-dusk-violet/30 hover:border-dusk-violet/60 hover:shadow-warm col-span-2 sm:col-span-3'
                : 'glass hover:bg-secondary-bg/70 hover:border-dusk-violet/40 hover:shadow-warm'
            }`}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-full transition-transform duration-200 group-hover:scale-105 ${
                cat.premium
                  ? 'bg-dusk-violet text-white'
                  : 'bg-secondary-bg text-mist'
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
