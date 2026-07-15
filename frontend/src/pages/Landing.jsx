import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Hero from '../components/landing/Hero'
import { CATEGORIES } from '../utils/constants'

export default function Landing() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <Hero />

      <section className="relative mx-auto max-w-5xl px-6 pb-28">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="label-text mb-6 text-center"
        >
          One conversation, every kind of comfort
        </motion.p>
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.filter((c) => !c.premium).map((cat, i) => {
            const Icon = Icons[cat.icon] || Icons.Sparkles
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="glass flex items-center gap-2 rounded-capsule px-4 py-2 text-sm text-muted"
              >
                <Icon size={14} />
                {cat.label}
              </motion.div>
            )
          })}
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06] py-8">
        <p className="text-center text-xs text-muted">
          Mood Capsule &middot; built with care, refined by your taste.
        </p>
      </footer>
    </div>
  )
}
