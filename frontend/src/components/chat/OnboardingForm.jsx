import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowRight, User, Mail, Lock, Cake, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import GlassCard from '../common/GlassCard'

const TABS = [
  { id: 'guest', label: 'Continue as Guest' },
  { id: 'signup', label: 'Create Account' },
  { id: 'login', label: 'Log In' },
]

export default function OnboardingForm() {
  const [tab, setTab] = useState('guest')
  const [serverError, setServerError] = useState('')
  const { startGuest, signup, login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      if (tab === 'guest') {
        await startGuest({ name: data.name, age: Number(data.age), region: data.region || null })
      } else if (tab === 'signup') {
        await signup({
          name: data.name,
          age: Number(data.age),
          email: data.email,
          password: data.password,
          region: data.region || null,
        })
      } else {
        await login({ email: data.email, password: data.password })
      }
      navigate('/conversation')
    } catch (err) {
      setServerError(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-5 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-3xl text-mist mb-2">Let's set the scene</h1>
        <p className="text-sm text-muted mb-7">
          A little about you helps Mood Capsule recommend things that actually fit — not just what's trending.
        </p>

        <GlassCard className="p-1.5 mb-6 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl2 py-2 text-xs font-semibold transition-colors ${
                tab === t.id ? 'bg-secondary-bg text-mist' : 'text-muted hover:text-mist'
              }`}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </GlassCard>

        <GlassCard className="p-6 sm:p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {tab !== 'login' && (
              <div>
                <label className="label-text mb-1.5 block">Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    className="input-field pl-11"
                    placeholder="What should I call you?"
                    {...register('name', { required: 'Name is required' })}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
              </div>
            )}

            {tab !== 'login' && (
              <div>
                <label className="label-text mb-1.5 block">Age</label>
                <div className="relative">
                  <Cake size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="number"
                    className="input-field pl-11"
                    placeholder="Used to keep recommendations age-appropriate"
                    {...register('age', {
                      required: 'Age is required',
                      min: { value: 5, message: 'Age must be at least 5' },
                      max: { value: 120, message: 'Please enter a valid age' },
                    })}
                  />
                </div>
                {errors.age && <p className="mt-1 text-xs text-error">{errors.age.message}</p>}
              </div>
            )}

            {tab !== 'login' && (
              <div>
                <label className="label-text mb-1.5 block">Region (optional)</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input className="input-field pl-11" placeholder="e.g. India, USA, UK" {...register('region')} />
                </div>
              </div>
            )}

            {tab !== 'guest' && (
              <div>
                <label className="label-text mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    className="input-field pl-11"
                    placeholder="you@example.com"
                    {...register('email', { required: 'Email is required' })}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
              </div>
            )}

            {tab !== 'guest' && (
              <div>
                <label className="label-text mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    className="input-field pl-11"
                    placeholder={tab === 'signup' ? 'At least 8 characters' : '••••••••'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: tab === 'signup' ? { value: 8, message: 'At least 8 characters' } : undefined,
                    })}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
              </div>
            )}

            {serverError && <p className="text-xs text-error">{serverError}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full group mt-2">
              {isSubmitting ? 'One moment…' : tab === 'login' ? 'Log In' : 'Continue'}
              {!isSubmitting && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>
        </GlassCard>

        <p className="mt-5 text-center text-xs text-muted">
          Guest mode keeps everything local to this device's session — no email required.
        </p>
      </motion.div>
    </div>
  )
}
