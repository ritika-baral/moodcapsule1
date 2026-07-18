import api from './axios'

export const getRecommendations = ({ sessionId, category, refinement }) =>
  api
    .post('/api/recommendations', { session_id: sessionId, category, refinement: refinement || null })
    .then((r) => r.data)

export const saveRecommendation = ({ sessionId, category, recommendation }) =>
  api
    .post('/api/saved/recommendation', { session_id: sessionId, category, recommendation })
    .then((r) => r.data)

export const listSavedRecommendations = () => api.get('/api/saved/recommendations').then((r) => r.data)
