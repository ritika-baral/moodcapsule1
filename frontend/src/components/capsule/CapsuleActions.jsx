import { motion } from 'framer-motion'
import { BookmarkPlus, Check, Loader2, Shuffle, Heart, PartyPopper, Feather } from 'lucide-react'
import { useState } from 'react'
import { REFINEMENTS } from '../../utils/constants'

const ICONS = {
  different: Shuffle,
  less_emotional: Feather,
  more_comforting: Heart,
  more_exciting: PartyPopper,
}

export default function CapsuleActions({ onRefine, onSave, refining, saved }) {
  const [justSaved, setJustSaved] = useState(saved)

  const handleSave = async () => {
    await onSave()
    setJustSaved(true)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {REFINEMENTS.map((r) => {
        const Icon = ICONS[r.id] || Shuffle
        return (
          <motion.button
            key={r.id}
            whileTap={{ scale: 0.96 }}
            disabled={refining}
            onClick={() => onRefine(r.id)}
            className="chip disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refining ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
            {r.label}
          </motion.button>
        )
      })}

      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={justSaved}
        onClick={handleSave}
        className="chip chip-active disabled:cursor-default"
      >
        {justSaved ? <Check size={13} /> : <BookmarkPlus size={13} />}
        {justSaved ? 'Saved' : 'Save this capsule'}
      </motion.button>
    </div>
  )
}
