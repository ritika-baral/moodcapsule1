import { Sparkles } from 'lucide-react'

export default function TypingIndicator({ label }) {
  return (
    <div className="flex items-end gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-dusk-violet">
        <Sparkles size={12} className="text-white" />
      </span>
      <div className="bg-plum-light border border-lavender-border flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3 shadow-soft">
        {label && <span className="text-xs text-muted whitespace-nowrap">{label}</span>}
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-glow animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-glow animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-glow animate-bounce" />
        </span>
      </div>
    </div>
  )
}
