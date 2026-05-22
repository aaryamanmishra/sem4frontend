import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Cards() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-light p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-secondary mb-6">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Virtual Cards</h2>
          <p className="text-gray-600">Coming soon - Create and manage virtual cards</p>
        </div>
      </div>
    </div>
  )
}
