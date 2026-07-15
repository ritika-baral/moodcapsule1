import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Start from './pages/Start'
import Conversation from './pages/Conversation'
import SavedCapsules from './pages/SavedCapsules'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/start" element={<Start />} />
      <Route path="/conversation" element={<Conversation />} />
      <Route path="/saved" element={<SavedCapsules />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
