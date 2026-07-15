import Navbar from '../components/common/Navbar'
import OnboardingForm from '../components/chat/OnboardingForm'
import FloatingOrbs from '../components/landing/FloatingOrbs'

export default function Start() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />
        <OnboardingForm />
      </div>
    </div>
  )
}
