import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import { BOOK_GENRES, GENRES, MOVIE_LANGUAGES, MUSIC_LANGUAGES } from '../../utils/constants'

function ChipGroup({ options, value, onChange }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => toggle(opt)}
          className={`chip ${value.includes(opt) ? 'chip-active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function PreferencesForm({ onComplete, submitting }) {
  const [artistInput, setArtistInput] = useState('')
  const [authorInput, setAuthorInput] = useState('')

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      movie_languages: [],
      music_languages: [],
      favourite_genres: [],
      favourite_artists: [],
      favourite_book_genres: [],
      favourite_authors: [],
    },
  })

  const artists = watch('favourite_artists')
  const authors = watch('favourite_authors')

  const addTag = (field, input, setInput, current) => {
    const trimmed = input.trim()
    if (trimmed && !current.includes(trimmed)) {
      setValue(field, [...current, trimmed])
    }
    setInput('')
  }

  const removeTag = (field, current, tag) => {
    setValue(field, current.filter((t) => t !== tag))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <GlassCard className="p-6 sm:p-8">
        <h2 className="font-display text-2xl text-mist mb-1">A quick taste check</h2>
        <p className="text-sm text-muted mb-7">
          This shapes what feels familiar in your recommendations — everything else, we'll figure out from how you're feeling today.
        </p>

        <form onSubmit={handleSubmit(onComplete)} className="space-y-7">
          <div>
            <label className="label-text mb-2.5 block">Favourite movie languages</label>
            <Controller
              name="movie_languages"
              control={control}
              render={({ field }) => <ChipGroup options={MOVIE_LANGUAGES} value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div>
            <label className="label-text mb-2.5 block">Favourite music languages</label>
            <Controller
              name="music_languages"
              control={control}
              render={({ field }) => <ChipGroup options={MUSIC_LANGUAGES} value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div>
            <label className="label-text mb-2.5 block">Favourite genres</label>
            <Controller
              name="favourite_genres"
              control={control}
              render={({ field }) => <ChipGroup options={GENRES} value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div>
            <label className="label-text mb-2.5 block">Favourite artists <span className="normal-case text-muted/70">(optional)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {artists.map((a) => (
                <span key={a} className="chip chip-active" onClick={() => removeTag('favourite_artists', artists, a)}>
                  {a} ✕
                </span>
              ))}
            </div>
            <input
              className="input-field"
              placeholder="Type an artist and press Enter"
              value={artistInput}
              onChange={(e) => setArtistInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag('favourite_artists', artistInput, setArtistInput, artists)
                }
              }}
            />
          </div>

          <div>
            <label className="label-text mb-2.5 block">Favourite book genres</label>
            <Controller
              name="favourite_book_genres"
              control={control}
              render={({ field }) => <ChipGroup options={BOOK_GENRES} value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div>
            <label className="label-text mb-2.5 block">Favourite authors <span className="normal-case text-muted/70">(optional)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {authors.map((a) => (
                <span key={a} className="chip chip-active" onClick={() => removeTag('favourite_authors', authors, a)}>
                  {a} ✕
                </span>
              ))}
            </div>
            <input
              className="input-field"
              placeholder="Type an author and press Enter"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag('favourite_authors', authorInput, setAuthorInput, authors)
                }
              }}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full group">
            {submitting ? 'Saving…' : 'Start the conversation'}
            {!submitting && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  )
}
