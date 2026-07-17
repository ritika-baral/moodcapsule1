import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

// Splits AI text into paragraph / bullet-list blocks so that suggestion lists
// (lines starting with "- ", "* ", or "• ") render as a real <ul>, while
// normal conversational replies stay as flowing paragraphs.
function renderContent(content) {
  if (!content) return content

  const lines = content.split('\n')
  const blocks = []
  let paragraph = []
  let list = []

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'ul', items: list })
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.*)/)
    if (bullet) {
      flushParagraph()
      list.push(bullet[1])
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()

  // Keep the common case (a short plain-text message) rendering exactly as
  // before — no extra wrapper markup.
  if (blocks.length === 1 && blocks[0].type === 'p') {
    return blocks[0].text
  }

  return blocks.map((block, i) =>
    block.type === 'ul' ? (
      <ul key={i} className="list-disc pl-5 space-y-1">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    ) : (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
        {block.text}
      </p>
    ),
  )
}

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
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-dusk-violet">
          <Sparkles size={12} className="text-white" />
        </span>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed sm:max-w-[65%] ${
          isUser
            ? 'bg-dusk-violet text-white font-medium rounded-br-md shadow-warm'
            : 'bg-plum-light border border-lavender-border text-mist rounded-bl-md shadow-soft'
        }`}
      >
        {renderContent(content)}
      </div>
    </motion.div>
  )
}
