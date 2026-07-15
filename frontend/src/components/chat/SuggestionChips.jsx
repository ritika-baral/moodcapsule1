import { motion } from 'framer-motion'
import { SUGGESTION_PROMPTS } from '../../utils/constants'

export default function SuggestionChips({ onPick, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTION_PROMPTS.map((prompt, i) => (
        <motion.button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(prompt)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          className="chip disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  )
}
