import RecommendationCard from './RecommendationCard'
import ExploreSection from './ExploreSection'

export default function RecommendationGrid({ result, onSave }) {
  if (!result) return null
  const { category, label, mood_read, primary, explore, has_explore_section } = result

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-xl text-mist">{label}</h3>
        {mood_read && <p className="mt-1 text-sm text-muted">{mood_read}</p>}
      </div>

      {primary?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {primary.map((item, i) => (
            <RecommendationCard key={`${item.title}-${i}`} item={item} category={category} onSave={onSave} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Nothing came through for this one — try refining your mood a little.</p>
      )}

      {has_explore_section && <ExploreSection items={explore} category={category} onSave={onSave} />}
    </div>
  )
}
