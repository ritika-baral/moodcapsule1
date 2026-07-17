import { motion } from 'framer-motion'
import { Sparkles, LogOut, BookmarkCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { resetSession } = useChat()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    resetSession()
    navigate('/')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="glass border-x-0 border-t-0 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-dusk-violet via-ember-rose to-amber-glow shadow-[0_4px_16px_rgba(199,184,232,0.35)] transition-transform group-hover:scale-105">
              <Sparkles size={15} className="text-primary-text" />
            </span>
            <span className="font-display text-lg tracking-tight text-mist">Mood Capsule</span>
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/saved"
                className="hidden items-center gap-1.5 text-sm text-muted transition-colors hover:text-mist sm:flex"
              >
                <BookmarkCheck size={16} />
                Saved
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-muted sm:inline">Hi, {user.name?.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="grid h-9 w-9 place-items-center rounded-full glass text-muted transition-colors hover:text-ember-rose"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link to="/start" className="btn-primary !px-5 !py-2 text-sm">
                Start Conversation
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
