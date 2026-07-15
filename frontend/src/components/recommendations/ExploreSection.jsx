import { Compass } from 'lucide-react'
import RecommendationCard from './RecommendationCard'

export default function ExploreSection({ items, category, onSave }) {
  if (!items?.length) return null

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Compass size={16} className="text-teal-quiet" />
        <h4 className="font-display italic text-lg text-mist">You might also enjoy exploring&hellip;</h4>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <RecommendationCard key={`${item.title}-${i}`} item={item} category={category} onSave={onSave} index={i} />
        ))}
      </div>
    </div>
  )
}
