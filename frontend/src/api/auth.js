import api from './axios'

export const signup = (payload) => api.post('/api/auth/signup', payload).then((r) => r.data)

export const login = (payload) => api.post('/api/auth/login', payload).then((r) => r.data)

export const startGuest = (payload) => api.post('/api/auth/guest', payload).then((r) => r.data)

export const fetchMe = () => api.get('/api/auth/me').then((r) => r.data)
