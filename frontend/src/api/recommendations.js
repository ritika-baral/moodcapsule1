import api from './axios'

export const getRecommendations = ({ sessionId, category, refinement }) =>
  api
    .post('/api/recommendations', { session_id: sessionId, category, refinement: refinement || null })
    .then((r) => r.data)

export const generateCapsule = (sessionId) =>
  api.post('/api/capsule/generate', { session_id: sessionId }).then((r) => r.data)

export const saveCapsule = (sessionId) => api.post(`/api/capsule/${sessionId}/save`).then((r) => r.data)

export const saveRecommendation = ({ sessionId, category, recommendation }) =>
  api
    .post('/api/saved/recommendation', { session_id: sessionId, category, recommendation })
    .then((r) => r.data)

export const listSavedRecommendations = () => api.get('/api/saved/recommendations').then((r) => r.data)

export const listSavedCapsules = () => api.get('/api/saved/capsules').then((r) => r.data)
