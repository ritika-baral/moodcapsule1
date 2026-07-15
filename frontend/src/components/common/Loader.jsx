export default function Loader({ label = 'Thinking' }) {
  return (
    <div className="flex items-center gap-2 text-muted text-sm">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-dusk-violet animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-ember-rose animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-glow animate-bounce" />
      </span>
      <span>{label}&hellip;</span>
    </div>
  )
}
