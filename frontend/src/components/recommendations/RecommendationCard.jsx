import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import * as Icons from 'lucide-react'
import { CATEGORIES } from '../../utils/constants'

function getImageUrl(media) {
  if (!media) return null
  return media.poster_url || media.cover_url || media.album_art_url || media.thumbnail_url || null
}

function getSubline(category, item, media) {
  if (category === 'movies' || category === 'tv_shows') {
    const bits = []
    if (media?.year) bits.push(media.year)
    if (media?.rating) bits.push(`★ ${Number(media.rating).toFixed(1)}`)
    if (item.language) bits.push(item.language)
    return bits.join(' · ')
  }
  if (category === 'music') {
    return media?.artists?.join(', ') || item.subtitle
  }
  if (category === 'books') {
    return media?.authors?.join(', ') || item.subtitle
  }
  if (category === 'podcasts') {
    return media?.publisher || item.subtitle
  }
  return item.subtitle
}

export default function RecommendationCard({ item, category, onSave, index = 0 }) {
  const [saved, setSaved] = useState(false)
  const media = item.media
  const imageUrl = getImageUrl(media)
  const isTextForward = ['activities', 'journal_prompts', 'quotes', 'games'].includes(category)
  const categoryMeta = CATEGORIES.find((c) => c.id === category)
  const Icon = Icons[categoryMeta?.icon] || Icons.Sparkles

  const handleSave = () => {
    setSaved(true)
    onSave?.(item)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass-card group flex flex-col overflow-hidden"
    >
      {!isTextForward && (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-dusk-violet/25 via-ember-rose/20 to-amber-glow/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Icon size={30} className="text-mist/50" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-void/80 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-5">
        {isTextForward && (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-mist mb-1">
            <Icon size={16} />
          </span>
        )}

        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-semibold text-mist ${isTextForward ? 'font-display text-lg' : ''}`}>{item.title}</h3>
          <button
            onClick={handleSave}
            disabled={saved}
            className="shrink-0 text-muted transition-colors hover:text-amber-glow disabled:text-amber-glow"
            aria-label="Save recommendation"
          >
            {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
          </button>
        </div>

        {getSubline(category, item, media) && (
          <p className={`text-sm text-muted ${isTextForward ? 'font-display italic leading-relaxed' : ''}`}>
            {getSubline(category, item, media)}
          </p>
        )}

        {item.why && !isTextForward && <p className="mt-1 text-xs leading-relaxed text-muted/80">{item.why}</p>}

        {(item.genre || item.language) && !isTextForward && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
            {item.language && (
              <span className="rounded-capsule bg-white/[0.05] px-2.5 py-1 text-[0.7rem] text-muted">{item.language}</span>
            )}
            {item.genre && (
              <span className="rounded-capsule bg-white/[0.05] px-2.5 py-1 text-[0.7rem] text-muted">{item.genre}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
