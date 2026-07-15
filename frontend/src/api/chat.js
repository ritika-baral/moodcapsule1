import api from './axios'

export const fetchGreeting = () => api.get('/api/chat/greeting').then((r) => r.data)

export const submitOnboarding = (payload) => api.post('/api/chat/onboarding', payload).then((r) => r.data)

export const createSession = () => api.post('/api/chat/session').then((r) => r.data)

export const fetchSession = (sessionId) => api.get(`/api/chat/session/${sessionId}`).then((r) => r.data)
