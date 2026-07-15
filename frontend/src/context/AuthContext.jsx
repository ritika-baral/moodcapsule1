import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchMe, login as loginApi, signup as signupApi, startGuest as startGuestApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mc_user')
    return saved ? JSON.parse(saved) : null
  })
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mc_token')
    if (!token) {
      setInitializing(false)
      return
    }
    fetchMe()
      .then((freshUser) => {
        setUser(freshUser)
        localStorage.setItem('mc_user', JSON.stringify(freshUser))
      })
      .catch(() => {
        localStorage.removeItem('mc_token')
        localStorage.removeItem('mc_user')
        setUser(null)
      })
      .finally(() => setInitializing(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistSession = useCallback((data) => {
    localStorage.setItem('mc_token', data.access_token)
    localStorage.setItem('mc_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (payload) => persistSession(await signupApi(payload)), [persistSession])

  const login = useCallback(async (payload) => persistSession(await loginApi(payload)), [persistSession])

  const startGuest = useCallback(
    async (payload) => persistSession(await startGuestApi(payload)),
    [persistSession],
  )

  const updateLocalUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem('mc_user', JSON.stringify(next))
      return next
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mc_token')
    localStorage.removeItem('mc_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, initializing, signup, login, startGuest, logout, updateLocalUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
