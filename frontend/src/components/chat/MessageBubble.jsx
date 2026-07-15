import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-dusk-violet via-ember-rose to-amber-glow">
          <Sparkles size={12} className="text-void" />
        </span>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed sm:max-w-[65%] ${
          isUser
            ? 'bg-gradient-to-br from-dusk-violet/90 to-ember-rose/80 text-void font-medium rounded-br-md'
            : 'glass text-mist rounded-bl-md'
        }`}
      >
        {content}
      </div>
    </motion.div>
  )
}
