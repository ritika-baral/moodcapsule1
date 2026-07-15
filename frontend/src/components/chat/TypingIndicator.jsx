import { Sparkles } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-dusk-violet via-ember-rose to-amber-glow">
        <Sparkles size={12} className="text-void" />
      </span>
      <div className="glass flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" />
      </div>
    </div>
  )
}
